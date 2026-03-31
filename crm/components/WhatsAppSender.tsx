import React, { useEffect, useMemo, useState } from 'react';

import { AlertTriangle, History, MessageCircle, PhoneCall, Search, ShieldCheck, Users, Info } from 'lucide-react';

import { collection, query, orderBy, getDocs } from 'firebase/firestore';

import { db } from '../../firebase';



type SendHistoryItem = {

  id: string;

  phone: string;

  name: string;

  message: string;

  ok: boolean;

  createdAt: string;

  responseId?: string;

};



const HISTORY_STORAGE_KEY = 'crm_whatsapp_send_history';

const RECOMMENDED_BULK_LIMIT = 120;

const RECOMMENDED_WEEK_LIMIT = 1000;

const RECOMMENDED_MONTH_LIMIT = 4000;



const getResolvedApiKey = (apiKey = '') => {

  return (

    apiKey ||

    (import.meta as any)?.env?.VITE_WPP_API_KEY?.trim?.() ||

    (import.meta as any)?.env?.VITE_X_API_KEY?.trim?.() ||

    (import.meta as any)?.env?.X_API_KEY?.trim?.() ||

    localStorage.getItem('crm_api_key')?.trim?.() ||

    localStorage.getItem('wpp_api_key')?.trim?.() ||

    ''

  );

};



const getResolvedApiBase = (apiBase = '') => {

  // SEMPRE usar a URL pública da API (não localhost)

  // O servidor deve estar acessível em https://wpp-api.abravacom.com.br

  

  const fallbackBase = 'https://wpp-api.abravacom.com.br';

  const envBase = ((import.meta as any)?.env?.VITE_API_WPP || (import.meta as any)?.env?.VITE_WHATSAPP_API_URL || '').trim();

  

  return (apiBase || envBase || fallbackBase).replace(/\/$/, '');

};



// 🔍 Utilitário para fazer fetch com headers de autenticação

const fetchWithAuth = async (

  url: string, 

  apiKey: string,

  options: RequestInit = {}

) => {

  const headers: Record<string, string> = {

    'Content-Type': 'application/json',

    'Accept': 'application/json',

    ...((options.headers as Record<string, string>) || {})

  };



  // Adicionar API Key nos headers (não em query param - mais seguro)

  if (apiKey) {

    headers['X-API-Key'] = apiKey;

    headers['x-api-key'] = apiKey; // Suportar ambos os casos

  }



  return fetch(url, {

    ...options,

    headers,

    credentials: 'include'

  });

};



const normalizePhone = (phone: string) => String(phone || '').replace(/\D/g, '');



type ConnectionState = 'waiting-qr' | 'restoring' | 'ready' | 'error' | 'initializing';



export const WhatsAppSender: React.FC<{ apiBase?: string; apiKey?: string; campaigns?: any[] }> = ({ apiBase = '', apiKey = '', campaigns = [] }) => {

  const [phone, setPhone] = useState('');

  const [message, setMessage] = useState('');

  const [name, setName] = useState('');

  const [status, setStatus] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  // unified input: recipientsText supports one-line-per-recipient or single phone

  const [recipientsText, setRecipientsText] = useState('');

  const [bulkMinDelaySeconds, setBulkMinDelaySeconds] = useState(15);

  const [bulkMaxDelaySeconds, setBulkMaxDelaySeconds] = useState(45);

  const [showChipInfo, setShowChipInfo] = useState(false);

  const [chipType, setChipType] = useState<'cold'|'warm'|'hot'|'superhot'>('warm');

  const [hoveredChip, setHoveredChip] = useState<string | null>(null);

  const messageInputRef = React.useRef<HTMLTextAreaElement>(null);

  

  // WhatsApp Connection Status

  const [connectionState, setConnectionState] = useState<ConnectionState>('initializing');

  const [whatsappReady, setWhatsappReady] = useState(false);

  const [connectedPhone, setConnectedPhone] = useState<string | null>(null);

  const [connectedName, setConnectedName] = useState<string | null>(null);

  const [qrCode, setQrCode] = useState<string | null>(null);

  const [lastError, setLastError] = useState<string | null>(null);

  const wsRef = React.useRef<WebSocket | null>(null);



  // Bulk send progress tracking

  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });

  const [isBulkSending, setIsBulkSending] = useState(false);



  // Chip type quota limits with friendly names

  const chipLimits = {

    cold: { 

      name: 'Novo', 

      emoji: '📱',

      shortDesc: 'Conta recém-criada',

      day: 50, 

      week: 300, 

      month: 1500, 

      description: 'Número acabou de ser ativado no WhatsApp, sem histórico. Limites rigorosos protegem novos usuários.' 

    },

    warm: { 

      name: 'Em Uso', 

      emoji: '📈',

      shortDesc: 'Conta com alguns envios',

      day: 75, 

      week: 500, 

      month: 2500, 

      description: 'Você já tem algum histórico de mensagens. WhatsApp aumenta os limites gradualmente.' 

    },

    hot: { 

      name: 'Experiente', 

      emoji: '🔍',

      shortDesc: 'Conta estabelecida',

      day: 150, 

      week: 1000, 

      month: 4000, 

      description: 'Sua conta tem boa reputação. Histórico robusto significa que você pode enviar mais.' 

    },

    superhot: { 

      name: 'Veterana', 

      emoji: '⚡',

      shortDesc: 'Conta muito antiga e confiável',

      day: 250, 

      week: 1500, 

      month: 6000, 

      description: 'Sua conta é respeitada pelo WhatsApp. Você pode usar intensamente sem preocupações.' 

    }

  };

  const [historyFilterPhone, setHistoryFilterPhone] = useState('');

  const [historyItems, setHistoryItems] = useState<SendHistoryItem[]>([]);

  const [quotaSummary, setQuotaSummary] = useState({ day: 0, week: 0, month: 0, dayLimit: 100, weekLimit: 700, monthLimit: 3000 });

  // Leads (contacts) from Firestore

  const [leadsList, setLeadsList] = useState<any[]>([]);

  const [leadSearch, setLeadSearch] = useState('');

  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());



  useEffect(() => {

    try {

      const raw = localStorage.getItem(HISTORY_STORAGE_KEY);

      if (!raw) return;

      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) setHistoryItems(parsed);

    } catch (e) {

      console.warn('Falha ao ler historico local de envio WhatsApp.', e);

    }

  }, []);



  const filteredLeads = useMemo(() => {

    const q = (leadSearch || '').trim().toLowerCase();

    if (!q) return leadsList;

    return leadsList.filter(l => {

      const hay = `${(l.name||'') + ' ' + (l.email||'') + ' ' + (l.phone||'')}`.toLowerCase();

      return hay.includes(q);

    });

  }, [leadsList, leadSearch]);



  const toggleSelectedLead = (id: string) => {

    setSelectedLeads(prev => {

      const next = new Set(prev);

      if (next.has(id)) next.delete(id); else next.add(id);

      return next;

    });

  };



  const getSelectedLeadRows = () => {

    if (!selectedLeads || selectedLeads.size === 0) return [];

    return leadsList

      .filter(l => selectedLeads.has(l.id))

      .map(l => {

        const phoneVal = normalizePhone(l.phone || l.phoneNumber || '');

        const nameVal = l.name || l.fullName || '';

        const personalMessage = (message || '').replace(/{{\s*name\s*}}/gi, nameVal || '');

        return { phone: phoneVal, name: nameVal, message: personalMessage };

      })

      .filter(r => normalizePhone(r.phone).length >= 10);

  };



  // Listen for external open event to prefill sender

  useEffect(() => {

    const handler = (ev: any) => {

      try {

        const d = ev?.detail || {};

        if (d.phone) setPhone(d.phone || '');

        if (d.name) setName(d.name || '');

        if (d.message) setMessage(d.message || '');

        if (d.recipientsText) setRecipientsText(d.recipientsText || '');

        window.scrollTo({ top: 0, behavior: 'smooth' });

      } catch (e) {

        // ignore

      }

    };

    window.addEventListener('openWhatsAppSender', handler as EventListener);

    return () => window.removeEventListener('openWhatsAppSender', handler as EventListener);

  }, []);



  const saveHistoryItems = (nextItems: SendHistoryItem[]) => {

    setHistoryItems(nextItems);

    try {

      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(nextItems.slice(0, 600)));

    } catch (e) {

      console.warn('Falha ao salvar historico local de envio WhatsApp.', e);

    }

  };



  const appendHistoryItem = (item: SendHistoryItem) => {

    saveHistoryItems([item, ...historyItems]);

  };



  // ====================  STATUS POLLING VIA HTTP (SEM WEBSOCKET)  ====================

  

  const pollWhatsAppStatus = async () => {

    try {

      const resolvedBase = getResolvedApiBase(apiBase);

      const resolvedKey = getResolvedApiKey(apiKey);

      const statusUrl = `${resolvedBase}/status`;

      

      console.log('[WhatsApp] 📡 Polling:', statusUrl);

      

      const response = await fetchWithAuth(statusUrl, resolvedKey, {

        method: 'GET'

      });

      

      console.log('[WhatsApp] 📡 Response status:', response.status);

      

      if (response.ok) {

        const data = await response.json();

        console.log('[WhatsApp] 📡 Response data:', data);

        if (data.ok || data.ready !== undefined) {

          handleStatusUpdate(data);

        } else {

          console.warn('[WhatsApp] ⚠️ Response não tem ok=true:', data);

        }

      } else {

        console.error(`[WhatsApp] âŒ Status ${response.status}:`, await response.text());

      }

    } catch (err) {

      console.error('[WhatsApp] âŒ Erro ao fazer polling:', err instanceof Error ? err.message : err);

    }

  };

  

  // Poll status a cada 2 segundos

  useEffect(() => {

    console.log('[WhatsApp] ✅ INICIANDO POLLING');

    

    // Poll imediato

    pollWhatsAppStatus();

    

    // E depois a cada 2s

    const pollInterval = setInterval(() => {

      pollWhatsAppStatus();

    }, 2000);

    

    return () => {

      console.log('[WhatsApp] â¹ï¸  PARANDO POLLING');

      clearInterval(pollInterval);

    };

  }, []);

  

  const handleStatusUpdate = (data: any) => {

    console.log('[WhatsApp] 🔍 handleStatusUpdate chamado com:', { 

      ready: data.ready, 

      connectionState: data.connectionState,

      hasQr: !!data.qr,

      qrLength: data.qr?.length

    });

    

    const ready = data.ready || false;

    const state = data.connectionState || 'initializing';

    

    setWhatsappReady(ready);

    setConnectedPhone(data.phone);

    setConnectedName(data.accountName);

    setLastError(data.lastError);

    

    // Atualizar estado de conexão baseado no estado do servidor

    if (ready) {

      console.log('[WhatsApp] ✅ Ready=true, setando para ready');

      setConnectionState('ready');

      setStatus(`✅ Conectado: ${data.phone || 'Desconhecido'} - ${data.accountName || 'Sem nome'}`);

      setQrCode(null);

    } else if (state === 'restoring') {

      console.log('[WhatsApp] 🔍 Estado=restoring');

      setConnectionState('restoring');

      setStatus('🔍 Restaurando sessão...');

      setQrCode(null);

    } else if (state === 'waiting-qr') {

      console.log('[WhatsApp] 📱 Estado=waiting-qr, qrCode disponível?', !!data.qr);

      setConnectionState('waiting-qr');

      if (data.qr) {

        console.log('[WhatsApp] ✅ SETANDO QR CODE!');

        setQrCode(data.qr);

        setStatus('📸 Escaneie o QR code com seu WhatsApp');

      } else {

        console.log('[WhatsApp] âŒ Sem QR code ainda');

        setStatus('â³ Aguardando QR code do servidor...');

      }

    } else if (state === 'error') {

      console.log('[WhatsApp] âŒ Estado=error:', data.lastError);

      setConnectionState('error');

      setStatus(`âŒ Erro: ${data.lastError || 'Desconhecido'}`);

    } else {

      console.log('[WhatsApp] ðŸ¤· Estado desconhecido:', state);

      setConnectionState('initializing');

      setStatus('â³ Inicializando...');

    }

  };



  // WhatsApp formatting helpers

  const insertFormatting = (prefix: string, suffix: string = prefix) => {

    if (!messageInputRef.current) return;

    const textarea = messageInputRef.current;

    const start = textarea.selectionStart;

    const end = textarea.selectionEnd;

    const selected = message.substring(start, end) || 'texto';

    const before = message.substring(0, start);

    const after = message.substring(end);

    const newMessage = `${before}${prefix}${selected}${suffix}${after}`;

    setMessage(newMessage);

    setTimeout(() => {

      textarea.focus();

      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);

    }, 0);

  };



  // Recompute quota summary when history changes or chip type changes

  useEffect(() => {

    try {

      const now = Date.now();

      const dayAgo = now - 24 * 60 * 60 * 1000;

      const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

      const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

      const okItems = historyItems.filter(h => h.ok);

      const day = okItems.filter(h => new Date(h.createdAt).getTime() >= dayAgo).length;

      const week = okItems.filter(h => new Date(h.createdAt).getTime() >= weekAgo).length;

      const month = okItems.filter(h => new Date(h.createdAt).getTime() >= monthAgo).length;

      const limits = chipLimits[chipType];

      setQuotaSummary(q => ({ ...q, day, week, month, dayLimit: limits.day, weekLimit: limits.week, monthLimit: limits.month }));

    } catch (e) {

      // ignore

    }

  }, [historyItems, chipType]);



  // Subscribe to leads/contacts for the Leads picker

  useEffect(() => {

    if (!db) return;



    let mounted = true;

    const qRef = query(collection(db, 'contacts'), orderBy('name'));



    const fetchLeads = async () => {

      try {

        const snap = await getDocs(qRef);

        if (!mounted) return;

        setLeadsList(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));

      } catch (err) {

        console.warn('Erro ao buscar leads do Firestore (getDocs):', err);

      }

    };



    // initial fetch

    fetchLeads();



    // periodic refresh (avoids realtime listener issues when permissions are restricted)

    const t = setInterval(fetchLeads, 30 * 1000);



    return () => {

      mounted = false;

      clearInterval(t);

    };

  }, []);



  // Disconnect WhatsApp account

  const handleDisconnect = async () => {

    if (!confirm('Tem certeza que deseja desconectar a conta WhatsApp?')) return;

    try {

      const resolvedBase = getResolvedApiBase(apiBase);

      const resolvedApiKey = getResolvedApiKey(apiKey);

      const logoutUrl = `${resolvedBase}/logout`;

      

      const resp = await fetchWithAuth(logoutUrl, resolvedApiKey, { method: 'POST' });

      const data = await resp.json();

      

      if (data?.ok) {

        setStatus('✓ Conta desconectada com sucesso. QR code será exibido em breve...');

        setConnectedPhone(null);

        setConnectedName(null);

        setWhatsappReady(false);

        setTimeout(() => pollWhatsAppStatus(), 1000);

      } else {

        setStatus('❌ Erro ao desconectar: ' + (data?.error || 'Desconhecido'));

      }

    } catch (e: any) {

      setStatus('❌ Erro na desconexão: ' + (e?.message || String(e)));

    }

  };



  const sendMessage = async (phoneValue: string, messageValue: string, nameValue = '') => {

    const resolvedBase = getResolvedApiBase(apiBase);

    const resolvedApiKey = getResolvedApiKey(apiKey);

    const sendUrl = `${resolvedBase}/send`;



    const response = await fetchWithAuth(sendUrl, resolvedApiKey, {

      method: 'POST',

      body: JSON.stringify({ phone: normalizePhone(phoneValue), message: messageValue, name: nameValue })

    });



    const text = await response.text();

    let data: any = null;

    try {

      data = text ? JSON.parse(text) : null;

    } catch (_ignored) {

      data = { raw: text };

    }



    if (!response.ok || data?.ok === false) {

      throw new Error(data?.error || response.statusText || text || 'Falha no envio');

    }



    return {

      messageId: data?.messageId || data?.chatId || data?.id || 'ok'

    };

  };



  // Unified parser: recipientsText accepts CSV format (comma or semicolon separated)

  // with phone numbers only, or one phone per line

  const parseRecipients = (text: string) => {

    if (!text) return [];

    // Split by newlines first, then by comma/semicolon to support both formats

    const items = text

      .split(/[\r\n,;]/)

      .map(item => item.trim())

      .filter(item => item.length > 0 && normalizePhone(item).length >= 10);

    

    return items.map((phoneStr) => ({

      phone: phoneStr,

      name: '',

      message

    }));

  };



  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));



  const [scheduleAt, setScheduleAt] = useState('');

  const [scheduling, setScheduling] = useState(false);



  const scheduleEntry = async (phoneValue: string, messageValue: string, nameValue = '', whenIso: string) => {

    const resolvedBase = getResolvedApiBase(apiBase);

    const resolvedApiKey = getResolvedApiKey(apiKey);

    const url = `${resolvedBase}/schedule`;

    const resp = await fetchWithAuth(url, resolvedApiKey, {

      method: 'POST',

      body: JSON.stringify({ phone: normalizePhone(phoneValue), message: messageValue, name: nameValue, scheduledAt: whenIso })

    });

    return resp.json();

  };



  const handleSend = async () => {

    setStatus(null);

    const manualRows = parseRecipients(recipientsText || (phone ? phone : ''));

    const leadRows = getSelectedLeadRows();

    const rows = [...manualRows, ...leadRows];



    if (!rows.length) {

      setStatus('Insira ao menos 1 destinatário válido (uma linha por destinatário).');

      return;

    }



    if (rows.length === 1) {

      const r = rows[0];

      if (!r.phone || !r.message) {

        setStatus('Destino ou mensagem inválida.');

        return;

      }

      setLoading(true);

      try {

        const result = await sendMessage(r.phone, r.message, r.name || '');

        appendHistoryItem({ id: `single_${Date.now()}`, phone: normalizePhone(r.phone), name: r.name || '', message: r.message, ok: true, createdAt: new Date().toISOString(), responseId: result.messageId });

        setStatus(`Enviado com sucesso: id=${result.messageId}`);

      } catch (e: any) {

        appendHistoryItem({ id: `single_err_${Date.now()}`, phone: normalizePhone(r.phone), name: r.name || '', message: r.message, ok: false, createdAt: new Date().toISOString(), responseId: '' });

        setStatus(`Erro no envio: ${e?.message || String(e)}`);

      } finally {

        setLoading(false);

      }

      return;

    }



    // bulk

    await handleSendBulk(rows);

  };



  const [schedulesList, setSchedulesList] = useState<any[]>([]);



  const fetchSchedules = async () => {

    try {

      const resolvedBase = getResolvedApiBase(apiBase);

      const resolvedApiKey = getResolvedApiKey(apiKey);

      const url = `${resolvedBase}/schedules`;

      const r = await fetchWithAuth(url, resolvedApiKey, { method: 'GET' });

      const data = await r.json();

      if (data?.ok && Array.isArray(data.schedules)) setSchedulesList(data.schedules);

    } catch (e) {

      // ignore fetch errors

    }

  };



  useEffect(() => {

    fetchSchedules();

    const t = setInterval(fetchSchedules, 15 * 1000);

    return () => clearInterval(t);

  }, []);



  const sendNowSchedule = async (id: string) => {

    try {

      const resolvedBase = getResolvedApiBase(apiBase);

      const resolvedApiKey = getResolvedApiKey(apiKey);

      const url = `${resolvedBase}/schedules/${encodeURIComponent(id)}/sendnow`;

      const r = await fetchWithAuth(url, resolvedApiKey, { method: 'POST' });

      const d = await r.json();

      if (d?.ok) {

        setStatus('Envio imediato solicitado.');

        fetchSchedules();

      } else {

        setStatus(`Erro: ${d?.error || JSON.stringify(d)}`);

      }

    } catch (e: any) {

      setStatus(`Erro ao enviar agora: ${e?.message || String(e)}`);

    }

  };



  const deleteSchedule = async (id: string) => {

    try {

      const resolvedBase = getResolvedApiBase(apiBase);

      const resolvedApiKey = getResolvedApiKey(apiKey);

      const url = `${resolvedBase}/schedules/${encodeURIComponent(id)}`;

      const r = await fetchWithAuth(url, resolvedApiKey, { method: 'DELETE' });

      const d = await r.json();

      if (d?.ok) {

        setStatus('Agendamento removido.');

        fetchSchedules();

      } else {

        setStatus(`Erro: ${d?.error || JSON.stringify(d)}`);

      }

    } catch (e: any) {

      setStatus(`Erro ao remover agendamento: ${e?.message || String(e)}`);

    }

  };



  const handleScheduleSingle = async () => {

    if (!phone || !message || !scheduleAt) {

      setStatus('Preencha numero, mensagem e data/hora para agendar.');

      return;

    }

    setScheduling(true);

    try {

      const iso = new Date(scheduleAt).toISOString();

      await scheduleEntry(phone, message, name || '', iso);

      setStatus('Agendamento criado com sucesso.');

      fetchSchedules();

    } catch (e: any) {

      setStatus(`Erro ao agendar: ${e?.message || String(e)}`);

    } finally {

      setScheduling(false);

    }

  };



  const handleScheduleBulk = async () => {

    const manualRows = parseRecipients(recipientsText || message || phone);

    const leadRows = getSelectedLeadRows();

    const rows = [...manualRows, ...leadRows];

    if (!rows.length || !scheduleAt) {

      setStatus('Insira destinatários válidos e data/hora para agendar.');

      return;

    }

    setScheduling(true);

    try {

      const iso = new Date(scheduleAt).toISOString();

      for (let i = 0; i < rows.length; i++) {

        const r = rows[i];

        // schedule each recipient

        await scheduleEntry(r.phone, r.message, r.name || '', iso);

      }

      setStatus(`Agendados ${rows.length} envios com sucesso.`);

      fetchSchedules();

    } catch (e: any) {

      setStatus(`Erro ao agendar lote: ${e?.message || String(e)}`);

    } finally {

      setScheduling(false);

    }

  };



  const handleSendBulk = async (rowsArg?: any[]) => {

    setStatus(null);

    const manualRows = parseRecipients(recipientsText || message || phone);

    const leadRows = getSelectedLeadRows();

    const rows = Array.isArray(rowsArg) ? rowsArg : [...manualRows, ...leadRows];

    if (!rows.length) {

      setStatus('Insira ao menos 1 linha valida para envio em massa.');

      return;

    }



    if (rows.length > RECOMMENDED_BULK_LIMIT) {

      setStatus(`Lote com ${rows.length} contatos excede o limite recomendado de ${RECOMMENDED_BULK_LIMIT}. Divida o envio em campanhas menores.`);

      return;

    }



    const minDelay = Math.max(0, Number(bulkMinDelaySeconds) || 0);

    const maxDelay = Math.max(minDelay, Number(bulkMaxDelaySeconds) || minDelay);



    setIsBulkSending(true);

    setLoading(true);

    setBulkProgress({ current: 0, total: rows.length, success: 0, failed: 0 });

    

    // Prevent accidental page close during bulk send

    const preventClose = (e: BeforeUnloadEvent) => {

      e.preventDefault();

      e.returnValue = 'Envio em progresso! Deseja realmente sair?';

      return 'Envio em progresso! Deseja realmente sair?';

    };

    window.addEventListener('beforeunload', preventClose);



    let success = 0;

    let failed = 0;

    try {

      for (let i = 0; i < rows.length; i += 1) {

        const row = rows[i];

        try {

          const result = await sendMessage(row.phone, row.message, row.name);

          success += 1;

          appendHistoryItem({

            id: `bulk_${Date.now()}_${i}`,

            phone: normalizePhone(row.phone),

            name: row.name || '',

            message: row.message,

            ok: true,

            createdAt: new Date().toISOString(),

            responseId: result.messageId

          });

        } catch (sendErr) {

          failed += 1;

          appendHistoryItem({

            id: `bulk_err_${Date.now()}_${i}`,

            phone: normalizePhone(row.phone),

            name: row.name || '',

            message: row.message,

            ok: false,

            createdAt: new Date().toISOString(),

            responseId: ''

          });

        }



        // Update progress

        setBulkProgress({ current: i + 1, total: rows.length, success, failed });



        if (i < rows.length - 1) {

          const delayMs = (minDelay + Math.random() * (maxDelay - minDelay)) * 1000;

          await sleep(delayMs);

        }

      }



      setStatus(`✓ Envio em massa finalizado! Sucesso: ${success} | Falhas: ${failed}`);

    } catch (e: any) {

      setStatus(`❌ Erro no envio em massa: ${e?.message || String(e)}`);

    } finally {

      window.removeEventListener('beforeunload', preventClose);

      setLoading(false);

      setIsBulkSending(false);

      setBulkProgress({ current: 0, total: 0, success: 0, failed: 0 });

    }

  };



  const filteredHistory = useMemo(() => {

    const phoneFilter = normalizePhone(historyFilterPhone);

    if (!phoneFilter) return historyItems;

    return historyItems.filter((item) => normalizePhone(item.phone).includes(phoneFilter));

  }, [historyItems, historyFilterPhone]);



  return (

    <div className="p-6 max-w-6xl mx-auto space-y-6">

      <div className="space-y-2">

        <h2 className="text-2xl font-bold text-slate-900">Envio de WhatsApp</h2>

        <p className="text-sm text-slate-500">Painel com envio unico, envio em massa, boas praticas e historico consolidado.</p>

      </div>



      {/* WhatsApp Connection Status */}

      <div className={`rounded-xl border-2 p-6 shadow-md transition ${whatsappReady ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-green-300' : connectionState === 'initializing' ? 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-300' : 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-300'}`}>

        

        {/* =====  ESTADO: INICIALIZANDO  ===== */}

        {connectionState === 'initializing' ? (

          <div className="space-y-4">

            <div className="flex items-center gap-3">

              <div className="flex-1">

                <h3 className="text-lg font-bold text-slate-900">🔍 Verificando Status do WhatsApp</h3>

                <p className="text-sm text-slate-600 mt-1">Conectando ao servidor e carregando configurações...</p>

              </div>

            </div>

            

            {/* Barra de progresso estilo carregamento */}

            <div className="space-y-2">

              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">

                <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full animate-pulse" style={{

                  animation: 'progress 2s ease-in-out infinite',

                  background: 'linear-gradient(90deg, #60a5fa, #3b82f6, #1d4ed8, #3b82f6, #60a5fa)',

                  backgroundSize: '200% 100%'

                }}></div>

              </div>

              <p className="text-xs text-slate-500 text-center">Carregando... Aguarde</p>

            </div>

            

            <style>{`

              @keyframes progress {

                0% { background-position: 0% center; }

                50% { background-position: 100% center; }

                100% { background-position: 0% center; }

              }

            `}</style>

          </div>

        ) : (

          <>

            {/* =====  ESTADOS NORMAIS  ===== */}

            <div className="flex items-center justify-between gap-4">

              <div className="flex-1">

                <div className="flex items-center gap-2 mb-2">

                  {whatsappReady ? (

                    <>

                      <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>

                      <h3 className="text-lg font-bold text-green-900">✅ Conectado com Sucesso</h3>

                    </>

                  ) : connectionState === 'restoring' ? (

                    <>

                      <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse"></div>

                      <h3 className="text-lg font-bold text-blue-900">🔍 Restaurando Sessão</h3>

                    </>

                  ) : connectionState === 'waiting-qr' && qrCode ? (

                    <>

                      <div className="h-3 w-3 rounded-full bg-amber-500 animate-pulse"></div>

                      <h3 className="text-lg font-bold text-amber-900">â³ Aguardando Autenticação</h3>

                    </>

                  ) : connectionState === 'waiting-qr' ? (

                    <>

                      <div className="h-3 w-3 rounded-full bg-amber-500 animate-pulse"></div>

                      <h3 className="text-lg font-bold text-amber-900">â³ Gerando QR Code</h3>

                    </>

                  ) : connectionState === 'error' ? (

                    <>

                      <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse"></div>

                      <h3 className="text-lg font-bold text-red-900">âŒ Erro de Conexão</h3>

                    </>

                  ) : (

                    <>

                      <div className="h-3 w-3 rounded-full bg-slate-500 animate-pulse"></div>

                      <h3 className="text-lg font-bold text-slate-900">â³ Conectando...</h3>

                    </>

                  )}

                </div>

                

                {whatsappReady && connectedPhone ? (

                  <div className="mt-3 space-y-1">

                    <p className="text-sm text-green-800"><strong>📱 Número:</strong> {connectedPhone}</p>

                    {connectedName && (
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-green-400 to-green-600 text-white shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.761 0 5.29.846 7.379 2.276M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Conta: {connectedName}</span>
                      </span>
                    )}

                    <button

                      onClick={handleDisconnect}

                      className="mt-2 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium transition"

                    >

                      Desconectar / Mudar Conta

                    </button>

                  </div>

                ) : connectionState === 'restoring' ? (

                  <div className="mt-3">

                    <p className="text-sm text-blue-700">Sua sessão anterior foi encontrada. Restaurando acesso em alguns segundos...</p>

                  </div>

                ) : connectionState === 'waiting-qr' && qrCode ? (

                  <div className="mt-3">

                    <p className="text-xs text-amber-700 mb-2">📱 Escaneie este QR code com seu WhatsApp:</p>

                    <img src={qrCode} alt="QR Code" className="w-48 h-48 border-2 border-amber-300 rounded-lg shadow-md" />

                    <p className="text-xs text-amber-600 mt-2">✅ Se escaneou o QR, aguarde 2-3 segundos para conectar</p>

                  </div>

                ) : connectionState === 'waiting-qr' ? (

                  <div className="mt-3 space-y-2">

                    <p className="text-sm text-amber-700">Gerando código QR...</p>

                    <div className="inline-flex items-center gap-2">

                      <div className="h-4 w-4 bg-amber-500 rounded-full animate-pulse"></div>

                      <p className="text-xs text-amber-600">Obtendo QR via WebSocket...</p>

                    </div>

                  </div>

                ) : connectionState === 'error' ? (

                  <div className="mt-3">

                    <p className="text-sm text-red-700 font-semibold mb-2">{lastError || 'Erro desconhecido'}</p>

                    <p className="text-xs text-red-600">Tente atualizar a página ou desconectar e conectar novamente.</p>

                  </div>

                ) : (

                  <p className="text-sm text-slate-700 mt-2">Conectando ao WhatsApp...</p>

                )}

              </div>

              

              {!whatsappReady && connectionState !== 'initializing' && (

                <div className="space-y-2">

                  <button

                    onClick={() => window.location.reload()}

                    className="w-full px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-sm font-medium transition"

                  >

                    🔍 Atualizar

                  </button>

                  <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-700">

                    💡 <strong>Dica:</strong> Se escaneou o QR, aguarde 2-3 segundos para a conexão ser estabelecida.

                  </div>

                </div>

              )}

        </div>

      </>

      )}

      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">

        <div className="flex items-center justify-between gap-3 mb-4">

          <div className="flex items-center gap-2">

            <ShieldCheck className="h-5 w-5 text-slate-700" />

            <label className="text-sm font-bold text-slate-700">Qual é o estágio da sua conta?</label>

          </div>

          <button

            onClick={() => setShowChipInfo(true)}

            className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded font-medium transition flex items-center gap-1"

          >

            <Info className="h-4 w-4" /> Ver tudo

          </button>

        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

          {(Object.keys(chipLimits) as Array<keyof typeof chipLimits>).map(type => (

            <div key={type} className="relative">

              <label className={`flex items-center gap-2 p-3 border cursor-pointer hover:bg-slate-50 transition rounded-lg ${chipType === type ? 'border-blue-500 border-2' : 'border-slate-200'}`}>

                <input

                  type="radio"

                  value={type}

                  checked={chipType === type}

                  onChange={(e) => setChipType(e.target.value as any)}

                  className="cursor-pointer"

                />

                <div className="flex-1 min-w-0">

                  <div className="text-sm font-semibold text-slate-700">

                    {chipLimits[type].emoji} {chipLimits[type].name}

                  </div>

                  <div className="text-xs text-slate-500">{chipLimits[type].shortDesc}</div>

                  <div className="text-xs text-slate-400 mt-1">{chipLimits[type].day}/{chipLimits[type].week}/{chipLimits[type].month}</div>

                </div>

              </label>

              

              {/* Hover Info Tooltip */}

              <button

                type="button"

                onMouseEnter={() => setHoveredChip(type)}

                onMouseLeave={() => setHoveredChip(null)}

                className="absolute -top-2 -right-2 bg-slate-200 hover:bg-slate-300 rounded-full p-1 transition"

                title={chipLimits[type].description}

              >

                <Info className="h-3 w-3 text-slate-600" />

              </button>

              

              {/* Tooltip Popover */}

              {hoveredChip === type && (

                <div className="absolute bottom-full left-0 mb-2 z-40 bg-slate-900 text-white text-xs rounded-lg p-2 w-32 shadow-lg border border-slate-700">

                  {chipLimits[type].description}

                  <div className="absolute top-full left-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-900"></div>

                </div>

              )}

            </div>

          ))}

        </div>

        <p className="text-xs text-slate-500 mt-3">Formato: <strong>Diário / Semanal / Mensal</strong> de mensagens que você pode enviar</p>

      </div>



      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        <div className="rounded-xl border-2 border-blue-300 p-4 bg-gradient-to-br from-blue-50 to-blue-100 shadow-md col-span-1">

          <div className="text-xs font-semibold text-blue-700">Enviado hoje</div>

          <div className="text-3xl font-bold text-blue-900 mt-2">{quotaSummary.day}/{quotaSummary.dayLimit}</div>

          <div className="text-xs text-blue-600 mt-1">Limite diario: {quotaSummary.dayLimit}</div>

        </div>

        <div className="rounded-xl border-2 border-green-300 p-4 bg-gradient-to-br from-green-50 to-green-100 shadow-md">

          <div className="text-xs font-semibold text-green-700">Enviado na semana</div>

          <div className="text-3xl font-bold text-green-900 mt-2">{quotaSummary.week}/{quotaSummary.weekLimit}</div>

          <div className="text-xs text-green-600 mt-1">Limite semanal: {quotaSummary.weekLimit}</div>

        </div>

        <div className="rounded-xl border-2 border-purple-300 p-4 bg-gradient-to-br from-purple-50 to-purple-100 shadow-md">

          <div className="text-xs font-semibold text-purple-700">Enviado no mes</div>

          <div className="text-3xl font-bold text-purple-900 mt-2">{quotaSummary.month}/{quotaSummary.monthLimit}</div>

          <div className="text-xs text-purple-600 mt-1">Limite mensal: {quotaSummary.monthLimit}</div>

        </div>

        <div className="rounded-xl border-2 border-amber-400 p-4 bg-gradient-to-br from-amber-50 to-amber-100 shadow-md">

          <div className="flex items-center gap-2 text-amber-800 font-bold text-sm"><AlertTriangle className="h-4 w-4" /> Boas praticas</div>

          <p className="text-xs text-amber-700 mt-2">Lote: {RECOMMENDED_BULK_LIMIT} | Semana: {RECOMMENDED_WEEK_LIMIT} | Mes: {RECOMMENDED_MONTH_LIMIT}</p>

        </div>

      </div>



      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-sm">

        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2"><PhoneCall className="h-4 w-4" /> Envio de WhatsApp</h3>



        <label className="block text-sm text-slate-600">Destinatários (números apenas, separados por vírgula, ponto e vírgula ou uma linha por número)</label>

        <textarea value={recipientsText} onChange={(e) => setRecipientsText(e.target.value)} rows={4} className="w-full p-3 border rounded-lg" placeholder="5511999998888, 5511888887777; 5511777776666" />



          <label className="block text-sm text-slate-600">Mensagem (use {'{{name}}'} para inserir o nome do destinatário)</label>

          <textarea 

            ref={messageInputRef}

            value={message} 

            onChange={(e) => setMessage(e.target.value)} 

            rows={5} 

            className="w-full p-3 border rounded-lg font-sans" 

            placeholder="Digite sua mensagem aqui..."

          />



          <div className="flex flex-wrap items-center gap-2 mt-3">

            <div className="text-xs text-slate-500 font-medium">Formatação WhatsApp:</div>

            <button

              type="button"

              onClick={() => insertFormatting('*', '*')}

              title="Negrito"

              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-sm font-bold transition"

            >

              <strong>N</strong>

            </button>

            <button

              type="button"

              onClick={() => insertFormatting('_', '_')}

              title="Itálico"

              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-sm italic transition"

            >

              <em>I</em>

            </button>

            <button

              type="button"

              onClick={() => insertFormatting('`', '`')}

              title="Código monoespaçado"

              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-sm font-mono transition"

            >

              {`</>`}

            </button>

            <button

              type="button"

              onClick={() => insertFormatting('~', '~')}

              title="Tachado"

              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-sm transition line-through"

            >

              S

            </button>

            <div className="ml-auto text-xs text-slate-500">💡 Dica: selecione o texto antes de clicar para formatar</div>

          </div>



          <div className="grid grid-cols-3 gap-3 items-end mt-2">

            <div>

              <label htmlFor="minDelay" className="text-xs text-slate-500">Delay mínimo (s)</label>

              <input 

                id="minDelay"

                type="number" 

                min={0} 

                value={bulkMinDelaySeconds} 

                onChange={(e) => setBulkMinDelaySeconds(Number(e.target.value))} 

                className="w-full p-2.5 border rounded-lg text-sm" 

                placeholder="15"

              />

            </div>

            <div>

              <label htmlFor="maxDelay" className="text-xs text-slate-500">Delay máximo (s)</label>

              <input 

                id="maxDelay"

                type="number" 

                min={0} 

                value={bulkMaxDelaySeconds} 

                onChange={(e) => setBulkMaxDelaySeconds(Number(e.target.value))} 

                className="w-full p-2.5 border rounded-lg text-sm" 

                placeholder="45"

              />

            </div>

            <div className="text-xs text-slate-400">Delay é aplicado aleatoriamente entre min e max para reduzir bloqueios.</div>

          </div>



          <div className="flex items-center gap-3 mt-3">

            <button disabled={loading} onClick={handleSend} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold disabled:opacity-60">{loading ? 'Enviando...' : 'Enviar agora'}</button>

            <button disabled={loading} onClick={() => { setRecipientsText(''); setMessage(''); setStatus(null); setPhone(''); setName(''); }} className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium">Limpar</button>

            <div className="ml-auto flex items-center gap-2">

              <label htmlFor="scheduleTime" className="text-xs text-slate-500">Agendar para:</label>

              <input 

                id="scheduleTime"

                type="datetime-local" 

                value={scheduleAt} 

                onChange={(e) => setScheduleAt(e.target.value)} 

                className="p-2 border rounded text-sm" 

              />

              <button disabled={scheduling} onClick={async () => {

                const rows = parseRecipients(recipientsText || (phone ? phone : ''));

                if (!rows.length || !scheduleAt) { setStatus('Insira destinatários válidos e data/hora para agendar.'); return; }

                if (rows.length === 1) await handleScheduleSingle(); else await handleScheduleBulk();

              }} className="px-3 py-2 bg-amber-500 text-white rounded-lg text-sm font-bold">{scheduling ? 'Agendando...' : 'Agendar envio'}</button>

            </div>

          </div>



          <div className="mt-4">

            <div className="text-xs text-slate-500 mb-2">Pré-visualização</div>

            <div className="border rounded p-4 max-w-xs bg-slate-50">

              {(() => {

                const rows = parseRecipients(recipientsText || (phone ? phone : ''));

                const sample = rows.length ? rows[0] : { phone: phone || '55XXXXXXXXXXX', name: name || 'Contato', message: message || 'Sua mensagem aparecerá aqui...' };

                const rendered = (sample.message && sample.message.length) ? sample.message : message;

                return (

                  <div>

                    <div className="text-sm text-slate-700 font-semibold">{sample.name || 'Contato'}</div>

                    <div className="text-xs text-slate-500">{sample.phone || '55XXXXXXXXXXX'}</div>

                    <div className="mt-3 text-sm text-slate-800 whitespace-pre-wrap font-sans">{String(rendered).replace(/{{\s*name\s*}}/gi, sample.name || '')}</div>

                  </div>

                );

              })()}

            </div>

          </div>

      </div>



      {status && <div className="p-3 rounded-lg bg-slate-900 text-slate-100 text-sm">{status}</div>}



      {isBulkSending && bulkProgress.total > 0 && (

        <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 shadow-md space-y-3">

          <div className="flex items-center justify-between gap-2">

            <h4 className="font-bold text-blue-900 flex items-center gap-2">

              <span className="animate-spin">⏳</span> Envio em Progresso

            </h4>

            <span className="text-sm font-mono text-blue-800">{bulkProgress.current}/{bulkProgress.total}</span>

          </div>



          {/* Progress bar */}

          <div className="relative w-full h-8 bg-white border-2 border-blue-300 rounded-lg overflow-hidden shadow-sm">

            <div

              className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-300 flex items-center justify-end pr-2"

              style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}

            >

              {(bulkProgress.current / bulkProgress.total) * 100 > 20 && (

                <span className="text-xs font-bold text-white">{Math.round((bulkProgress.current / bulkProgress.total) * 100)}%</span>

              )}

            </div>

          </div>



          {/* Stats */}

          <div className="grid grid-cols-3 gap-2 text-sm">

            <div className="bg-green-100 border border-green-300 rounded-lg p-2 text-center">

              <div className="font-bold text-green-700">✓ {bulkProgress.success}</div>

              <div className="text-xs text-green-600">Sucesso</div>

            </div>

            <div className="bg-red-100 border border-red-300 rounded-lg p-2 text-center">

              <div className="font-bold text-red-700">❌ {bulkProgress.failed}</div>

              <div className="text-xs text-red-600">Falhas</div>

            </div>

            <div className="bg-amber-100 border border-amber-300 rounded-lg p-2 text-center">

              <div className="font-bold text-amber-700">â³ {bulkProgress.total - bulkProgress.current}</div>

              <div className="text-xs text-amber-600">Pendente</div>

            </div>

          </div>



          {/* Warning */}

          <div className="flex items-start gap-2 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">

            <AlertTriangle className="h-5 w-5 text-yellow-700 flex-shrink-0 mt-0.5" />

            <div className="text-xs text-yellow-800">

              <strong>⚠️ Não feche a página!</strong> O envio está em progresso. Fechar a página pode interromper o processo.

            </div>

          </div>

        </div>

      )}



      <div className="w-full mt-6">

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">

          <div className="flex items-center justify-between gap-3 mb-4">

            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2"><History className="h-4 w-4" /> Histórico Completo de Envios</h3>

            <button onClick={() => saveHistoryItems([])} className="text-xs text-red-600 hover:underline font-medium">🗑️ Limpar histórico</button>

          </div>

          

          <div className="relative mb-4">

            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />

            <input

              value={historyFilterPhone}

              onChange={(e) => setHistoryFilterPhone(e.target.value)}

              placeholder="Filtrar por número de telefone..."

              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"

            />

          </div>



          <div className="border rounded-lg overflow-hidden">

            {filteredHistory.length === 0 ? (

              <div className="p-12 text-center">

                <History className="h-10 w-10 text-slate-300 mx-auto mb-2" />

                <p className="text-sm text-slate-400">Nenhum envio registrado ainda.</p>

              </div>

            ) : (

              <div className="overflow-x-auto">

                <table className="w-full text-left text-sm">

                  <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b sticky top-0">

                    <tr>

                      <th className="px-4 py-3 font-semibold text-slate-700">Data & Hora</th>

                      <th className="px-4 py-3 font-semibold text-slate-700">Número</th>

                      <th className="px-4 py-3 font-semibold text-slate-700">Nome</th>

                      <th className="px-4 py-3 font-semibold text-slate-700">Mensagem</th>

                      <th className="px-4 py-3 font-semibold text-slate-700 text-center">Status</th>

                      <th className="px-4 py-3 font-semibold text-slate-700 text-center">ID</th>

                    </tr>

                  </thead>

                  <tbody className="divide-y">

                    {filteredHistory.map((item, idx) => (

                      <tr key={item.id} className={`hover:bg-slate-50 transition ${item.ok ? 'bg-green-50 hover:bg-green-100' : 'bg-red-50 hover:bg-red-100'}`}>

                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap text-xs">

                          {new Date(item.createdAt).toLocaleString('pt-BR')}

                        </td>

                        <td className="px-4 py-3 font-mono text-slate-800 font-semibold">{item.phone}</td>

                        <td className="px-4 py-3 text-slate-700 max-w-[150px] truncate">{item.name || '—'}</td>

                        <td className="px-4 py-3 text-slate-600 max-w-[300px] truncate text-xs">{item.message.substring(0, 60)}...</td>

                        <td className="px-4 py-3 text-center">

                          {item.ok ? (

                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-200 text-green-800">

                              ✓ Enviado

                            </span>

                          ) : (

                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-200 text-red-800">

                              ❌ Falho

                            </span>

                          )}

                        </td>

                        <td className="px-4 py-3 text-center text-xs text-slate-500 font-mono">{item.responseId || '—'}</td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            )}

          </div>



          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">

            <span>Total: <strong>{filteredHistory.length}</strong> registros</span>

            <span>

              ✓ Sucesso: <strong className="text-green-600">{filteredHistory.filter(h => h.ok).length}</strong> | 

              ❌ Falhas: <strong className="text-red-600">{filteredHistory.filter(h => !h.ok).length}</strong>

            </span>

          </div>

        </div>

      </div>



      {/* Modal de Informações sobre Tipos de Conta */}

      {showChipInfo && (

        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">

            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">

              <h2 className="text-xl font-bold">Entenda os Estágios da Sua Conta</h2>

              <button

                onClick={() => setShowChipInfo(false)}

                className="text-2xl font-light hover:opacity-80 transition"

              >

                ✕

              </button>

            </div>

            

            <div className="p-6 space-y-6">

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4">

                <h3 className="font-bold text-blue-900 mb-2">📱 NOVO - Conta Recém-Criada</h3>

                <p className="text-sm text-blue-800 mb-3">Você acabou de ativar este número no WhatsApp. O sistema ainda está aprendendo que você é legítimo.</p>

                <div className="grid grid-cols-3 gap-2 text-xs mb-2">

                  <div><span className="font-bold text-blue-900">Diário:</span> 50 mensagens</div>

                  <div><span className="font-bold text-blue-900">Semanal:</span> 300 mensagens</div>

                  <div><span className="font-bold text-blue-900">Mensal:</span> 1.500 mensagens</div>

                </div>

                <p className="text-xs text-blue-700">💡 Respeite esses limites. Se ultrapassar, seu número pode ser bloqueado temporariamente para proteção contra abuso.</p>

              </div>



              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">

                <h3 className="font-bold text-yellow-900 mb-2">📈 EM USO - Conta com Alguns Envios</h3>

                <p className="text-sm text-yellow-800 mb-3">Você já está usando há algumas semanas. Seu número começa a ganhar mais confiança.</p>

                <div className="grid grid-cols-3 gap-2 text-xs mb-2">

                  <div><span className="font-bold text-yellow-900">Diário:</span> 75 mensagens</div>

                  <div><span className="font-bold text-yellow-900">Semanal:</span> 500 mensagens</div>

                  <div><span className="font-bold text-yellow-900">Mensal:</span> 2.500 mensagens</div>

                </div>

                <p className="text-xs text-yellow-700">✅ Seu número naturalmente avança para este nível depois de ~2-3 semanas se você respeitar os limites anteriores.</p>

              </div>



              <div className="bg-orange-50 border-l-4 border-orange-500 p-4">

                <h3 className="font-bold text-orange-900 mb-2">🔍 EXPERIENTE - Conta Bem Estabelecida</h3>

                <p className="text-sm text-orange-800 mb-3">Você está usando por bastante tempo. O WhatsApp já tem certeza que você é um usuário de verdade.</p>

                <div className="grid grid-cols-3 gap-2 text-xs mb-2">

                  <div><span className="font-bold text-orange-900">Diário:</span> 150 mensagens</div>

                  <div><span className="font-bold text-orange-900">Semanal:</span> 1.000 mensagens</div>

                  <div><span className="font-bold text-orange-900">Mensal:</span> 4.000 mensagens</div>

                </div>

                <p className="text-xs text-orange-700">🎯 Geralmente leva ~1-3 meses para chegar aqui. Agora você pode usar o WhatsApp de forma mais intensa.</p>

              </div>



              <div className="bg-red-50 border-l-4 border-red-500 p-4">

                <h3 className="font-bold text-red-900 mb-2">⚡ VETERANA - Conta Antiga e Confiável</h3>

                <p className="text-sm text-red-800 mb-3">Seu número tem muito tempo de uso. You é praticamente um usuário "VIP" no WhatsApp.</p>

                <div className="grid grid-cols-3 gap-2 text-xs mb-2">

                  <div><span className="font-bold text-red-900">Diário:</span> 250 mensagens</div>

                  <div><span className="font-bold text-red-900">Semanal:</span> 1.500 mensagens</div>

                  <div><span className="font-bold text-red-900">Mensal:</span> 6.000 mensagens</div>

                </div>

                <p className="text-xs text-red-700">🚀 Requer ~6+ meses com uso contínuo. Raríssimo sofrer bloqueios neste estágio.</p>

              </div>



              <div className="bg-slate-50 border-l-4 border-slate-400 p-4">

                <h3 className="font-bold text-slate-900 mb-2">â­ï¸ Como Evoluir Mais Rápido?</h3>

                <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">

                  <li><strong>Não ultrapasse os limites:</strong> Se respeitá-los, avança naturalmente</li>

                  <li><strong>Use o número normalmente:</strong> Receba mensagens, envie para amigos, converse</li>

                  <li><strong>Varie os horários:</strong> Não envie tudo de madrugada ou em padrão repetitivo</li>

                  <li><strong>Use delays aleatórios:</strong> Entre envios em massa, use pausas variadas</li>

                  <li><strong>Mantenha ativo:</strong> Não abandone por longos períodos</li>

                  <li><strong>Evite palavras SPAM:</strong> Não use termos muito comerciais ou de marketing</li>

                </ul>

              </div>



              <div className="bg-green-50 border-l-4 border-green-500 p-4">

                <h3 className="font-bold text-green-900 mb-2">⚠️ Importante!</h3>

                <p className="text-xs text-green-700">Se você usar acima dos limites do seu estágio, pode sofrer bloqueios temporários (1-24 horas). Isto é normal e proteção do WhatsApp. Quando desbloqueado, aumente gradualmente os envios (~10-20% por semana).</p>

              </div>

            </div>



            <div className="bg-slate-50 p-4 border-t flex gap-3 justify-end">

              <button

                onClick={() => setShowChipInfo(false)}

                className="px-4 py-2 bg-slate-600 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition"

              >

                Entendi!

              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

};



export default WhatsAppSender;



