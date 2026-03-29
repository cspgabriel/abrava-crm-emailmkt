import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, Search, Plus, Filter, Folder, ChevronUp, ChevronDown, Tag, Star, Hotel, MapPin, Map, Map as MapIcon, Building2, Check, ArrowUpDown, MoreVertical, Eye, Mail as MailIcon, MessageCircle, Save } from 'lucide-react';
import { cleanText, getUniqueValues, cleanArrayValue } from '../utils/helpers';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, writeBatch, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import SaveViewModal from './SaveViewModal';
import { firestoreSetDefaultView } from '../utils/savedViews';

export const DirectoryView = ({ contacts, onSendCampaign, onViewContact }: any) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [showFilters, setShowFilters] = useState(false);
    const [openFilters, setOpenFilters] = useState<any>({ selected: true });
    const [activeFilters, setActiveFilters] = useState<{[key:string]: string[]}>({});
    const [expandedFilter, setExpandedFilter] = useState<string | null>(null);

    // saved views state
    const [savedViews, setSavedViews] = useState<any[]>([]);
    const [activeSavedViewId, setActiveSavedViewId] = useState<string|null>(null);
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [saveName, setSaveName] = useState('');
    const [saveDefault, setSaveDefault] = useState(false);

    const filterConfig = [{ label: 'Mailings / Setores', key: 'mailing', icon: Tag }, { label: 'Status Associação', key: 'company_status', icon: Star }, { label: 'Estrelas (Hotel)', key: 'company_stars', icon: Hotel }, { label: 'Bairro', key: 'company_neighborhood', icon: MapPin }, { label: 'Zona', key: 'company_zone', icon: Map }, { label: 'Região', key: 'company_region', icon: MapIcon }, { label: 'Simulação', key: 'company_name', icon: Building2 }];
    const toggleFilterValue = (key: string, value: string) => { const current = activeFilters[key] || []; if (current.includes(value)) { setActiveFilters({ ...activeFilters, [key]: current.filter(v => v !== value) }); } else { setActiveFilters({ ...activeFilters, [key]: [...current, value] }); } };
    const clearFilter = (key: string) => { const { [key]: _, ...rest } = activeFilters; setActiveFilters(rest); }
    const filteredContacts = useMemo(() => {
        return contacts.filter((c: any) => {
            const searchStr = searchTerm.toLowerCase();
            const matchesSearch = !searchStr || (c.name && cleanText(c.name).toLowerCase().includes(searchStr)) || (c.email && c.email.toLowerCase().includes(searchStr)) || (c.company_name && c.company_name.toLowerCase().includes(searchStr));
            if (!matchesSearch) return false;
            const hasActiveFilters = Object.keys(activeFilters).length > 0;
            if (!hasActiveFilters) return true;
            const matchesFilters = Object.keys(activeFilters).every(key => {
                const selectedOptions = activeFilters[key];
                if (!selectedOptions || selectedOptions.length === 0) return true;
                const val = c[key];
                const itemValues = cleanArrayValue(val).map(v => cleanText(v));
                return itemValues.some(v => selectedOptions.includes(v));
            });
            return matchesFilters;
        });
    }, [contacts, searchTerm, activeFilters]);
    const totalPages = Math.max(1, Math.ceil(filteredContacts.length / pageSize));
    const currentPageContacts = filteredContacts.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [totalPages]);

    // load saved views for contacts and watch for changes
    useEffect(() => {
        const ownerUid = localStorage.getItem('crm_auth_token') || 'anonymous';
        const q = query(collection(db, 'savedViews'), where('ownerUid', '==', ownerUid), where('entityType','==','contact'));
        const unsub = onSnapshot(q, snap => {
            setSavedViews(snap.docs.map(d=>({id:d.id, ...(d.data() as any)})));
        });
        return unsub;
    }, []);

    // apply default view once savedViews load
    useEffect(() => {
        if (activeSavedViewId) return;
        if (Object.keys(activeFilters).length === 0) {
            const def = savedViews.find(v => v.isDefault);
            if (def) {
                setActiveFilters(def.filters || {});
                setActiveSavedViewId(def.id);
            }
        }
    }, [savedViews]);
    const toggleSelection = (id: string) => { const newSet = new Set(selectedIds); if (newSet.has(id)) newSet.delete(id); else newSet.add(id); setSelectedIds(newSet); };
    const toggleAll = () => { if (selectedIds.size === filteredContacts.length) { setSelectedIds(new Set()); } else { const newSet = new Set<string>(); filteredContacts.forEach((c: any) => newSet.add(c.id)); setSelectedIds(newSet); } }
    const formatWhatsapp = (phone: string) => { if (!phone) return '#'; const cleaned = phone.replace(/\D/g, ''); return `https://wa.me/55${cleaned}`; };
    return (
        <div className="min-h-screen bg-gray-100 flex justify-center">
            <div className="w-full max-w-[400px] bg-white shadow-2xl min-h-screen flex flex-col relative border-x border-gray-200">
                <div className="p-4 flex items-center justify-between border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full border border-[#d4af37] text-[#d4af37] flex items-center justify-center text-xs font-bold">A</div>
                        <span className="text-lg font-light text-gray-700">CRM ABRACON</span>
                    </div>
                    <button className="text-[#0b1a3a]"><X className="h-6 w-6 font-light" /></button>
                </div>
                <div className="p-4 pb-2">
                    <div className="flex items-center gap-2 mb-3"><div className="h-4 w-4 border border-gray-400 rounded bg-white"></div><span className="text-xs text-gray-500 font-medium">Ocultar pastas vazias</span></div>
                    <div className="flex gap-2 mb-4"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><input type="text" placeholder="Busca global..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div><button className="bg-blue-600 text-white rounded-lg w-10 h-10 flex items-center justify-center hover:bg-blue-700"><Plus className="h-5 w-5"/></button><button onClick={() => setShowFilters(!showFilters)} className={`rounded-lg w-10 h-10 flex items-center justify-center border transition-colors ${showFilters ? 'bg-blue-100 border-blue-300 text-blue-600' : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'}`}><Filter className="h-4 w-4"/></button></div>
                    {/* saved views bar */}
                    {savedViews.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {savedViews.map(v => (
                          <button key={v.id} onClick={() => { setActiveFilters(v.filters || {}); setActiveSavedViewId(v.id); }} className={`px-2.5 py-1 text-xs rounded-full border flex items-center gap-1 transition-colors ${activeSavedViewId === v.id ? 'bg-blue-100 border-blue-400 text-blue-800 font-semibold' : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'}`}>
                            {v.isDefault && <span title="Padrão" className="text-yellow-500">★</span>}
                            {v.name}
                          </button>
                        ))}
                        {Object.keys(activeFilters).length > 0 && (
                          <button onClick={() => setSaveModalOpen(true)} className="px-2.5 py-1 text-xs rounded-full border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 flex items-center gap-1">
                            <Save className="h-3 w-3" /> Salvar visualização
                          </button>
                        )}
                      </div>
                    )}
                    <SaveViewModal open={saveModalOpen} onClose={() => setSaveModalOpen(false)} ownerUid={localStorage.getItem('crm_auth_token')||'anonymous'} entityType="contact" currentFilters={activeFilters} currentColumns={[]} />
                    {showFilters && (<div className="space-y-1.5 border-t border-gray-100 pt-3 animate-in slide-in-from-top-2"><h3 className="text-[10px] font-bold text-gray-400 uppercase mb-1.5">Filtros Avançados:</h3><div className="border border-blue-500 rounded-lg bg-white overflow-hidden"><button onClick={() => setOpenFilters({...openFilters, selected: !openFilters.selected})} className="w-full flex items-center justify-between px-3 py-1.5 text-blue-800 font-bold text-xs bg-blue-50"><div className="flex items-center gap-2"><Folder className="h-3.5 w-3.5 text-blue-600" />{selectedIds.size} selecionado(s)</div>{openFilters.selected ? <ChevronUp className="h-3 w-3"/> : <ChevronDown className="h-3 w-3" />}</button></div>{filterConfig.map((conf) => { const isOpen = expandedFilter === conf.key; const selectedCount = activeFilters[conf.key]?.length || 0; return (<div key={conf.key} className={`border rounded-lg bg-gray-50 overflow-hidden transition-all ${selectedCount > 0 ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}><button onClick={() => setExpandedFilter(isOpen ? null : conf.key)} className={`w-full flex items-center justify-between px-3 py-1.5 font-medium text-xs ${selectedCount > 0 ? 'text-blue-700' : 'text-gray-600'}`}><div className="flex items-center gap-2"><conf.icon className={`h-3.5 w-3.5 ${selectedCount > 0 ? 'text-blue-500' : 'text-gray-400'}`}/>{conf.label}{selectedCount > 0 && <span className="ml-1 bg-blue-200 text-blue-800 px-1.5 rounded-full text-[10px]">{selectedCount}</span>}</div>{isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}</button>{isOpen && (<div className="bg-white border-t border-gray-200 p-1.5 max-h-40 overflow-y-auto">{getUniqueValues(contacts, conf.key).length === 0 ? (<p className="text-[11px] text-gray-400 p-2 italic">Sem opções.</p>) : (getUniqueValues(contacts, conf.key).map(opt => (<label key={opt} className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer rounded"><input type="checkbox" checked={activeFilters[conf.key]?.includes(opt)} onChange={() => toggleFilterValue(conf.key, opt)} className="rounded border-gray-300 text-blue-600 h-3 w-3 focus:ring-0" /><span className="text-[11px] text-gray-700 truncate">{opt}</span></label>)))}{selectedCount > 0 && (<button onClick={() => clearFilter(conf.key)} className="text-[10px] text-red-500 hover:underline w-full text-left mt-1 pl-1">Limpar filtro</button>)}</div>)}</div>) })}</div>)}
                </div>
                <div className="px-4 py-2 border-y border-gray-100 bg-gray-50 text-xs text-gray-500 flex justify-between items-center"><span>Exibindo <strong>{filteredContacts.length}</strong> contatos — Página <strong>{currentPage}</strong> / {totalPages}</span></div>
                <div className="flex-1 overflow-y-auto bg-white p-2 space-y-1">
                    {filteredContacts.length === 0 ? (<div className="h-40 flex items-center justify-center text-gray-400 italic text-sm">Nenhum contato encontrado.</div>) : currentPageContacts.map((contact: any) => (<div key={contact.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 transition-all group"><div onClick={() => toggleSelection(contact.id)} className="cursor-pointer">{selectedIds.has(contact.id) ? <div className="w-5 h-5 bg-blue-600 rounded border border-blue-600 flex items-center justify-center text-white"><Check className="h-3 w-3"/></div> : <div className="w-5 h-5 border-2 border-gray-300 rounded group-hover:border-blue-400"></div>}</div><div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">{contact.name ? contact.name.substring(0,1).toUpperCase() : '?'}</div><div className="flex-1 min-w-0"><h4 className="text-sm font-semibold text-gray-900 truncate">{cleanText(contact.name)}</h4><p className="text-xs text-gray-500 truncate">{contact.company_name || contact.email}</p><div className="flex flex-wrap gap-1 mt-1">{contact.mailing && cleanArrayValue(contact.mailing).map((m: string, idx: number) => <span key={idx} className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-100 uppercase">{m}</span>)}{contact.company_neighborhood && <span className="text-[10px] bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded border border-orange-100 uppercase">{cleanText(contact.company_neighborhood)}</span>}</div></div><div className="flex items-center gap-1"><button onClick={() => onViewContact && onViewContact(contact)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Ver Ficha"><Eye className="h-4 w-4" /></button>{contact.email && (<a href={`mailto:${contact.email}`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Enviar Email"><MailIcon className="h-4 w-4" /></a>)}{contact.phone && (<a href={formatWhatsapp(contact.phone)} target="_blank" rel="noreferrer" className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors" title="Whatsapp"><MessageCircle className="h-4 w-4" /></a>)}</div></div>))}
                </div>
                <div className="p-3 border-t border-gray-200 bg-white sticky bottom-0 z-10">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-4">
                            <button onClick={toggleAll} className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedIds.size === filteredContacts.length && filteredContacts.length > 0 ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-400'}`}>{selectedIds.size === filteredContacts.length && filteredContacts.length > 0 && <Check className="h-3 w-3"/>}</div>
                                Selecionar Todos ({selectedIds.size})
                            </button>
                            <div className="text-xs text-gray-500">/ Página: {currentPageContacts.length}</div>
                        </div>
                        <div className="flex items-center gap-2">
                            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} className="text-xs border rounded px-2 py-1">
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-2 py-1 text-xs bg-gray-50 border rounded disabled:opacity-50">Anterior</button>
                                <div className="text-xs px-2">{currentPage} / {totalPages}</div>
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-2 py-1 text-xs bg-gray-50 border rounded disabled:opacity-50">Próxima</button>
                            </div>
                            <div className="flex gap-1">
                                <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><ArrowUpDown className="h-4 w-4"/></button>
                                <button className="p-1.5 text-gray-400 hover:bg-gray-50 rounded"><MoreVertical className="h-4 w-4"/></button>
                            </div>
                        </div>
                    </div>
                    {selectedIds.size > 0 && (<button onClick={() => onSendCampaign(selectedIds)} className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 animate-in slide-in-from-bottom-2 flex items-center justify-center gap-2"><MailIcon className="h-4 w-4" /> Enviar Campanha ({selectedIds.size})</button>)}
                </div>
            </div>
        </div>
    )
}
