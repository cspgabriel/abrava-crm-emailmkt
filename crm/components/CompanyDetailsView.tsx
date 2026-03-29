import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Edit2, Trash2, Sparkles, Building2, History as HistoryIcon, Mail as MailIcon, StickyNote, CornerDownRight, CheckCircle2 } from 'lucide-react';
import { AISummaryModal } from './AISummaryModal';
import { cleanText, safeRender, getStatusColor, formatCurrencyBR, normalizeEmail, normalizePhone } from '../utils/helpers';
import { COMPANY_FIELDS } from '../config/constants';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export const CompanyDetailsView = ({ company, allCompanies, campaigns, onBack, onEdit, onViewCompany, onDelete, detailFields, onEnrich }: any) => {
    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [notes, setNotes] = useState('');
    const [savingNote, setSavingNote] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setNotes(company?.notes || '');
    }, [company]);

    if (!company) return null;

    const relatedSimulations = useMemo(() => {
        if (!company || !allCompanies) return [];
        const emailKey = normalizeEmail(company.userEmail || company.email);
        const phoneKey = normalizePhone(company.userPhone || company.phone);
        
        return allCompanies.filter((c: any) => {
            if (c.id === company.id) return false;
            const cEmail = normalizeEmail(c.userEmail || c.email);
            const cPhone = normalizePhone(c.userPhone || c.phone);
            return (emailKey && cEmail && emailKey === cEmail) || (phoneKey && cPhone && phoneKey === cPhone);
        });
    }, [company, allCompanies]);

    const companyCampaigns = useMemo(() => {
        if (!campaigns || (!company.userEmail && !company.email)) return [];
        const targetEmail = (company.userEmail || company.email).toLowerCase().trim();
        return campaigns.filter((camp: any) => camp.recipientEmails && camp.recipientEmails.some((email: string) => email.toLowerCase().trim() === targetEmail));
    }, [campaigns, company]);

    const fieldsToShow = useMemo(() => {
        return detailFields || [];
    }, [detailFields]);

    const handleSaveNotes = async () => {
        setSavingNote(true);
        try {
            await updateDoc(doc(db, "companies", company.id), { notes });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (e) {
            console.error(e);
            alert("Erro ao salvar a anotação.");
        } finally {
            setSavingNote(false);
        }
    };

    const displayName = cleanText(company.userName ?? company.name ?? company.userEmail ?? company.id);
    const secondaryTag = cleanText(company.type ?? company.industry);

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <AISummaryModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} data={{profile: company, campaign_stats: { total_campaigns: companyCampaigns.length, last_campaign: companyCampaigns[0]?.subject }}} type="company" />
            <button onClick={onBack} className="flex items-center text-gray-500 hover:text-blue-600 transition-colors mb-4"><ArrowLeft className="h-4 w-4 mr-2"/> Voltar para Lista</button>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-900 to-slate-900 p-8 text-white flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">{displayName || '-'}</h1>
                        <div className="flex gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(company.status)}`}>{cleanText(company.status)}</span>
                            {secondaryTag && <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">{secondaryTag}</span>}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onEnrich} className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 backdrop-blur-sm rounded-lg text-emerald-100 text-sm font-bold transition-all flex items-center gap-2 border border-emerald-400/30"><Sparkles className="h-4 w-4" /> Enriquecer Dados</button>
                        <button onClick={() => setAiModalOpen(true)} className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-white text-sm font-bold transition-all flex items-center gap-2 border border-white/30"><Sparkles className="h-4 w-4 text-yellow-300" /> Raio-X da Simulação</button>
                        <button onClick={onEdit} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors" title="Editar"><Edit2 className="h-5 w-5"/></button>
                        <button onClick={() => onDelete(company.id)} className="p-2 bg-red-500/80 hover:bg-red-500 rounded-lg text-white transition-colors" title="Excluir"><Trash2 className="h-5 w-5"/></button>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div>
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-gray-100 pb-2"><Building2 className="h-4 w-4"/> Ficha Técnica</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {fieldsToShow.map((key: string) => {
                                    const val = company[key];
                                    if (val === undefined || val === null || val === '') return null;
                                    const label = COMPANY_FIELDS.find(f => f.key === key)?.label || key.replace(/_/g, ' ');
                                    const displayValue = key === 'creditAmount' ? formatCurrencyBR(val) : safeRender(val);
                                    return (<div key={key}><p className="text-xs text-gray-400 uppercase font-bold">{label}</p><p className="text-sm font-medium text-gray-800">{displayValue}</p></div>)
                                })}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-gray-100 pb-2"><HistoryIcon className="h-4 w-4"/> Histórico de Campanhas ({companyCampaigns.length})</h3>
                            {companyCampaigns.length === 0 ? (
                                <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400">Nenhuma campanha enviada para este cliente.</div>
                            ) : (
                                <div className="space-y-3">
                                    {companyCampaigns.map((camp: any) => (
                                        <div key={camp.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1"><MailIcon className="h-4 w-4 text-blue-500" /><span className="font-bold text-gray-900">{camp.subject}</span></div>
                                                <p className="text-xs text-gray-500">Enviado por {camp.responsible} em {new Date(camp.date?.seconds * 1000).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-8 lg:border-l lg:border-gray-100 lg:pl-8">
                        <div>
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-gray-100 pb-2"><StickyNote className="h-4 w-4"/> Anotações</h3>
                            <div className="bg-yellow-50/50 border border-yellow-200/50 rounded-xl p-4 shadow-sm">
                                <textarea
                                    className="w-full bg-transparent border-0 outline-none resize-none min-h-[150px] text-sm text-gray-700 placeholder:text-gray-400"
                                    placeholder="Digite suas observações, interesses ou detalhes da negociação com este cliente aqui..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                                <div className="mt-3 flex justify-end">
                                    <button
                                        onClick={handleSaveNotes}
                                        disabled={savingNote}
                                        className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
                                    >
                                        {savingNote ? 'Salvando...' : saved ? <><CheckCircle2 className="h-4 w-4"/> Salvo</> : 'Salvar Anotação'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-gray-100 pb-2"><CornerDownRight className="h-4 w-4"/> Outras Simulações</h3>
                            {relatedSimulations.length === 0 ? (
                                <div className="p-4 text-center text-xs text-gray-400 bg-gray-50 rounded-xl border border-gray-100">
                                    Este cliente não possui outras simulações no sistema.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {relatedSimulations.map((sim: any) => (
                                        <button 
                                            key={sim.id}
                                            onClick={() => onViewCompany(sim)}
                                            className="w-full text-left p-3 rounded-xl bg-white border border-gray-200 shadow-sm hover:border-blue-400 hover:shadow-md transition-all group"
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-bold text-sm text-gray-900 group-hover:text-blue-600 transition-colors">{cleanText(sim.type ?? sim.industry) || 'Simulação'}</span>
                                                <span className="text-xs font-bold text-gray-500">{new Date(sim.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                                            </div>
                                            <div className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded inline-block">
                                                {formatCurrencyBR(sim.creditAmount) || 'Valor não definido'}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
};
