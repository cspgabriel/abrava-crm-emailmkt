import React, { useState, useMemo } from 'react';
import { ArrowLeft, Edit2, Trash2, Sparkles, Mail as MailIcon, MessageCircle, UserPlus, History as HistoryIcon, Phone, Building2, CheckCircle, Calendar, Tag } from 'lucide-react';
import { AISummaryModal } from './AISummaryModal';
import { safeRender, cleanArrayValue, getLinkedCompanies, cleanText } from '../utils/helpers';

export const ContactDetailsView = ({ contact, onBack, onEdit, campaigns, onDelete, detailFields, companies, onViewCompany, formatCurrencyBR, getStatusColor }: any) => {
    const [activeTab, setActiveTab] = useState<'details'|'history'>('details');
    const [aiModalOpen, setAiModalOpen] = useState(false);
    
    const linkedCompanies = useMemo(() => {
        if (!contact || !companies) return [];
        return getLinkedCompanies(contact, companies);
    }, [contact, companies]);

    if (!contact) return null;
    
    const contactCampaigns = useMemo(() => {
        if (!campaigns || !contact.email) return [];
        return campaigns.filter((c: any) => c.recipientEmails && c.recipientEmails.includes(contact.email));
    }, [campaigns, contact]);

    const formatWhatsapp = (phone: string) => {
        if (!phone) return '#';
        const cleaned = phone.replace(/\D/g, '');
        return `https://wa.me/55${cleaned}`;
    };

    const [showCompose, setShowCompose] = React.useState(false);
    const [tplMessage, setTplMessage] = React.useState('Olá {{name}}, tudo bem? Aqui é da empresa.');
    const [previewVars, setPreviewVars] = React.useState<{[k:string]:string}>({ name: contact.name || '' });
    
    const formattedPreview = React.useMemo(() => {
        let out = tplMessage;
        Object.keys(previewVars).forEach(k => {
            const re = new RegExp(`{{\\s*${k}\\s*}}`, 'gi');
            out = out.replace(re, previewVars[k] || '');
        });
        return out;
    }, [tplMessage, previewVars]);

    const sendQuickWhatsApp = async (toPhone: string, messageText: string) => {
        try {
            const resolvedBase = ((import.meta as any)?.env?.VITE_API_WPP || '').replace(/\/$/, '') || '';
            const sendUrl = `${resolvedBase || ''}/send`;
            await fetch(sendUrl, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ phone: toPhone.replace(/\D/g,''), message: messageText, name: contact.name }) });
            setShowCompose(false);
            alert('Mensagem enviada (verifique o servidor para confirmar).');
        } catch (e) {
            console.error(e);
            alert('Erro ao enviar mensagem.');
        }
    };

    const [scheduledAt, setScheduledAt] = React.useState<string>('');
    const sendScheduledWhatsApp = async (toPhone: string, messageText: string, whenIso: string) => {
        try {
            const resolvedBase = ((import.meta as any)?.env?.VITE_API_WPP || '').replace(/\/$/, '') || '';
            const sendUrl = `${resolvedBase || ''}/schedule`;
            await fetch(sendUrl, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ phone: toPhone.replace(/\D/g,''), message: messageText, name: contact.name, scheduledAt: whenIso }) });
            setShowCompose(false);
            alert('Envio agendado (verifique o servidor para confirmar).');
        } catch (e) {
            console.error(e);
            alert('Erro ao agendar mensagem.');
        }
    };

    const [showEmailCompose, setShowEmailCompose] = React.useState(false);
    const [emailSubject, setEmailSubject] = React.useState('Contato da empresa');
    const [emailMessage, setEmailMessage] = React.useState('Olá {{name}}, tudo bem?');

    const formattedEmailPreview = React.useMemo(() => {
        let out = emailMessage;
        Object.keys(previewVars).forEach(k => {
            const re = new RegExp(`{{\\s*${k}\\s*}}`, 'gi');
            out = out.replace(re, previewVars[k] || '');
        });
        return out;
    }, [emailMessage, previewVars]);

    const sendEmailAPI = async (toEmail: string, subject: string, messageHtml: string) => {
        try {
            let envBase = ((import.meta as any)?.env?.VITE_EMAIL_API_URL || '').trim();
            const fallbackBase = 'https://email-api.abravacom.com.br';
            let resolvedBase = (envBase || fallbackBase).replace(/\/$/, '');
            if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
                resolvedBase = 'http://localhost:8788';
            }
            
            const sendUrl = `${resolvedBase}/send`;
            const apiKey = ((import.meta as any)?.env?.VITE_EMAIL_API_KEY || localStorage.getItem('crm_email_api_key') || '').trim();

            const response = await fetch(sendUrl, { 
                method: 'POST', 
                headers: {
                    'Content-Type': 'application/json',
                    ...(apiKey && { 'x-api-key': apiKey })
                }, 
                body: JSON.stringify({ 
                    to: toEmail, 
                    recipientName: contact.name || '', 
                    subject: subject, 
                    body: messageHtml.replace(/\n/g, '<br/>'),
                    provider: 'workspace' 
                }) 
            });
            
            const data = await response.json();

            if (data.ok) {
                setShowEmailCompose(false);
                alert('E-mail enviado via API com sucesso!');
            } else {
                alert(`Erro ao enviar email: ${data.error || 'Falha desconhecida'}`);
            }
        } catch (e) {
            console.error(e);
            alert('Erro ao enviar e-mail via API.');
        }
    };

    const fieldsToShow = useMemo(() => {
        return detailFields || [];
    }, [detailFields]);

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
             <AISummaryModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} data={{...contact, campaign_history: contactCampaigns.map((c: any) => ({ subject: c.subject, date: c.date }))}} type="contact" />
             <button onClick={onBack} className="flex items-center text-gray-500 hover:text-blue-600 transition-colors mb-4"><ArrowLeft className="h-4 w-4 mr-2"/> Voltar para Lista</button>
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                 <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white flex justify-between items-start">
                     <div className="flex items-center gap-6">
                         <div className="w-20 h-20 rounded-full bg-white text-blue-600 flex items-center justify-center text-3xl font-bold shadow-xl">{contact.name?.charAt(0)}</div>
                         <div>
                            <h1 className="text-3xl font-bold">{contact.name}</h1>
                            <div className="flex flex-col gap-1 mt-2">
                                {contact.role && <p className="text-blue-100 text-lg">{contact.role}</p>}
                                <div className="flex flex-wrap gap-2">
                                    {linkedCompanies.length > 0 ? (
                                        linkedCompanies.map((comp: any) => {
                                            const compName = comp?.userName ?? comp?.name ?? comp?.userEmail ?? comp?.id;
                                            return (
                                            <button 
                                                key={comp.id}
                                                onClick={() => onViewCompany && onViewCompany(comp)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium transition-colors border border-white/20"
                                            >
                                                <Building2 className="h-3 w-3" />
                                                {compName}
                                            </button>
                                        )})
                                    ) : (
                                        contact.company_name && <span className="text-blue-100 text-sm flex items-center gap-2"><Building2 className="h-4 w-4" /> {contact.company_name}</span>
                                    )}
                                </div>
                            </div>
                         </div>
                     </div>
                     <div className="flex gap-2">
                         <button onClick={() => setAiModalOpen(true)} className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-white text-sm font-bold transition-all flex items-center gap-2 border border-white/30"><Sparkles className="h-4 w-4 text-yellow-300" /> Raio-X do Perfil</button>
                         <button onClick={onEdit} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors" title="Editar"><Edit2 className="h-5 w-5"/></button>
                         <button onClick={() => onDelete(contact.id)} className="p-2 bg-red-500/80 hover:bg-red-500 rounded-lg text-white transition-colors" title="Excluir"><Trash2 className="h-5 w-5"/></button>
                     </div>
                 </div>
                 <div className="grid grid-cols-3 border-b border-gray-200 divide-x divide-gray-200">
                     <button onClick={() => setShowEmailCompose(true)} className="py-4 flex items-center justify-center gap-2 text-gray-700 font-bold hover:bg-gray-50 hover:text-blue-600 transition-colors"><MailIcon className="h-5 w-5"/> Enviar Email API</button>
                    <a href={formatWhatsapp(contact.phone)} target="_blank" rel="noreferrer" className="py-4 flex items-center justify-center gap-2 text-gray-700 font-bold hover:bg-green-50 hover:text-green-600 transition-colors"><MessageCircle className="h-5 w-5"/> WhatsApp CHAT</a>
                   <button onClick={() => {
                        const ev = new CustomEvent('openWhatsAppSender', { detail: { phone: contact.phone || '', name: contact.name || '', message: '' } });
                        window.dispatchEvent(ev);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }} className="py-4 flex items-center justify-center gap-2 text-gray-700 font-bold hover:bg-blue-50 hover:text-blue-600 transition-colors"><MessageCircle className="h-5 w-5"/> Enviar Mensagens API</button>
                 </div>
                 <div className="flex border-b border-gray-200 px-8 bg-gray-50">
                     <button onClick={() => setActiveTab('details')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><UserPlus className="h-4 w-4"/> Detalhes & Campanhas</button>
                     <button onClick={() => setActiveTab('history')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><HistoryIcon className="h-4 w-4"/> Linha do Tempo</button>
                 </div>
                 <div className="p-8">
                     {activeTab === 'details' && (
                         <>
                            <div className="mb-8 p-6 bg-blue-50 border border-blue-100 rounded-2xl">
                                <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Sparkles className="h-4 w-4"/> Ficha do Cliente (Médias)
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div>
                                        <p className="text-[10px] text-blue-400 font-bold uppercase mb-1">Valor Médio Simulado</p>
                                        <p className="text-xl font-black text-blue-900">{typeof formatCurrencyBR === 'function' ? formatCurrencyBR(contact.avg_simulation_value || 0) : `R$ ${(contact.avg_simulation_value || 0).toLocaleString('pt-BR')}`}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-blue-400 font-bold uppercase mb-1">Total de Simulações</p>
                                        <p className="text-xl font-black text-blue-900">{contact.total_simulations || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-blue-400 font-bold uppercase mb-1">CPF</p>
                                        <p className="text-xl font-black text-blue-900">{contact.cpf || contact.company_cpf || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-blue-400 font-bold uppercase mb-1">Lead de Origem</p>
                                        <p className="text-sm font-bold text-blue-800 truncate" title={contact.origem || contact.source || '-'}>{contact.origem || contact.source || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-8">
                                    <div>
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Informações de Contato</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600"><MailIcon className="h-5 w-5"/></div><div><p className="text-xs text-gray-500 uppercase font-bold">Email</p><p className="text-gray-900 font-medium">{contact.email || '-'}</p></div></div>
                                            <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600"><Phone className="h-5 w-5"/></div><div><p className="text-xs text-gray-500 uppercase font-bold">Telefone / WhatsApp</p><p className="text-gray-900 font-medium">{contact.phone || '-'}</p></div></div>
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600"><Tag className="h-5 w-5"/></div>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase font-bold">Mailings / Setores</p>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {cleanArrayValue(contact.mailing).length > 0 ? 
                                                            cleanArrayValue(contact.mailing).map((m: string, i: number) => (
                                                                <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium border border-purple-200">{m}</span>
                                                            )) 
                                                            : <p className="text-gray-900 font-medium">-</p>
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Outros Dados</h3>
                                        <div className="grid grid-cols-1 gap-3">
                                            {fieldsToShow.map((key: string) => {
                                                const val = contact[key];
                                                if (val === undefined || val === null || val === '') return null;
                                                return (<div key={key} className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400 uppercase font-bold mb-1">{key.replace(/_/g, ' ')}</p><p className="text-sm font-medium text-gray-800">{safeRender(val)}</p></div>)
                                            })}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2 flex items-center gap-2"><MailIcon className="h-4 w-4"/> Histórico de Campanhas Recebidas ({contactCampaigns.length})</h3>
                                    {contactCampaigns.length === 0 ? (
                                        <div className="p-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200"><MailIcon className="h-10 w-10 mx-auto mb-3 text-gray-300"/><p className="text-sm text-gray-500">Este contato ainda não recebeu nenhuma campanha.</p></div>
                                    ) : (
                                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                                            {contactCampaigns.map((camp: any) => (
                                                <div key={camp.id} className="flex items-start gap-4 p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all">
                                                     <div className="mt-1 w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0"><CheckCircle className="h-4 w-4"/></div>
                                                     <div><p className="font-bold text-gray-900 text-sm leading-tight mb-1">{camp.subject}</p><p className="text-xs text-gray-500 mb-1">Enviado por {camp.responsible}</p><p className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="h-3 w-3"/> {new Date(camp.date?.seconds * 1000).toLocaleString()}</p></div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                     )}

                    {showCompose && (
                        <div className="fixed inset-0 z-[1000] flex items-center justify-center border-box">
                            <div className="absolute inset-0 bg-black/40" onClick={() => setShowCompose(false)} />
                            <div className="relative bg-white rounded-2xl p-6 w-[520px] shadow-lg z-10">
                                <h4 className="font-bold mb-2">Enviar WhatsApp — Pré-visualização</h4>
                                <label className="text-xs text-gray-500">Template de mensagem (use {'{{name}}'})</label>
                                <textarea value={tplMessage} onChange={e=>setTplMessage(e.target.value)} rows={3} className="w-full p-2 border rounded mt-2 mb-3" />
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div>
                                        <label className="text-xs text-gray-400">Nome (substituição)</label>
                                        <input className="w-full p-2 border rounded" value={previewVars.name} onChange={e=>setPreviewVars(v=>({...v, name: e.target.value}))} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400">Telefone destino</label>
                                        <input className="w-full p-2 border rounded" value={contact.phone || ''} onChange={e=>{/* noop */}} disabled />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-3 mb-3">
                                    <label className="text-xs text-gray-400">Agendar envio</label>
                                    <input type="datetime-local" value={scheduledAt} onChange={e=>setScheduledAt(e.target.value)} className="w-full p-2 border rounded" />
                                    <p className="text-xs text-slate-400">Se vazio, envio é imediato.</p>
                                </div>
                                <div className="mb-4">
                                    <label className="text-xs text-gray-400">Pré-visualização (formatação aplicada)</label>
                                    <div className="mt-2 p-3 bg-slate-50 border rounded text-sm whitespace-pre-wrap">{formattedPreview}</div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setShowCompose(false)} className="px-3 py-2 rounded border">Fechar</button>
                                    <button onClick={() => {
                                        if (scheduledAt) {
                                            const iso = new Date(scheduledAt).toISOString();
                                            sendScheduledWhatsApp(contact.phone || '', formattedPreview, iso);
                                        } else {
                                            sendQuickWhatsApp(contact.phone || '', formattedPreview);
                                        }
                                    }} className="px-4 py-2 bg-emerald-600 text-white rounded">{scheduledAt ? 'Agendar' : 'Enviar'}</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {showEmailCompose && (
                        <div className="fixed inset-0 z-[1000] flex items-center justify-center border-box">
                            <div className="absolute inset-0 bg-black/40" onClick={() => setShowEmailCompose(false)} />
                            <div className="relative bg-white rounded-2xl p-6 w-[520px] shadow-lg z-10">
                                <h4 className="font-bold mb-4 flex items-center gap-2"><MailIcon className="h-5 w-5" /> Enviar E-mail via API</h4>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Destinatário</label>
                                        <input className="w-full p-2 border rounded bg-gray-50 mb-2" value={contact.email || ''} disabled />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Assunto do E-mail</label>
                                        <input className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" value={emailSubject} onChange={e=>setEmailSubject(e.target.value)} placeholder="Ex: Proposta Comercial" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Corpo da Mensagem (use {'{{name}}'})</label>
                                        <textarea value={emailMessage} onChange={e=>setEmailMessage(e.target.value)} rows={5} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 font-sans" />
                                    </div>

                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                        <label className="text-xs text-slate-500 block mb-1">Pré-visualização</label>
                                        <div className="text-sm text-gray-800 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formattedEmailPreview.replace(/\n/g, '<br/>') }}></div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 mt-6">
                                    <button onClick={() => setShowEmailCompose(false)} className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-50">Cancelar</button>
                                    <button onClick={() => {
                                        if (!contact.email) {
                                            alert('Contato não possui e-mail cadastrado.');
                                            return;
                                        }
                                        if (!emailSubject || !emailMessage) {
                                            alert('Preencha assunto e mensagem.');
                                            return;
                                        }
                                        sendEmailAPI(contact.email, emailSubject, formattedEmailPreview);
                                    }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2">
                                        <MailIcon className="h-4 w-4" /> Enviar Agora
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                     {activeTab === 'history' && (
                         <div className="max-w-2xl">
                             {linkedCompanies.length > 0 && (
                                 <div className="mb-6">
                                     <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Simulações Vinculadas</h3>
                                     <div className="space-y-2">
                                         {linkedCompanies.map((comp: any) => (
                                             <button key={comp.id} onClick={() => onViewCompany && onViewCompany(comp)} className="w-full text-left px-3 py-2 border border-blue-100 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                                                 Ver Simulação: <span className="font-semibold">{cleanText(comp.userName ?? comp.name ?? comp.userEmail ?? comp.id)}</span> (ID: {comp.id})
                                             </button>
                                         ))}
                                     </div>
                                 </div>
                             )}
                             <div className="space-y-6 pl-4 border-l-2 border-gray-100">
                                 <div className="relative"><div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-white"></div><p className="text-sm font-bold text-gray-900">Cadastro Criado</p><p className="text-xs text-gray-500">{contact.createdAt?.seconds ? new Date(contact.createdAt.seconds * 1000).toLocaleString() : 'Data desconhecida'}</p><p className="text-sm text-gray-600 mt-1">Origem: {contact.source || 'Manual/Importação'}</p></div>
                                 {contact.history && contact.history.map((h: any, idx: number) => (
                                     <div key={idx} className="relative animate-in slide-in-from-left-2" style={{animationDelay: `${idx * 50}ms`}}><div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-gray-300 ring-4 ring-white"></div><p className="text-sm font-bold text-gray-900">{h.type === 'form_submission' ? 'Atualização via Formulário' : 'Evento'}</p><p className="text-xs text-gray-500">{new Date(h.date).toLocaleString()}</p><p className="text-sm text-gray-600 mt-1">{h.description}</p></div>
                                 ))}
                             </div>
                         </div>
                     )}
                 </div>
             </div>
          </div>
    )
};
