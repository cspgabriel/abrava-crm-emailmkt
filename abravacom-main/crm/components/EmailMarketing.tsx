import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, History, Mail, Search, Info, Copy, Trash2, Package } from 'lucide-react';
import { TemplateSelectModal } from './TemplateSelectModal';

type SendHistoryItem = {
  id: string;
  email: string;
  name: string;
  subject: string;
  message: string;
  ok: boolean;
  createdAt: string;
  provider: 'gmail' | 'outlook' | 'workspace' | 'exchange';
};

const HISTORY_STORAGE_KEY = 'crm_email_send_history';

// Email provider limits
const emailProviders = {
  gmail: {
    name: 'Gmail Pessoal',
    emoji: '📧',
    dailyLimit: 500,
    weeklyLimit: 3500,
    monthlyLimit: 15000,
    description: 'Conta gratuita @gmail.com - Limite padrão do Gmail',
    color: 'from-red-50 to-orange-50',
    borderColor: 'border-red-300'
  },
  outlook: {
    name: 'Outlook.com Pessoal',
    emoji: '📨',
    dailyLimit: 300,
    weeklyLimit: 2000,
    monthlyLimit: 10000,
    description: 'Conta gratuita @outlook.com - Limite padrão',
    color: 'from-blue-50 to-cyan-50',
    borderColor: 'border-blue-300'
  },
  workspace: {
    name: 'Google Workspace',
    emoji: '🏢',
    dailyLimit: 2000,
    weeklyLimit: 14000,
    monthlyLimit: 60000,
    description: 'Domínio pago Google Workspace - Limite corporativo',
    color: 'from-blue-50 to-indigo-50',
    borderColor: 'border-blue-500'
  },
  exchange: {
    name: 'Microsoft 365 Exchange',
    emoji: '🏢',
    dailyLimit: 2000,
    weeklyLimit: 14000,
    monthlyLimit: 60000,
    description: 'Domínio pago Microsoft 365 - Limite corporativo',
    color: 'from-purple-50 to-pink-50',
    borderColor: 'border-purple-500'
  }
};

const RECOMMENDED_BULK_LIMIT = 100;

const getResolvedApiBase = (apiBase = '') => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:8788';
  }

  const fallbackBase = 'https://email-api.abravacom.com.br';
  const envBase = ((import.meta as any)?.env?.VITE_EMAIL_API_URL || '').trim();
  return (apiBase || envBase || fallbackBase).replace(/\/$/, '');
};

const getResolvedApiKey = (apiKey = '') => {
  return (
    apiKey ||
    (import.meta as any)?.env?.VITE_EMAIL_API_KEY?.trim?.() ||
    localStorage.getItem('crm_email_api_key')?.trim?.() ||
    ''
  );
};

export const EmailMarketing: React.FC<{ apiBase?: string; apiKey?: string }> = ({ 
  apiBase = '', 
  apiKey = '' 
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recipientsText, setRecipientsText] = useState('');
  const [bulkMinDelaySeconds, setBulkMinDelaySeconds] = useState(2);
  const [bulkMaxDelaySeconds, setBulkMaxDelaySeconds] = useState(5);
  const [provider, setProvider] = useState<'gmail' | 'outlook' | 'workspace' | 'exchange'>('gmail');
  
  // Bulk send progress tracking
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });
  const [isBulkSending, setIsBulkSending] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [serverAuth, setServerAuth] = useState<{ authenticated: boolean; account?: string } | null>(null);

  // History
  const [historyItems, setHistoryItems] = useState<SendHistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const saveHistoryItems = (items: SendHistoryItem[]) => {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(items));
    setHistoryItems(items);
  };

  const appendHistoryItem = (item: SendHistoryItem) => {
    saveHistoryItems([item, ...historyItems]);
  };

  // Parse recipients
  const recipients = useMemo(() => {
    // Accept recipients separated by newline or comma. Also support `email | Name` format.
    const normalized = recipientsText.replace(/,/g, '\n');
    return normalized
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && line.includes('@'))
      .map((line, idx) => {
        const parts = line.split('|').map(p => p.trim());
        return {
          email: parts[0],
          name: parts[1] || `Contato ${idx + 1}`
        };
      });
  }, [recipientsText]);

  // Recompute quota summary
  const quotaSummary = useMemo(() => {
    try {
      const now = Date.now();
      const dayAgo = now - 24 * 60 * 60 * 1000;
      const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
      const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
      
      const okItems = historyItems.filter(h => h.ok && h.provider === provider);
      const day = okItems.filter(h => new Date(h.createdAt).getTime() >= dayAgo).length;
      const week = okItems.filter(h => new Date(h.createdAt).getTime() >= weekAgo).length;
      const month = okItems.filter(h => new Date(h.createdAt).getTime() >= monthAgo).length;
      
      const limits = emailProviders[provider];
      return {
        day: { used: day, limit: limits.dailyLimit, pct: Math.round((day / limits.dailyLimit) * 100) },
        week: { used: week, limit: limits.weeklyLimit, pct: Math.round((week / limits.weeklyLimit) * 100) },
        month: { used: month, limit: limits.monthlyLimit, pct: Math.round((month / limits.monthlyLimit) * 100) }
      };
    } catch {
      return {
        day: { used: 0, limit: 0, pct: 0 },
        week: { used: 0, limit: 0, pct: 0 },
        month: { used: 0, limit: 0, pct: 0 }
      };
    }
  }, [historyItems, provider]);

  // Send single email
  // Unified send handler (single or multiple recipients)
  const handleSendUnified = async () => {
    const resolvedBase = getResolvedApiBase(apiBase);
    const resolvedApiKey = getResolvedApiKey(apiKey);

    const targets = recipients.length > 0 ? recipients : (email ? [{ email, name: name || 'Contato 1' }] : []);

    if (targets.length === 0) {
      setStatus('❌ Adicione pelo menos um destinatário');
      return;
    }

    if (!subject || !message) {
      setStatus('❌ Preencha assunto e mensagem');
      return;
    }

    setLoading(true);
    let success = 0;
    let failed = 0;

    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      try {
        const resp = await fetch(`${resolvedBase}/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(resolvedApiKey && { 'x-api-key': resolvedApiKey })
          },
          body: JSON.stringify({
            to: t.email,
            recipientName: t.name,
            subject,
            body: message,
            provider
          })
        });

        const data = await resp.json();
        const ok = !!data.ok;

        appendHistoryItem({
          id: `${Date.now()}-${i}`,
          email: t.email,
          name: t.name,
          subject,
          message,
          ok,
          createdAt: new Date().toISOString(),
          provider
        });

        if (ok) success++; else failed++;
      } catch (e) {
        failed++;
      }
    }

    setLoading(false);
    setStatus(`✅ Enviados: ${success} | ❌ Falhados: ${failed}`);
    if (recipients.length > 0) setRecipientsText('');
    else { setEmail(''); setName(''); }
  };

  // Handle template selection
  const handleSelectTemplate = (template: any) => {
    setSubject(template.subject);
    setMessage(template.htmlContent);
    setStatus(`✅ Template "${template.name}" aplicado!`);
  };

  // Check server auth status on mount
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const base = getResolvedApiBase(apiBase);
        const res = await fetch(`${base}/status`);
        const j = await res.json();
        if (!mounted) return;
        setServerAuth({ authenticated: !!j.authenticated, account: j.account });
        if (!j.authenticated) setStatus('⚠️ Workspace CLI não autenticado. Autentique no servidor para enviar.');
      } catch (e) {
        // ignore
      }
    };
    check();
    return () => { mounted = false; };
  }, [apiBase]);

  // Bulk send
  // (Bulk logic merged into unified handler)

  // Clear history
  const handleClearHistory = () => {
    if (confirm('Limpar todo o histórico? Não pode ser desfeito.')) {
      saveHistoryItems([]);
      setStatus('✅ Histórico limpo');
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">📨 E-mail Marketing</h1>
        <p className="text-slate-600">Envie campanhas de email em massa com controle de quotas</p>
      </div>

      {/* Provider Selection */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-slate-700" />
            <label className="text-sm font-bold text-slate-700">Qual é a sua plataforma de email?</label>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Object.entries(emailProviders) as Array<[keyof typeof emailProviders, any]>).map(([type, config]) => (
            <div key={type} className="relative">
              <label className={`flex items-center gap-3 p-4 border cursor-pointer hover:bg-slate-50 transition rounded-lg ${provider === type ? `${config.borderColor} border-2` : 'border-slate-200'}`}>
                <input
                  type="radio"
                  value={type}
                  checked={provider === type}
                  onChange={(e) => setProvider(e.target.value as any)}
                  className="cursor-pointer w-4 h-4"
                />
                <div className="flex-1">
                  <div className="font-semibold text-slate-900">{config.emoji} {config.name}</div>
                  <div className="text-xs text-slate-600">{config.description}</div>
                </div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Quota Summary */}
      {quotaSummary && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4">📊 Quotas de Envio</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Hoje', data: quotaSummary.day, color: 'bg-blue-100 border-blue-300' },
              { label: 'Esta Semana', data: quotaSummary.week, color: 'bg-green-100 border-green-300' },
              { label: 'Este Mês', data: quotaSummary.month, color: 'bg-purple-100 border-purple-300' }
            ].map(({ label, data, color }) => (
              <div key={label} className={`border ${color} rounded-lg p-4`}>
                <div className="text-sm text-slate-700">{label}</div>
                <div className="text-2xl font-bold text-slate-900">
                  {data.used} <span className="text-sm text-slate-600">/ {data.limit}</span>
                </div>
                <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all ${data.pct > 80 ? 'bg-red-500' : data.pct > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(data.pct, 100)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-slate-600 mt-1">{data.pct}% utilizado</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Message */}
      {status && (
        <div className="p-4 rounded-lg bg-slate-100 text-slate-800 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          {status}
        </div>
      )}

      {/* Unified Send Block: single or multiple recipients (one per line or comma-separated) */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-4">📧 Enviar Email (único ou em massa)</h2>

        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">Formato: um destinatário por linha ou separados por vírgula. Também suporta <code>email | Nome</code>.</p>
          <p className="text-xs text-yellow-700 mt-1">Ex: joao@example.com | João Silva</p>
        </div>

        <textarea
          placeholder="Destinatários (um por linha ou separados por vírgula)"
          value={recipientsText}
          onChange={(e) => setRecipientsText(e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 font-mono text-sm mb-4"
        />

        <input
          type="text"
          placeholder="Assunto do email"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 mb-4"
        />

        <button
          onClick={() => setIsTemplateModalOpen(true)}
          className="w-full px-4 py-2 mb-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
        >
          <Package className="h-4 w-4" />
          🎨 Escolher Template
        </button>

        <textarea
          placeholder="Corpo do email (HTML suportado)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 font-mono text-sm mb-4"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Plataforma</label>
            <select value={provider} onChange={(e) => setProvider(e.target.value as any)} className="w-full px-4 py-2 border rounded-lg">
              <option value="workspace">🏢 Google Workspace</option>
              <option value="gmail">📧 Gmail Pessoal</option>
              <option value="outlook">📨 Outlook</option>
              <option value="exchange">🏢 Microsoft 365</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSendUnified}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50"
            >
              {loading ? '⏳ Enviando...' : '📤 Enviar'}
            </button>
          </div>
        </div>

        <div className="text-sm text-slate-600">{recipients.length} destinatário(s) detectado(s)</div>
      </div>

      {/* History */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Envios ({historyItems.length})
          </h2>
          <button
            onClick={handleClearHistory}
            className="text-red-600 hover:text-red-700 flex items-center gap-1 text-sm"
          >
            <Trash2 className="h-4 w-4" />
            Limpar
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 border-b">
              <tr>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Assunto</th>
                <th className="px-4 py-2 text-left">Plataforma</th>
                <th className="px-4 py-2 text-left">Data</th>
              </tr>
            </thead>
            <tbody>
              {historyItems.slice(0, 20).map((item) => (
                <tr key={item.id} className="border-b hover:bg-slate-50">
                  <td className="px-4 py-2">{item.ok ? '✅' : '❌'}</td>
                  <td className="px-4 py-2 text-blue-600 cursor-pointer flex items-center gap-1">
                    {item.email}
                    <Copy className="h-3 w-3" onClick={() => navigator.clipboard.writeText(item.email)} />
                  </td>
                  <td className="px-4 py-2 truncate">{item.subject}</td>
                  <td className="px-4 py-2">{item.provider}</td>
                  <td className="px-4 py-2 text-slate-600">{new Date(item.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Template Selection Modal */}
      <TemplateSelectModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelect={handleSelectTemplate}
      />
    </div>
  );
};
