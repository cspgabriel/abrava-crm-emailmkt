import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, History, Mail, Search, Info, Copy, Trash2, Package, CheckCircle } from 'lucide-react';
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
  const envBase = ((import.meta as any)?.env?.VITE_EMAIL_API_URL || '').trim();
  const fallbackBase = 'https://email-api.abravacom.com.br';
  const resolved = (apiBase || envBase || fallbackBase).replace(/\/$/, '');
  
  // When running on localhost, use the direct local email API URL to avoid CORS and proxy restarts
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:8788';
  }
  
  return resolved;
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
  // Platform selection removed — default to workspace
  const [provider] = useState<'gmail' | 'outlook' | 'workspace' | 'exchange'>('workspace');
  const [editorMode, setEditorMode] = useState<'visual' | 'code'>('visual');
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);
  const [isPreviewSidebarOpen, setIsPreviewSidebarOpen] = useState(false);
  
  // Bulk send progress tracking
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });
  const [isBulkSending, setIsBulkSending] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  const [workspaceAccount, setWorkspaceAccount] = useState<string | null>(null);
  const [isWorkspaceAuthOk, setIsWorkspaceAuthOk] = useState(false);
  const [isCheckingAccount, setIsCheckingAccount] = useState(true);

  const visualEditorRef = React.useRef<HTMLDivElement | null>(null);

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
    if (!recipientsText) return [];
    // Split by newlines, commas, or semicolons
    const rawItems = recipientsText
      .split(/[\r\n,;]+/)
      .map(item => item.trim())
      .filter(item => item && item.includes('@'));
    
    return rawItems.map((item, idx) => {
      const parts = item.split('|').map(p => p.trim());
      return {
        email: parts[0],
        name: parts[1] || `Contato ${idx + 1}`
      };
    });
  }, [recipientsText]);

  // Fetch workspace status
  useEffect(() => {
    const fetchStatus = async () => {
      setIsCheckingAccount(true);
      try {
        const resolvedBase = getResolvedApiBase(apiBase);
        const response = await fetch(`${resolvedBase}/status`);
        const data = await response.json();
        if (data.ok && data.account) {
          setWorkspaceAccount(data.account);
          setIsWorkspaceAuthOk(true);
          // Auto-fill recipient email with the workspace account
          setEmail(data.account);
        }
      } catch (e) {
        console.error('Error fetching email status:', e);
      }
      setIsCheckingAccount(false);
    };
    fetchStatus();
  }, [apiBase]);

  const handlePreview = (template: any | null) => {
    setPreviewTemplate(template);
    setIsPreviewSidebarOpen(!!template);
  };

  useEffect(() => {
    if (editorMode === 'visual' && visualEditorRef.current) {
      // Keep the visible content in sync without forcing rerender cursor reset
      if (visualEditorRef.current.innerHTML !== message) {
        visualEditorRef.current.innerHTML = message || '<p><br></p>';
      }
    }
  }, [message, editorMode]);

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

  // Send email (Single or Bulk)
  const handleSendEmail = async () => {
    if (recipients.length === 0) {
      setStatus('❌ Adicione destinatários válidos');
      return;
    }

    if (!subject || !message) {
      setStatus('❌ Preencha assunto e mensagem');
      return;
    }

    const resolvedBase = getResolvedApiBase(apiBase);
    const resolvedApiKey = getResolvedApiKey(apiKey);

    if (recipients.length === 1) {
      // Single send logic
      setLoading(true);
      const recipient = recipients[0];
      try {
        const response = await fetch(`${resolvedBase}/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(resolvedApiKey && { 'x-api-key': resolvedApiKey })
          },
          body: JSON.stringify({
            to: recipient.email,
            recipientName: recipient.name,
            subject,
            body: message,
            provider
          })
        });

        const data = await response.json();
        if (data.ok) {
          setStatus(`✅ Email enviado para ${recipient.email}`);
          appendHistoryItem({
            id: `${Date.now()}`,
            email: recipient.email,
            name: recipient.name,
            subject,
            message,
            ok: true,
            createdAt: new Date().toISOString(),
            provider
          });
          setRecipientsText('');
          setSubject('');
          setMessage('');
        } else {
          setStatus(`❌ Erro: ${data.error || 'Falha ao enviar'}`);
        }
      } catch (e) {
        setStatus(`❌ Erro: ${String(e)}`);
      } finally {
        setLoading(false);
      }
    } else {
      // Bulk send logic
      setIsBulkSending(true);
      setBulkProgress({ current: 0, total: recipients.length, success: 0, failed: 0 });

      for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i];
        const delay = Math.random() * (bulkMaxDelaySeconds - bulkMinDelaySeconds) + bulkMinDelaySeconds;

        try {
          const response = await fetch(`${resolvedBase}/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(resolvedApiKey && { 'x-api-key': resolvedApiKey })
            },
            body: JSON.stringify({
              to: recipient.email,
              recipientName: recipient.name,
              subject,
              body: message,
              provider
            })
          });

          const data = await response.json();
          const success = data.ok;

          appendHistoryItem({
            id: `${Date.now()}-${i}`,
            email: recipient.email,
            name: recipient.name,
            subject,
            message,
            ok: success,
            createdAt: new Date().toISOString(),
            provider
          });

          setBulkProgress(prev => ({
            ...prev,
            current: i + 1,
            success: prev.success + (success ? 1 : 0),
            failed: prev.failed + (success ? 0 : 1)
          }));
        } catch {
          setBulkProgress(prev => ({
            ...prev,
            current: i + 1,
            failed: prev.failed + 1
          }));
        }

        if (i < recipients.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * 1000));
        }
      }

      setStatus(`✅ Enviados: ${bulkProgress.success} | ❌ Falhados: ${bulkProgress.failed}`);
      setIsBulkSending(false);
      setRecipientsText('');
    }
  };

  // Clear history
  const handleClearHistory = () => {
    if (confirm('Limpar todo o histórico? Não pode ser desfeito.')) {
      saveHistoryItems([]);
      setStatus('✅ Histórico limpo');
    }
  };

  // Handle template selection
  const handleSelectTemplate = (template: any) => {
    setSubject(template.subject);
    setMessage(template.htmlContent);
    setStatus(`✅ Template "${template.name}" aplicado!`);
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">📨 E-mail Marketing</h1>
        <p className="text-slate-600">Envie campanhas de email em massa com controle de quotas</p>
      </div>

      {/* Connection Info */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-slate-700" />
            <label className="text-sm font-bold text-slate-700">Envio via Google Workspace (padrão)</label>
          </div>
          {workspaceAccount && (
            <div className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-semibold flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Conta CLI: {workspaceAccount}
            </div>
          )}
        </div>
        <div className="text-sm text-slate-600">As mensagens serão enviadas usando a conta Workspace autenticada no servidor.</div>
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
      {isCheckingAccount ? (
        <div className="p-4 rounded-lg bg-blue-50 text-slate-800 flex items-center gap-3">
          <div className="w-full">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-slate-700">Conectando conta de email...</div>
              <div className="text-xs text-slate-500">Aguarde</div>
            </div>
            <div className="w-full bg-white rounded-full h-2 overflow-hidden border border-slate-100">
              <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 animate-progress" style={{ width: '60%' }} />
            </div>
          </div>
        </div>
      ) : status ? (
        <div className="p-4 rounded-lg bg-slate-100 text-slate-800 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          {status}
        </div>
      ) : null}

      {/* Main Email Block */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Enviar E-mail
        </h2>
        
        <div className="mb-4">
          {workspaceAccount ? (
            <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
              📤 Enviando via: <span className="font-bold text-blue-600">{workspaceAccount}</span>
            </div>
          ) : (
             isCheckingAccount ? (
               <div className="text-sm text-slate-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200 flex items-center gap-2">
                 <div className="h-3 w-3 rounded-full bg-yellow-400 animate-pulse" />
                 Conectando conta de email...
               </div>
             ) : (
               <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                 ⚠️ Workspace CLI não autenticado. Autentique no servidor para enviar.
               </div>
             )
          )}
        </div>

        {/* Recipients input */}
        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Destinatários</label>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-2 text-xs text-blue-800">
               💡 Formatos aceitos: <b>email@exemplo.com</b> | <b>emails separados por vírgula</b> | <b>email | Nome</b> (um por linha)
            </div>
            <textarea
              placeholder="Ex: joao@gmail.com, maria@outlook.com ou um por linha..."
              value={recipientsText}
              onChange={(e) => setRecipientsText(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            {recipients.length > 0 && (
                <div className="mt-1 text-xs text-slate-500 font-semibold text-blue-600">
                    📊 Destinatários identificados: {recipients.length}
                </div>
            )}
          </div>

          <input
            type="text"
            placeholder="Assunto do email"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
          >
            <Package className="h-4 w-4" />
            🎨 Escolher Template
          </button>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="text-sm text-slate-700 font-medium">Corpo do email</div>
              <div className="ml-auto flex gap-2">
                <button onClick={() => setEditorMode('visual')} className={`px-3 py-1 rounded text-xs ${editorMode === 'visual' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>Visual</button>
                <button onClick={() => setEditorMode('code')} className={`px-3 py-1 rounded text-xs ${editorMode === 'code' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>Código</button>
              </div>
            </div>
            {editorMode === 'visual' ? (
              <div className="border border-gray-300 rounded-lg mb-2">
                <div className="p-2 flex gap-1 border-b bg-slate-50">
                  <button type="button" onClick={() => document.execCommand('bold')} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold">B</button>
                  <button type="button" onClick={() => document.execCommand('italic')} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs italic">I</button>
                  <button type="button" onClick={() => {
                    const url = prompt('Inserir link (https://...)');
                    if (url) document.execCommand('createLink', false, url);
                  }} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-blue-600 underline">Link</button>
                  <button type="button" onClick={() => {
                    setMessage('');
                    if (visualEditorRef.current) visualEditorRef.current.innerHTML = '';
                  }} className="px-2 py-1 ml-auto bg-red-50 text-red-600 rounded text-xs">Limpar</button>
                </div>
                <div
                  ref={visualEditorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => setMessage((e.target as HTMLDivElement).innerHTML)}
                  className="p-4 min-h-[240px] max-h-[60vh] overflow-auto prose prose-sm max-w-none"
                  dir="ltr"
                  style={{ textAlign: 'left' }}
                />
              </div>
            ) : (
              <textarea
                placeholder="Corpo do email (HTML suportado)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={12}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            )}
          </div>
        </div>

        {/* Bulk specific settings (visible only when multiple recipients) */}
        {recipients.length > 1 && (
            <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Delay mín (seg)</label>
                    <input
                        type="number"
                        value={bulkMinDelaySeconds}
                        onChange={(e) => setBulkMinDelaySeconds(parseInt(e.target.value))}
                        min="1"
                        className="w-full px-3 py-1 border border-gray-300 rounded"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Delay máx (seg)</label>
                    <input
                        type="number"
                        value={bulkMaxDelaySeconds}
                        onChange={(e) => setBulkMaxDelaySeconds(parseInt(e.target.value))}
                        min="1"
                        className="w-full px-3 py-1 border border-gray-300 rounded"
                    />
                </div>
                {recipients.length > RECOMMENDED_BULK_LIMIT && (
                    <div className="col-span-2 text-xs text-orange-600 font-semibold">
                         ⚠️ Lote grande detectado. Recomenda-se delay maior para evitar bloqueios.
                    </div>
                )}
            </div>
        )}

        {isBulkSending && (
          <div className="mb-4 space-y-2">
            <div className="text-sm font-medium text-slate-700">
              Progresso: {bulkProgress.current}/{bulkProgress.total}
            </div>
            <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
              ></div>
            </div>
            <div className="flex gap-4 text-sm font-semibold">
              <span className="text-green-600">✅ Sucesso: {bulkProgress.success}</span>
              <span className="text-red-600">❌ Falha: {bulkProgress.failed}</span>
            </div>
          </div>
        )}

        <button
          onClick={handleSendEmail}
          disabled={loading || isBulkSending || recipients.length === 0}
          className={`w-full px-6 py-3 rounded-lg font-bold text-white shadow-lg transition-all ${
            isBulkSending ? 'bg-orange-500' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
          } disabled:opacity-50 disabled:grayscale`}
        >
          {loading ? '⏳ Enviando...' : isBulkSending ? `⏳ Enviando Massa (${bulkProgress.current}/${bulkProgress.total})` : recipients.length > 1 ? '📤 Iniciar Envio em Massa' : '📤 Enviar E-mail'}
        </button>
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
        onPreview={handlePreview}
      />

      {/* Right-side preview sidebar */}
      {isPreviewSidebarOpen && previewTemplate && (
        <div className="fixed right-0 top-0 h-full w-full md:w-3/4 bg-white border-l border-gray-200 shadow-lg z-50 flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-600">Preview</div>
              <div className="font-semibold text-slate-900">{previewTemplate.name}</div>
              <div className="text-xs text-slate-500">{previewTemplate.subject}</div>
            </div>
            <button onClick={() => handlePreview(null)} className="text-slate-500 hover:text-slate-700">Fechar</button>
          </div>
          <div className="flex-1 overflow-hidden flex flex-col">
            <iframe
              srcDoc={previewTemplate.htmlContent}
              title="template-preview"
              className="flex-1 w-full h-full border-0"
              style={{ minHeight: 0 }}
            />
          </div>
          <div className="p-3 border-t flex gap-2">
            <button onClick={() => { handleSelectTemplate(previewTemplate); handlePreview(null); setIsTemplateModalOpen(false); }} className="flex-1 bg-green-600 text-white rounded-lg px-3 py-2">✅ Usar</button>
            <button onClick={() => handlePreview(null)} className="flex-1 bg-slate-200 rounded-lg px-3 py-2">Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
};
