import React, { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { cleanText } from '../utils/helpers';

export const DataEntryModal = ({ isOpen, onClose, onSave, fields, title, initialData, companiesList, allTags = [] }: any) => {
    const [data, setData] = useState<any>({});
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [showTagSuggestions, setShowTagSuggestions] = useState(false);

    const allFields = useMemo(() => {
        return fields;
    }, [fields]);

    useEffect(() => {
        if (isOpen) { 
            const initial = { ...(initialData || {}) };
            if (initial.tags && typeof initial.tags === 'string') {
                initial.tags = initial.tags.split(';').map((t: string) => t.trim()).filter(Boolean);
            }
            setData(initial); 
            setSuggestions([]); 
            setShowSuggestions(false);
            setTagInput('');
            setShowTagSuggestions(false);
        } else { 
            setData({}); 
        }
    }, [isOpen, initialData]);

    const handleInputChange = (key: string, value: string) => {
        setData({ ...data, [key]: value });
        if (key === 'company_name' && companiesList && companiesList.length > 0) {
            if (value.length > 1) {
                const search = value.toLowerCase();
                const filtered = companiesList.filter((c: any) => {
                    const displayName = cleanText(c.userName ?? c.name ?? c.userEmail ?? c.id).toLowerCase();
                    const email = cleanText(c.userEmail ?? '').toLowerCase();
                    return displayName.includes(search) || email.includes(search);
                }).slice(0, 5);
                setSuggestions(filtered);
                setShowSuggestions(true);
            } else { setShowSuggestions(false); }
        } else { setShowSuggestions(false); }
    };

    const selectCompany = (company: any) => { 
        const displayName = cleanText(company.userName ?? company.name ?? company.userEmail ?? company.id);
        setData({ ...data, company_name: displayName, companyId: company.id }); 
        setShowSuggestions(false); 
    };
    
    const getSafeInputValue = (val: any) => {
        if (val === null || val === undefined) return '';
        if (typeof val === 'object' && !Array.isArray(val)) { if (val.seconds) return new Date(val.seconds * 1000).toLocaleString('pt-BR'); return JSON.stringify(val); }
        return String(val);
    };

    const handleAddTag = (tag: string) => {
        const currentTags = Array.isArray(data.tags) ? data.tags : [];
        if (!currentTags.includes(tag)) {
            setData({ ...data, tags: [...currentTags, tag] });
        }
        setTagInput('');
        setShowTagSuggestions(false);
    };

    const handleRemoveTag = (tag: string) => {
        const currentTags = Array.isArray(data.tags) ? data.tags : [];
        setData({ ...data, tags: currentTags.filter((t: string) => t !== tag) });
    };

    const filteredTags = useMemo(() => {
        if (!tagInput) return [];
        return allTags.filter((t: string) => t.toLowerCase().includes(tagInput.toLowerCase()) && !(data.tags || []).includes(t));
    }, [tagInput, allTags, data.tags]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center"><h3 className="text-lg font-bold text-gray-900">{title}</h3><button onClick={onClose}><X className="h-5 w-5 text-gray-400" /></button></div>
                <div className="p-6 overflow-y-auto flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {allFields.map((f: any) => (
                            <div key={f.key} className={`relative ${f.key === 'id' || f.key === 'name' || f.key === 'mailing' || f.key === 'tags' ? 'md:col-span-2' : ''}`}>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{f.label} {f.required && <span className="text-red-500">*</span>}</label>
                                
                                {f.key === 'tags' ? (
                                    <div className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[42px] flex flex-wrap gap-2 focus-within:ring-2 focus-within:ring-blue-500 bg-white">
                                        {(Array.isArray(data.tags) ? data.tags : []).map((tag: string) => (
                                            <span key={tag} className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded flex items-center gap-1">
                                                {tag}
                                                <button onClick={() => handleRemoveTag(tag)} className="hover:text-blue-900"><X className="h-3 w-3" /></button>
                                            </span>
                                        ))}
                                        <div className="relative flex-1 min-w-[120px]">
                                            <input 
                                                type="text" 
                                                className="w-full outline-none text-sm bg-transparent" 
                                                placeholder="Adicionar tag..." 
                                                value={tagInput}
                                                onChange={(e) => { setTagInput(e.target.value); setShowTagSuggestions(true); }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && tagInput) {
                                                        e.preventDefault();
                                                        handleAddTag(tagInput);
                                                    }
                                                }}
                                            />
                                            {showTagSuggestions && tagInput && filteredTags.length > 0 && (
                                                <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-20 max-h-32 overflow-y-auto">
                                                    {filteredTags.map((tag: string) => (
                                                        <div key={tag} onClick={() => handleAddTag(tag)} className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700">
                                                            {tag}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={getSafeInputValue(data[f.key])} placeholder={f.description || ''} onChange={(e) => handleInputChange(f.key, e.target.value)} autoComplete="off" />
                                        {f.key === 'company_name' && showSuggestions && suggestions.length > 0 && (
                                            <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto">
                                                {suggestions.map((s: any) => {
                                                    const displayName = cleanText(s.userName ?? s.name ?? s.userEmail ?? s.id);
                                                    return (
                                                        <div key={s.id} onClick={() => selectCompany(s)} className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-50 last:border-0">
                                                            <div className="font-bold text-gray-800">{displayName}</div>
                                                            <div className="text-xs text-gray-500 flex justify-between"><span>ID: {s.id}</span><span>{s.userEmail || s.type || '-'}</span></div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium">Cancelar</button>
                    <button onClick={() => onSave(data)} disabled={fields.some((f: any) => f.required && !data[f.key])} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-medium disabled:opacity-50">Salvar</button>
                </div>
            </div>
        </div>
    );
};
