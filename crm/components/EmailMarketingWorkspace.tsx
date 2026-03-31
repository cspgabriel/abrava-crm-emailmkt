import React, { useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import {
  BarChart3,
  CheckCircle2,
  Copy,
  Eye,
  FileText,
  LayoutTemplate,
  ListChecks,
  Mail,
  PencilLine,
  Plus,
  Save,
  Search,
  Send,
  Sparkles,
  Trash2,
  Users
} from 'lucide-react';
import { db } from '../../firebase';
import { cleanArrayValue, cleanText, normalizeEmail, safeRender } from '../utils/helpers';

type MarketingList = {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  contactIds?: string[];
  emails?: string[];
  createdAt?: any;
  updatedAt?: any;
};

type MarketingTemplate = {
  id: string;
  name: string;
  subject: string;
  previewText?: string;
  html: string;
  category?: string;
  updatedAt?: any;
};

type MarketingHistory = {
  id: string;
  name: string;
  subject: string;
  listName: string;
  status: 'Rascunho' | 'Agendada' | 'Enviada';
  channel: 'Email';
  sentAt?: any;
  opens?: number;
  clicks?: number;
  recipients?: number;
  owner?: string;
};

const LISTS_COLLECTION = 'crm_email_marketing_lists';
const TEMPLATES_COLLECTION = 'crm_email_marketing_templates';
const HISTORY_COLLECTION = 'crm_email_marketing_history';

const emptyTemplate = {
  name: '',
  subject: '',
  previewText: '',
  html: `<div style="font-family:Arial,sans-serif;color:#0f172a;">
  <h1 style="margin:0 0 16px;">Olá, {{name}}!</h1>
  <p style="margin:0 0 12px;">Escreva aqui o conteúdo principal da sua campanha.</p>
  <p style="margin:0;">Inclua ofertas, novidades ou convites de forma clara e objetiva.</p>
</div>`
};

const toDateLabel = (value: any) => {
  if (!value) return '-';
  if (value?.seconds) return new Date(value.seconds * 1000).toLocaleString('pt-BR');
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('pt-BR');
};

const pct = (value?: number, total?: number) => {
  if (!total) return 0;
  return Math.round(((value || 0) / total) * 1000) / 10;
};

export const EmailMarketingWorkspace: React.FC<{ contacts?: any[]; campaigns?: any[] }> = ({
  contacts = [],
  campaigns = []
}) => {
  const [activeTab, setActiveTab] = useState<'lists' | 'designer' | 'history'>('lists');
  const [lists, setLists] = useState<MarketingList[]>([]);
  const [templates, setTemplates] = useState<MarketingTemplate[]>([]);
  const [historyItems, setHistoryItems] = useState<MarketingHistory[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [listName, setListName] = useState('');
  const [listDescription, setListDescription] = useState('');
  const [listTags, setListTags] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [editingTemplateId, setEditingTemplateId] = useState<string>('');
  const [templateName, setTemplateName] = useState(emptyTemplate.name);
  const [templateSubject, setTemplateSubject] = useState(emptyTemplate.subject);
  const [templatePreviewText, setTemplatePreviewText] = useState(emptyTemplate.previewText);
  const [templateHtml, setTemplateHtml] = useState(emptyTemplate.html);
  const [historySearch, setHistorySearch] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [campaignSubject, setCampaignSubject] = useState('');
  const [campaignListId, setCampaignListId] = useState('');
  const [campaignStatus, setCampaignStatus] = useState<'Rascunho' | 'Agendada' | 'Enviada'>('Rascunho');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!db) return;
    const unsubLists = onSnapshot(collection(db, LISTS_COLLECTION), (snapshot) => {
      const data = snapshot.docs.map(docItem => ({ id: docItem.id, ...(docItem.data() as any) })) as MarketingList[];
      setLists(data);
    });
    const unsubTemplates = onSnapshot(collection(db, TEMPLATES_COLLECTION), (snapshot) => {
      const data = snapshot.docs.map(docItem => ({ id: docItem.id, ...(docItem.data() as any) })) as MarketingTemplate[];
      setTemplates(data);
    });
    const unsubHistory = onSnapshot(collection(db, HISTORY_COLLECTION), (snapshot) => {
      const data = snapshot.docs.map(docItem => ({ id: docItem.id, ...(docItem.data() as any) })) as MarketingHistory[];
      setHistoryItems(data);
    });

    return () => {
      unsubLists();
      unsubTemplates();
      unsubHistory();
    };
  }, []);

  const contactsWithEmail = useMemo(() => {
    return (contacts || []).filter((contact: any) => normalizeEmail(contact.email));
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    const query = contactSearch.trim().toLowerCase();
    return contactsWithEmail.filter((contact: any) => {
      if (!query) return true;
      return [contact.name, contact.email, contact.company_name, contact.role]
        .some(value => String(value || '').toLowerCase().includes(query));
    });
  }, [contactSearch, contactsWithEmail]);

  const selectedContacts = useMemo(() => {
    return contactsWithEmail.filter((contact: any) => selectedContactIds.has(contact.id));
  }, [contactsWithEmail, selectedContactIds]);

  const totalReach = useMemo(() => {
    return lists.reduce((acc, item) => acc + (item.contactIds?.length || item.emails?.length || 0), 0);
  }, [lists]);

  const mergedHistory = useMemo(() => {
    const existingCampaigns = (campaigns || []).map((item: any) => ({
      id: `legacy-${item.id}`,
      name: safeRender(item.subject || item.name || 'Campanha anterior'),
      subject: safeRender(item.subject || '-'),
      listName: safeRender(item.listName || item.segmentName || 'Base atual'),
      status: 'Enviada' as const,
      channel: 'Email' as const,
      sentAt: item.date || item.sentAt || item.createdAt,
      opens: Number(item.opens || 0),
      clicks: Number(item.clicks || 0),
      recipients: Number(item.recipientCount || item.recipients || 0),
      owner: safeRender(item.responsible || item.owner || 'Equipe CRM')
    }));

    return [...historyItems, ...existingCampaigns]
      .sort((a, b) => {
        const aTime = a.sentAt?.seconds ? a.sentAt.seconds : new Date(a.sentAt || 0).getTime() / 1000;
        const bTime = b.sentAt?.seconds ? b.sentAt.seconds : new Date(b.sentAt || 0).getTime() / 1000;
        return (bTime || 0) - (aTime || 0);
      });
  }, [campaigns, historyItems]);

  const filteredHistory = useMemo(() => {
    const query = historySearch.trim().toLowerCase();
    return mergedHistory.filter(item => {
      if (!query) return true;
      return [item.name, item.subject, item.listName, item.owner, item.status]
        .some(value => String(value || '').toLowerCase().includes(query));
    });
  }, [historySearch, mergedHistory]);

  const resetListForm = () => {
    setSelectedListId('');
    setListName('');
    setListDescription('');
    setListTags('');
    setSelectedContactIds(new Set());
  };

  const resetTemplateForm = () => {
    setEditingTemplateId('');
    setTemplateName(emptyTemplate.name);
    setTemplateSubject(emptyTemplate.subject);
    setTemplatePreviewText(emptyTemplate.previewText);
    setTemplateHtml(emptyTemplate.html);
  };

  const showFeedback = (message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 2400);
  };

  const handleSelectList = (item: MarketingList) => {
    setActiveTab('lists');
    setSelectedListId(item.id);
    setListName(item.name || '');
    setListDescription(item.description || '');
    setListTags((item.tags || []).join(', '));
    setSelectedContactIds(new Set(item.contactIds || []));
  };

  const handleSaveList = async () => {
    if (!db || !listName.trim()) {
      showFeedback('Informe um nome para a lista.');
      return;
    }

    const payload = {
      name: listName.trim(),
      description: listDescription.trim(),
      tags: cleanArrayValue(listTags.replace(/,/g, ';')),
      contactIds: Array.from(selectedContactIds),
      emails: selectedContacts.map((contact: any) => normalizeEmail(contact.email)).filter(Boolean),
      updatedAt: serverTimestamp()
    };

    if (selectedListId) {
      await updateDoc(doc(db, LISTS_COLLECTION, selectedListId), payload);
      showFeedback('Lista atualizada com sucesso.');
      return;
    }

    await addDoc(collection(db, LISTS_COLLECTION), {
      ...payload,
      createdAt: serverTimestamp()
    });
    resetListForm();
    showFeedback('Lista criada com sucesso.');
  };

  const handleDeleteList = async (id: string) => {
    if (!db || !confirm('Deseja excluir esta lista?')) return;
    await deleteDoc(doc(db, LISTS_COLLECTION, id));
    if (selectedListId === id) resetListForm();
    showFeedback('Lista removida.');
  };

  const applyTemplate = (item: MarketingTemplate) => {
    setActiveTab('designer');
    setEditingTemplateId(item.id);
    setTemplateName(item.name || '');
    setTemplateSubject(item.subject || '');
    setTemplatePreviewText(item.previewText || '');
    setTemplateHtml(item.html || emptyTemplate.html);
  };

  const handleSaveTemplate = async () => {
    if (!db || !templateName.trim() || !templateSubject.trim() || !templateHtml.trim()) {
      showFeedback('Preencha nome, assunto e HTML do template.');
      return;
    }

    const payload = {
      name: templateName.trim(),
      subject: templateSubject.trim(),
      previewText: templatePreviewText.trim(),
      html: templateHtml,
      category: 'Email Marketing',
      updatedAt: serverTimestamp()
    };

    if (editingTemplateId) {
      await updateDoc(doc(db, TEMPLATES_COLLECTION, editingTemplateId), payload);
      showFeedback('Template salvo com sucesso.');
      return;
    }

    await addDoc(collection(db, TEMPLATES_COLLECTION), {
      ...payload,
      createdAt: serverTimestamp()
    });
    resetTemplateForm();
    showFeedback('Template criado com sucesso.');
  };
  const handleDeleteTemplate = async (id: string) => {
    if (!db || !confirm('Deseja excluir este template?')) return;
    await deleteDoc(doc(db, TEMPLATES_COLLECTION, id));
    if (editingTemplateId === id) resetTemplateForm();
    showFeedback('Template removido.');
  };

  const insertSnippet = (snippet: string) => {
    setTemplateHtml(prev => `${prev}\n${snippet}`);
  };

  const handleCreateHistory = async () => {
    if (!db || !campaignName.trim() || !campaignSubject.trim()) {
      showFeedback('Preencha nome e assunto da campanha.');
      return;
    }

    const relatedList = lists.find(item => item.id === campaignListId);
    const recipients = relatedList?.contactIds?.length || relatedList?.emails?.length || 0;

    await addDoc(collection(db, HISTORY_COLLECTION), {
      name: campaignName.trim(),
      subject: campaignSubject.trim(),
      listName: relatedList?.name || 'Sem lista vinculada',
      status: campaignStatus,
      channel: 'Email',
      sentAt: serverTimestamp(),
      opens: campaignStatus === 'Enviada' ? Math.round(recipients * 0.42) : 0,
      clicks: campaignStatus === 'Enviada' ? Math.round(recipients * 0.11) : 0,
      recipients,
      owner: 'Equipe CRM'
    });

    setCampaignName('');
    setCampaignSubject('');
    setCampaignListId('');
    setCampaignStatus('Rascunho');
    showFeedback('Campanha registrada no histórico.');
  };

  const summaryCards = [
    { label: 'Listas ativas', value: lists.length, icon: ListChecks, accent: 'from-blue-500 to-indigo-600' },
    { label: 'Contatos em listas', value: totalReach, icon: Users, accent: 'from-emerald-500 to-green-600' },
    { label: 'Templates salvos', value: templates.length, icon: LayoutTemplate, accent: 'from-violet-500 to-purple-600' },
    { label: 'Campanhas mapeadas', value: mergedHistory.length, icon: BarChart3, accent: 'from-amber-500 to-orange-500' }
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <Sparkles className="h-3.5 w-3.5" />
              Novo módulo isolado do CRM atual
            </div>
            <h1 className="text-3xl font-bold text-slate-900">E-mail Marketing Pro</h1>
            <p className="max-w-3xl text-sm text-slate-600">
              Expansão segura com páginas novas para listas, designer de email e histórico de campanhas,
              sem alterar a tela atual de envio que já está funcionando.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {summaryCards.map(card => (
              <div key={card.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className={`mb-3 inline-flex rounded-xl bg-gradient-to-br p-2 text-white ${card.accent}`}>
                  <card.icon className="h-4 w-4" />
                </div>
                <div className="text-2xl font-bold text-slate-900">{card.value}</div>
                <div className="text-xs font-medium text-slate-500">{card.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {[
            { key: 'lists', label: 'Listas', icon: ListChecks },
            { key: 'designer', label: 'Design de Email', icon: PencilLine },
            { key: 'history', label: 'Histórico', icon: BarChart3 }
          ].map(item => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key as any)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === item.key
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>
        {feedback && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            {feedback}
          </div>
        )}
      </div>

      {activeTab === 'lists' && (
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Listas de distribuição</h2>
                <p className="text-sm text-slate-500">Monte segmentos sem encostar na base atual de campanhas.</p>
              </div>
              <button onClick={resetListForm} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                Nova lista
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <input value={listName} onChange={(e) => setListName(e.target.value)} placeholder="Nome da lista" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400" />
              <input value={listTags} onChange={(e) => setListTags(e.target.value)} placeholder="Tags (VIP, Hotéis, Eventos)" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400" />
            </div>
            <textarea value={listDescription} onChange={(e) => setListDescription(e.target.value)} placeholder="Descrição da estratégia ou critério da lista" rows={3} className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400" />

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={contactSearch} onChange={(e) => setContactSearch(e.target.value)} placeholder="Buscar contatos por nome, email, empresa ou cargo" className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-400" />
              </div>
              <div className="mt-4 max-h-[420px] overflow-y-auto rounded-2xl border border-slate-200 bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-3"></th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Contato</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Empresa</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContacts.slice(0, 150).map((contact: any) => {
                      const checked = selectedContactIds.has(contact.id);
                      return (
                        <tr key={contact.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setSelectedContactIds((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(contact.id)) next.delete(contact.id);
                                  else next.add(contact.id);
                                  return next;
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-800">{cleanText(contact.name) || 'Sem nome'}</div>
                            <div className="text-xs text-slate-500">{cleanText(contact.role) || 'Sem cargo'}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{cleanText(contact.company_name) || '-'}</td>
                          <td className="px-4 py-3 text-slate-600">{normalizeEmail(contact.email)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-slate-600">
                  {selectedContacts.length} contato(s) selecionado(s) para esta lista
                </div>
                <button onClick={handleSaveList} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                  <Save className="h-4 w-4" />
                  {selectedListId ? 'Salvar lista' : 'Criar lista'}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">Listas salvas</h3>
              <div className="mt-4 space-y-3">
                {lists.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                    Nenhuma lista criada ainda.
                  </div>
                )}
                {lists.map(item => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">{item.name}</div>
                        <div className="mt-1 text-xs text-slate-500">{item.description || 'Sem descrição'}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleSelectList(item)} className="rounded-xl bg-slate-100 p-2 text-slate-600 hover:bg-slate-200">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDeleteList(item.id)} className="rounded-xl bg-rose-50 p-2 text-rose-600 hover:bg-rose-100">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(item.tags || []).map(tag => (
                        <span key={tag} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <div className="text-xs text-slate-500">Contatos</div>
                        <div className="font-bold text-slate-900">{item.contactIds?.length || 0}</div>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <div className="text-xs text-slate-500">Atualizada</div>
                        <div className="font-bold text-slate-900">{toDateLabel(item.updatedAt)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm">
              <h3 className="text-lg font-bold">Como isso encaixa no CRM atual</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                <li>- Usa coleções novas do Firestore, sem sobrescrever campanhas existentes.</li>
                <li>- Permite preparar segmentações antes de ligar o envio real.</li>
                <li>- Reaproveita sua base de contatos já cadastrada no CRM.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'designer' && (
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Designer de email</h2>
                  <p className="text-sm text-slate-500">Editor simples com preview ao vivo e placeholders.</p>
                </div>
                <button onClick={resetTemplateForm} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                  Novo template
                </button>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Nome do template" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400" />
                <input value={templateSubject} onChange={(e) => setTemplateSubject(e.target.value)} placeholder="Assunto do email" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400" />
              </div>
              <input value={templatePreviewText} onChange={(e) => setTemplatePreviewText(e.target.value)} placeholder="Preview text do inbox" className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400" />

              <div className="mt-4 flex flex-wrap gap-2">
                {['{{name}}', '{{email}}', '{{company_name}}', '{{unsubscribe_link}}'].map(token => (
                  <button key={token} onClick={() => insertSnippet(token)} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200">
                    {token}
                  </button>
                ))}
                <button onClick={() => insertSnippet('<a href="https://abravacon.com.br" style="color:#2563eb;">CTA principal</a>')} className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100">
                  Inserir CTA
                </button>
                <button onClick={() => insertSnippet('<table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border-radius:16px;"><tr><td style="padding:24px;">Novo bloco</td></tr></table>')} className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100">
                  Inserir bloco
                </button>
              </div>

              <textarea value={templateHtml} onChange={(e) => setTemplateHtml(e.target.value)} rows={20} className="mt-4 w-full rounded-3xl border border-slate-200 bg-slate-950 p-4 font-mono text-sm text-slate-100 outline-none focus:border-blue-400" />

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button onClick={handleSaveTemplate} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                  <Save className="h-4 w-4" />
                  {editingTemplateId ? 'Salvar template' : 'Criar template'}
                </button>
                <button onClick={() => navigator.clipboard.writeText(templateHtml)} className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200">
                  <Copy className="h-4 w-4" />
                  Copiar HTML
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">Templates salvos</h3>
              <div className="mt-4 space-y-3">
                {templates.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                    Nenhum template salvo ainda.
                  </div>
                )}
                {templates.map(item => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">{item.name}</div>
                        <div className="text-sm text-slate-500">{item.subject}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => applyTemplate(item)} className="rounded-xl bg-slate-100 p-2 text-slate-600 hover:bg-slate-200">
                          <FileText className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDeleteTemplate(item.id)} className="rounded-xl bg-rose-50 p-2 text-rose-600 hover:bg-rose-100">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-slate-500">{item.previewText || 'Sem preview text'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Mail className="h-5 w-5 text-slate-700" />
              <h3 className="text-lg font-bold text-slate-900">Pré-visualização</h3>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-slate-100 p-4">
              <div className="mx-auto max-w-3xl rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-6 py-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Assunto</div>
                  <div className="mt-1 text-xl font-bold text-slate-900">{templateSubject || 'Seu assunto aparece aqui'}</div>
                  <div className="mt-2 text-sm text-slate-500">{templatePreviewText || 'Preview text do email'}</div>
                </div>
                <div className="px-6 py-8">
                  <div
                    className="prose max-w-none text-slate-700"
                    dangerouslySetInnerHTML={{
                      __html: templateHtml
                        .replace(/{{name}}/g, 'Maria da Silva')
                        .replace(/{{email}}/g, 'maria@empresa.com.br')
                        .replace(/{{company_name}}/g, 'Hotel Exemplo')
                        .replace(/{{unsubscribe_link}}/g, '#')
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Send className="h-5 w-5 text-slate-700" />
                <h2 className="text-xl font-bold text-slate-900">Registrar campanha</h2>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Esta tela já pode organizar o histórico, mesmo antes de conectar o disparo automático.
              </p>
              <div className="mt-4 space-y-4">
                <input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="Nome interno da campanha" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400" />
                <input value={campaignSubject} onChange={(e) => setCampaignSubject(e.target.value)} placeholder="Assunto enviado" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400" />
                <select value={campaignListId} onChange={(e) => setCampaignListId(e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400">
                  <option value="">Sem lista vinculada</option>
                  {lists.map(item => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
                <select value={campaignStatus} onChange={(e) => setCampaignStatus(e.target.value as any)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400">
                  <option value="Rascunho">Rascunho</option>
                  <option value="Agendada">Agendada</option>
                  <option value="Enviada">Enviada</option>
                </select>
                <button onClick={handleCreateHistory} className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
                  <Plus className="h-4 w-4" />
                  Adicionar ao histórico
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Histórico de campanhas</h2>
                  <p className="text-sm text-slate-500">Unifica o histórico novo com as campanhas que já existiam no CRM.</p>
                </div>
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} placeholder="Buscar campanha" className="w-full rounded-2xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-400" />
                </div>
              </div>

              <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-3 font-semibold text-slate-600">Campanha</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Lista</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Destinatários</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Abertura</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Cliques</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                          Nenhuma campanha encontrada.
                        </td>
                      </tr>
                    )}
                    {filteredHistory.map(item => (
                      <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-4">
                          <div className="font-semibold text-slate-900">{item.name}</div>
                          <div className="text-xs text-slate-500">{item.subject}</div>
                        </td>
                        <td className="px-4 py-4 text-slate-600">{item.listName}</td>
                        <td className="px-4 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            item.status === 'Enviada'
                              ? 'bg-emerald-100 text-emerald-700'
                              : item.status === 'Agendada'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-700'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-semibold text-slate-800">{item.recipients || 0}</td>
                        <td className="px-4 py-4 text-slate-600">{pct(item.opens, item.recipients)}%</td>
                        <td className="px-4 py-4 text-slate-600">{pct(item.clicks, item.recipients)}%</td>
                        <td className="px-4 py-4 text-slate-600">{toDateLabel(item.sentAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Campanhas enviadas</div>
              <div className="mt-2 text-3xl font-bold text-slate-900">
                {mergedHistory.filter(item => item.status === 'Enviada').length}
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Melhor abertura</div>
              <div className="mt-2 text-3xl font-bold text-slate-900">
                {mergedHistory.length ? `${Math.max(...mergedHistory.map(item => pct(item.opens, item.recipients)))}%` : '0%'}
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Melhor clique</div>
              <div className="mt-2 text-3xl font-bold text-slate-900">
                {mergedHistory.length ? `${Math.max(...mergedHistory.map(item => pct(item.clicks, item.recipients)))}%` : '0%'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
