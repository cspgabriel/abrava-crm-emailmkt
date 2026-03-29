
import React, { useState, useEffect } from 'react';
import { Settings, X, Search, TableProperties, ListFilter, LayoutTemplate, PenTool, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';

export const SystemSettingsModal = ({ isOpen, onClose, allFields, currentSettings, onSave, mode }: any) => {
    // Initialize with default values to prevent undefined errors
    const [localSettings, setLocalSettings] = useState<any>({ visible: [], filters: [], details: [], edit: [] });
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'visibility' | 'ordering'>('visibility');

    useEffect(() => {
        if(isOpen) {
            setLocalSettings({
                visible: currentSettings.visible || [],
                filters: currentSettings.filters || [],
                details: currentSettings.details || [],
                edit: currentSettings.edit || allFields.map((f:any) => f.key) 
            });
            setSearch('');
            setActiveTab('visibility');
        }
    }, [isOpen, currentSettings, allFields]);

    if (!isOpen) return null;

    const toggleSetting = (type: 'visible' | 'filters' | 'details' | 'edit', key: string) => {
        const list = localSettings[type] || [];
        if (list.includes(key)) {
            setLocalSettings({ ...localSettings, [type]: list.filter((k: string) => k !== key) });
        } else {
            setLocalSettings({ ...localSettings, [type]: [...list, key] });
        }
    };

    const moveColumn = (index: number, direction: 'up' | 'down') => {
        const newOrder = [...localSettings.visible];
        if (direction === 'up') {
            if (index === 0) return;
            [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
        } else {
            if (index === newOrder.length - 1) return;
            [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
        }
        setLocalSettings({ ...localSettings, visible: newOrder });
    };

    const filteredFields = allFields.filter((f: any) => 
        f.label.toLowerCase().includes(search.toLowerCase()) || 
        f.key.toLowerCase().includes(search.toLowerCase())
    );

    const visibleFieldsOrdered = localSettings.visible.map((key: string) => 
        allFields.find((f: any) => f.key === key)
    ).filter(Boolean);

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Settings className="h-5 w-5 text-blue-600"/> Configuração do Sistema
                        </h3>
                        <p className="text-sm text-gray-500">Gerenciar campos para {mode === 'companies' ? 'Simulações' : 'Contatos'}</p>
                    </div>
                    <button onClick={onClose}><X className="h-5 w-5 text-gray-400 hover:text-gray-600" /></button>
                </div>

                <div className="flex border-b border-gray-200">
                    <button 
                        onClick={() => setActiveTab('visibility')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'visibility' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
                    >
                        Seleção de Campos
                    </button>
                    <button 
                        onClick={() => setActiveTab('ordering')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'ordering' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
                    >
                        Ordenar Colunas (Tabela)
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-0 bg-white">
                    {activeTab === 'visibility' && (
                        <div className="flex flex-col h-full">
                            <div className="p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Buscar campo..." 
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 sticky top-0 z-10 text-xs uppercase text-gray-500 font-semibold shadow-sm">
                                    <tr>
                                        <th className="px-6 py-3 border-b border-gray-200">Nome do Campo</th>
                                        <th className="px-6 py-3 border-b border-gray-200 text-center w-24 bg-blue-50/50">
                                            <div className="flex flex-col items-center gap-1 text-blue-700" title="Exibir na Tabela Principal">
                                                <TableProperties className="h-4 w-4"/> Tabela
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 border-b border-gray-200 text-center w-24">
                                            <div className="flex flex-col items-center gap-1" title="Usar como Filtro">
                                                <ListFilter className="h-4 w-4"/> Filtros
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 border-b border-gray-200 text-center w-24">
                                            <div className="flex flex-col items-center gap-1" title="Exibir na Ficha de Detalhes">
                                                <LayoutTemplate className="h-4 w-4"/> Ficha
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 border-b border-gray-200 text-center w-24">
                                            <div className="flex flex-col items-center gap-1" title="Exibir no Formulário de Edição/Criação">
                                                <PenTool className="h-4 w-4"/> Edição
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {filteredFields.map((field: any) => (
                                        <tr key={field.key} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-3 font-medium text-gray-700">
                                                {field.label}
                                                {field.required && <span className="text-red-500 ml-1 text-xs">*Obrigatório</span>}
                                                <p className="text-[10px] text-gray-400 font-mono">{field.key}</p>
                                            </td>
                                            <td className="px-6 py-3 text-center bg-blue-50/20">
                                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" checked={localSettings.visible.includes(field.key)} onChange={() => toggleSetting('visible', field.key)} />
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer" checked={localSettings.filters.includes(field.key)} onChange={() => toggleSetting('filters', field.key)} />
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer" checked={localSettings.details.includes(field.key)} onChange={() => toggleSetting('details', field.key)} />
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <input 
                                                    type="checkbox" 
                                                    className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" 
                                                    checked={field.required ? true : localSettings.edit.includes(field.key)} 
                                                    disabled={field.required}
                                                    onChange={() => toggleSetting('edit', field.key)} 
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'ordering' && (
                        <div className="p-6">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-center gap-3">
                                <ArrowUp className="h-5 w-5 text-blue-600" />
                                <div className="text-sm text-blue-800">Use os botões para definir a ordem das colunas na tabela principal. O primeiro item da lista será a primeira coluna à esquerda.</div>
                            </div>
                            
                            <div className="space-y-2 max-w-3xl mx-auto">
                                {visibleFieldsOrdered.map((field: any, index: number) => (
                                    <div key={field.key} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-blue-300 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-gray-100 rounded text-gray-400 cursor-grab active:cursor-grabbing">
                                                <GripVertical className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800">{field.label}</p>
                                                <p className="text-xs text-gray-400 font-mono">{field.key}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button 
                                                onClick={() => moveColumn(index, 'up')}
                                                disabled={index === 0}
                                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent"
                                                title="Mover para cima"
                                            >
                                                <ArrowUp className="h-4 w-4" />
                                            </button>
                                            <button 
                                                onClick={() => moveColumn(index, 'down')}
                                                disabled={index === visibleFieldsOrdered.length - 1}
                                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent"
                                                title="Mover para baixo"
                                            >
                                                <ArrowDown className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {visibleFieldsOrdered.length === 0 && (
                                    <div className="text-center p-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                                        Nenhuma coluna selecionada para exibição. Volte para a aba "Seleção de Campos" e marque a opção "Tabela".
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium">Cancelar</button>
                    <button onClick={() => onSave(localSettings)} className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all">Salvar Configurações</button>
                </div>
            </div>
        </div>
    )
};
