import React, { useMemo, useState } from 'react';
import { ArrowLeft, Send, Search, Filter as FilterIcon } from 'lucide-react';
import { FilterDropdown } from './Common';
import { cleanArrayValue, cleanText, getUniqueValues, safeRender } from '../utils/helpers';

type NewCampaignPayload = {
    subject: string;
    responsible: string;
    body: string;
    recipients: any[];
    method: 'email' | 'whatsapp';
};

export const NewCampaignPage = ({ contacts = [], onBack, onSend }: any) => {
    const [subject, setSubject] = useState('');
    const [responsible, setResponsible] = useState('Equipe CRM');
    const [body, setBody] = useState('');
    const [search, setSearch] = useState('');
    const [showFilters, setShowFilters] = useState(true);
    const [activeFilters, setActiveFilters] = useState<{[key: string]: string[]}>({});
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [sendMethod, setSendMethod] = useState<'email' | 'whatsapp'>('email');

    const filterKeys = ['department', 'mailing', 'role'];

    const filteredContacts = useMemo(() => {
        const searchLower = search.toLowerCase();
        return (contacts || []).filter((c: any) => {
            const matchesSearch = !searchLower || Object.values(c || {}).some(val => String(val).toLowerCase().includes(searchLower));
            if (!matchesSearch) return false;
            const matchesFilters = Object.keys(activeFilters).every(key => {
                const selected = activeFilters[key];
                if (!selected || selected.length === 0) return true;
                const val = c[key];
                const itemValues = cleanArrayValue(val).map(v => cleanText(v));
                const hasEmpty = selected.includes('(Vazio)');
                const isEmpty = !val || val === '' || (Array.isArray(val) && val.length === 0);
                if (hasEmpty && isEmpty) return true;
                return itemValues.some(v => selected.includes(v));
            });
            return matchesFilters;
        });
    }, [contacts, search, activeFilters]);

    const toggleSelection = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const toggleSelectAll = () => {
        if (filteredContacts.length === 0) return;
        if (selectedIds.size === filteredContacts.length) {
            setSelectedIds(new Set());
            return;
        }
        const next = new Set<string>();
        filteredContacts.forEach((c: any) => next.add(c.id));
        setSelectedIds(next);
    };

    const handleSend = () => {
        const recipients = filteredContacts.filter((c: any) => selectedIds.has(c.id));
        const payload: NewCampaignPayload = { subject, responsible, body, recipients, method: sendMethod };
        onSend(payload);
    };

    return (
        <div className="space-y-6">
            <button onClick={onBack} className="flex items-center text-gray-500 hover:text-blue-600 transition-colors"><ArrowLeft className="h-4 w-4 mr-2"/> Voltar para Histórico</button>

            <div className="rounded-2xl bg-gradient-to-r from-blue-700 to-blue-500 p-6 text-white shadow-lg">
                <h1 className="text-2xl font-bold">Nova Campanha</h1>
                <p className="text-sm text-blue-100 mt-1">Monte sua campanha com mais espaço para edição e segmentação de contatos.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
                    <div>
                        <label className="text-sm font-semibold text-gray-700">Assunto</label>
                        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ex: Atualização cadastral" className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-gray-700">Responsável</label>
                        <input value={responsible} onChange={(e) => setResponsible(e.target.value)} className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-gray-700">Corpo da mensagem</label>
                        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} placeholder="Olá, segue nossa comunicação..." className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-gray-700 block mb-2">Método de Disparo</label>
                        <div className="flex gap-4 p-3 bg-gray-50 border border-gray-100 rounded-lg">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="sendMethod" value="email" checked={sendMethod === 'email'} onChange={() => setSendMethod('email')} className="text-blue-600 focus:ring-blue-500 w-4 h-4" />
                                <span className="text-sm font-medium text-gray-800">E-mail (Outlook)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="sendMethod" value="whatsapp" checked={sendMethod === 'whatsapp'} onChange={() => setSendMethod('whatsapp')} className="text-green-600 focus:ring-green-500 w-4 h-4" />
                                <span className="text-sm font-medium text-gray-800">Link de WhatsApp</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <button onClick={onBack} className="text-sm text-gray-500 hover:text-blue-600">Ir para Histórico</button>
                        <button onClick={handleSend} disabled={!subject || !responsible || selectedIds.size === 0} className={`px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-50 transition-colors ${sendMethod === 'whatsapp' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>Gerar {sendMethod === 'whatsapp' ? 'Links' : 'Campanha'}</button>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="font-semibold text-gray-900">Destinatários</h2>
                            <p className="text-xs text-gray-500">{selectedIds.size} contato(s) selecionado(s)</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar contato..." className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-56 focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <button onClick={toggleSelectAll} className="px-3 py-2 text-sm border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50">Selecionar todos</button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1"><FilterIcon className="h-3 w-3" /> Filtros disponíveis</span>
                        <button onClick={() => setShowFilters(!showFilters)} className="text-xs text-blue-600 font-medium hover:underline">{showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}</button>
                    </div>

                    {showFilters && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {filterKeys.map((key) => (
                                <FilterDropdown
                                    key={key}
                                    label={key.replace(/_/g, ' ')}
                                    options={[...getUniqueValues(contacts, key), '(Vazio)']}
                                    selectedValues={activeFilters[key]}
                                    onChange={(val: string[]) => setActiveFilters({ ...activeFilters, [key]: val })}
                                />
                            ))}
                        </div>
                    )}

                    <div className="border border-gray-200 rounded-xl overflow-hidden max-h-[520px] overflow-y-auto">
                        {filteredContacts.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">Nenhum contato encontrado.</div>
                        ) : (
                            filteredContacts.map((c: any) => {
                                const companyLabel = c.company_name || c.company_userName || c.company_userEmail || '';
                                return (
                                    <label key={c.id} className="flex items-start gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                                        <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => toggleSelection(c.id)} className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                        <div className="min-w-0">
                                            <div className="text-sm font-semibold text-gray-900 truncate">{cleanText(c.name) || 'Contato'}</div>
                                            <div className="text-xs text-gray-500 truncate">{safeRender(c.email)} {companyLabel ? `• ${cleanText(companyLabel)}` : ''}</div>
                                        </div>
                                    </label>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
