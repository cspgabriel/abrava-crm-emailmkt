import React, { useState, useMemo } from 'react';
import { ArrowLeft, Repeat, Trash2, Calendar, Users, Search, Download } from 'lucide-react';
import { utils, writeFile } from 'xlsx';

export const CampaignDetailsView = ({ campaign, onBack, onDelete, onReuse, allContacts }: any) => {
    const [recipientSearch, setRecipientSearch] = useState('');
    if (!campaign) return null;
    const filteredRecipients = useMemo(() => {
        const list = campaign.recipientEmails || [];
        if (!recipientSearch) return list;
        return list.filter((email: string) => email.toLowerCase().includes(recipientSearch.toLowerCase()));
    }, [campaign, recipientSearch]);
    const resolveContact = (email: string) => { return allContacts.find((c: any) => c.email === email); }
    const downloadRecipients = () => {
        const data = (campaign.recipientEmails || []).map((email: string) => {
            const contact = resolveContact(email);
            return { Email: email, Nome: contact?.name || 'Desconhecido', 'Hotel/Simulação': contact?.company_name || '-' }
        });
        const ws = utils.json_to_sheet(data);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Destinatários");
        writeFile(wb, `Campanha_${campaign.subject.substring(0,20)}_Destinatarios.xlsx`);
    }
    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <button onClick={onBack} className="flex items-center text-gray-500 hover:text-blue-600 transition-colors mb-4"><ArrowLeft className="h-4 w-4 mr-2"/> Voltar</button>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-8 border-b border-gray-200">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2"><span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase">Enviada</span><span className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="h-3 w-3"/> {new Date(campaign.date?.seconds * 1000).toLocaleString()}</span></div>
                            <h1 className="text-2xl font-bold text-gray-900">{campaign.subject}</h1>
                            <p className="text-gray-500 mt-1">Responsável: <span className="font-medium text-gray-900">{campaign.responsible}</span></p>
                        </div>
                        <div className="flex gap-2">
                             <button onClick={() => onReuse(campaign)} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 flex items-center gap-2"><Repeat className="h-4 w-4"/> Reenviar</button>
                             <button onClick={(e) => onDelete(campaign.id, e)} className="px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 flex items-center gap-2"><Trash2 className="h-4 w-4"/> Excluir</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center"><p className="text-xs font-bold text-gray-400 uppercase">Total Enviado</p><p className="text-3xl font-bold text-gray-900">{campaign.recipientCount}</p></div>
                    </div>
                </div>
                <div className="p-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2"><Users className="h-4 w-4"/> Destinatários ({filteredRecipients.length})</h3>
                        <div className="flex gap-2">
                             <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" /><input type="text" placeholder="Buscar email..." className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500" value={recipientSearch} onChange={e => setRecipientSearch(e.target.value)} /></div>
                             <button onClick={downloadRecipients} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"><Download className="h-3 w-3"/> Baixar Lista</button>
                        </div>
                    </div>
                    <div className="border border-gray-200 rounded-xl overflow-hidden max-h-[500px] overflow-y-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200 sticky top-0"><tr><th className="px-4 py-3">Email</th><th className="px-4 py-3">Nome Associado</th><th className="px-4 py-3">Hotel / Simulação</th></tr></thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredRecipients.map((email: string, i: number) => { const contact = resolveContact(email); return (<tr key={i} className="hover:bg-gray-50"><td className="px-4 py-2 font-medium text-gray-700">{email}</td><td className="px-4 py-2 text-gray-500">{contact?.name || '-'}</td><td className="px-4 py-2 text-gray-500 text-xs">{contact?.company_name || '-'}</td></tr>) })}
                                {filteredRecipients.length === 0 && (<tr><td colSpan={3} className="p-8 text-center text-gray-400">Nenhum email encontrado na busca.</td></tr>)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}