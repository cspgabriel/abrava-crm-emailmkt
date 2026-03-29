
import React, { useState, useEffect, useMemo } from 'react';
import { History, Settings, Key, Cpu, Search, Filter, CheckCircle, AlertTriangle, CloudLightning, ShieldCheck, Eye, EyeOff, Save, Trash2, Star, Edit2, Building2 as Building2Icon, Users as UsersIcon, Bookmark } from 'lucide-react';
import { cleanText, safeRender } from '../utils/helpers';

export const SettingsView = ({ companies, contacts, savedViews = [], onDeleteView, onSetDefaultView, onRenameView }: any) => {
    const [activeTab, setActiveTab] = useState<'logs' | 'views' | 'api'>('logs');
    const [editingViewId, setEditingViewId] = useState<string | null>(null);
    const [editingViewName, setEditingViewName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSource, setFilterSource] = useState('all');
    
    // API Key States
    const [customKey, setCustomKey] = useState('');
    const [savedKey, setSavedKey] = useState('');
    const [showKey, setShowKey] = useState(false);

    useEffect(() => {
        // Load key from storage on mount
        const stored = localStorage.getItem('crm_api_key');
        if (stored) {
            setSavedKey(stored);
            setCustomKey(stored);
        }
    }, []);

    const handleSaveKey = () => {
        if (!customKey.trim()) return;
        localStorage.setItem('crm_api_key', customKey.trim());
        setSavedKey(customKey.trim());
        alert("Chave API salva com sucesso! O sistema usará esta chave para todas as operações de IA.");
    };

    const handleRemoveKey = () => {
        if(confirm("Tem certeza que deseja remover sua chave API? As funções de IA pararão de funcionar se não houver uma chave de sistema configurada.")) {
            localStorage.removeItem('crm_api_key');
            setSavedKey('');
            setCustomKey('');
        }
    };

    const logs = useMemo(() => {
        const allLogs: any[] = [];

        const processEntity = (entity: any, type: string) => {
            // Process explicit history array
            if (entity.history && Array.isArray(entity.history)) {
                entity.history.forEach((h: any) => {
                    allLogs.push({
                        id: entity.id + '_' + h.date, 
                        entityName: entity.name || 'Sem Nome',
                        entityType: type,
                        date: h.date,
                        source: h.source || 'Sistema',
                        description: h.description || h.type,
                        details: h.type
                    });
                });
            }
            
            // Process creation event (fallback if not in history)
            if (entity.createdAt) {
                const createdDate = typeof entity.createdAt === 'object' ? new Date(entity.createdAt.seconds * 1000).toISOString() : entity.createdAt;
                // Only add if we don't have a specific history entry for creation at the exact same time
                const hasCreationLog = allLogs.some(l => l.date === createdDate && l.id.startsWith(entity.id));
                
                if (!hasCreationLog) {
                    allLogs.push({
                        id: entity.id + '_created',
                        entityName: entity.name || 'Sem Nome',
                        entityType: type,
                        date: createdDate,
                        source: entity.source || 'Importação',
                        description: 'Registro criado',
                        details: 'creation'
                    });
                }
            }
        };

        companies.forEach((c: any) => processEntity(c, 'Simulação'));
        contacts.forEach((c: any) => processEntity(c, 'Contato'));

        return allLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [companies, contacts]);

    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.entityName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              log.description.toLowerCase().includes(searchTerm.toLowerCase());
        
        let matchesSource = true;
        if (filterSource !== 'all') {
            const src = (log.source || '').toLowerCase();
            const filter = filterSource.toLowerCase();
            if (filter === 'ai') matchesSource = src.includes('ai') || src.includes('ia');
            else if (filter === 'user') matchesSource = src.includes('user') || src.includes('manual');
            else if (filter === 'import') matchesSource = src.includes('import');
            else matchesSource = src.includes(filter);
        }
        
        return matchesSearch && matchesSource;
    });

    const getSourceLabel = (source: string) => {
        const s = (source || '').toLowerCase();
        if (s.includes('ai') || s.includes('ia')) return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200"><Cpu className="h-3 w-3"/> Inteligência Artificial</span>;
        if (s.includes('user') || s.includes('manual')) return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-bold border border-gray-200"><Settings className="h-3 w-3"/> Usuário (Manual)</span>;
        if (s.includes('import')) return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200"><CloudLightning className="h-3 w-3"/> Importação</span>;
        return <span className="text-xs text-gray-500">{source}</span>;
    };

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Configurações & Histórico</h1>
                    <p className="text-sm text-gray-500">Monitore as atividades e gerencie a conexão com a IA.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[600px] flex flex-col">
                <div className="flex border-b border-gray-200">
                    <button 
                        onClick={() => setActiveTab('logs')}
                        className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'logs' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
                    >
                        <History className="h-4 w-4"/> Histórico de Alterações
                    </button>
                    <button
                        onClick={() => setActiveTab('views')}
                        className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'views' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
                    >
                        <Bookmark className="h-4 w-4"/> Visualizações Salvas
                    </button>
                    <button 
                        onClick={() => setActiveTab('api')}
                        className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'api' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
                    >
                        <Key className="h-4 w-4"/> Configuração de API
                    </button>
                </div>
                {activeTab === 'logs' && (
                    <div className="p-6">
                        <div className="flex gap-4 mb-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Buscar no histórico..." 
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="relative">
                                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <select 
                                        className="pl-10 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white min-w-[200px]"
                                        value={filterSource}
                                        onChange={e => setFilterSource(e.target.value)}
                                    >
                                        <option value="all">Todas as Origens</option>
                                        <option value="user">Manual (Usuário)</option>
                                        <option value="ai">Inteligência Artificial</option>
                                        <option value="import">Importação</option>
                                    </select>
                                </div>
                            </div>

                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 text-gray-500 font-semibold text-xs uppercase sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 rounded-tl-lg">Data / Hora</th>
                                        <th className="px-4 py-3">Entidade</th>
                                        <th className="px-4 py-3">Tipo</th>
                                        <th className="px-4 py-3">Descrição da Alteração</th>
                                        <th className="px-4 py-3 rounded-tr-lg">Origem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {filteredLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 text-gray-500 font-mono text-xs whitespace-nowrap">
                                                {new Date(log.date).toLocaleString('pt-BR')}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-gray-900 truncate max-w-[200px]" title={cleanText(log.entityName)}>
                                                {cleanText(log.entityName)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${log.entityType === 'Simulação' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'}`}>
                                                    {log.entityType}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">
                                                {(log.source === 'AI' || log.source === 'IA') && log.description.includes('→') ? (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-xs text-gray-500">{log.description.split(':')[0]}:</span>
                                                        <div className="flex flex-wrap gap-2">
                                                            {log.description.split(':')[1]?.split(';').map((change: string, i: number) => {
                                                                const parts = change.split('→');
                                                                if (parts.length < 2) return <span key={i}>{change}</span>;
                                                                return (
                                                                    <span key={i} className="inline-flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded border border-yellow-200 text-xs">
                                                                        <span className="font-semibold text-gray-600">{parts[0].trim()}:</span>
                                                                        <span className="font-mono font-bold text-gray-900 bg-white px-1 rounded">{parts[1].trim()}</span>
                                                                    </span>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    log.description
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {getSourceLabel(log.source)}
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredLogs.length === 0 && (
                                        <tr><td colSpan={5} className="p-12 text-center text-gray-400 italic">Nenhum registro encontrado com os filtros atuais.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'api' && (
                        <div className="max-w-2xl mx-auto space-y-8 py-8 animate-in slide-in-from-right-4">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg ring-4 ring-blue-50">
                                    <ShieldCheck className="h-8 w-8 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Chave de API do Google Gemini</h2>
                                <p className="text-gray-500 mt-2">Insira sua chave de API para habilitar recursos de inteligência artificial.</p>
                            </div>

                            <div className={`p-8 rounded-2xl border transition-all shadow-sm ${savedKey ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${savedKey ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                                <Key className="h-5 w-5" />
                                            </div>
                                        </div>
                                        {savedKey && (
                                            <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                                                <CheckCircle className="h-3 w-3"/> Ativa
                                            </span>
                                        )}
                                    </div>

                                            <div className="relative">
                                              <input 
                                                type={showKey ? "text" : "password"}
                                                className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                                                placeholder="Cole sua chave API aqui (começa com AIza...)"
                                                value={customKey}
                                                onChange={(e) => setCustomKey(e.target.value)}
                                              />
                                        <button 
                                            onClick={() => setShowKey(!showKey)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showKey ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                                        </button>
                                            </div>


                                    <div className="flex justify-end gap-2 pt-2">
                                        {savedKey && (
                                            <button 
                                                onClick={handleRemoveKey}
                                                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium flex items-center gap-2"
                                            >
                                                <Trash2 className="h-4 w-4"/> Remover
                                            </button>
                                        )}
                                        <button 
                                            onClick={handleSaveKey}
                                            disabled={!customKey}
                                            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                                        >
                                            <Save className="h-4 w-4"/> Salvar Chave
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-sm text-blue-800 space-y-3">
                                <h4 className="font-bold flex items-center gap-2 text-lg"><AlertTriangle className="h-5 w-5"/> Privacidade e Cobrança</h4>
                                <p>
                                    Sua chave de API é salva apenas no <strong>LocalStorage</strong> do seu navegador. Ela não é enviada para nenhum servidor intermediário, apenas diretamente para os serviços do Google Gemini.
                                </p>
                                <p>
                                    Para obter uma chave, visite o <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline font-bold hover:text-blue-900">Google AI Studio</a>.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'views' && (
                      <div className="space-y-8 animate-in slide-in-from-right-4">
                        {savedViews.length === 0 ? (
                          <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-4">
                            <Bookmark className="h-14 w-14 text-gray-200" />
                            <p className="text-base font-semibold text-gray-500">Nenhuma visualização salva ainda</p>
                            <p className="text-sm text-center max-w-sm text-gray-400">Vá para a aba <strong>Contatos</strong> ou <strong>Simulações</strong>, aplique filtros e clique em <strong>&ldquo;Salvar como visualização&rdquo;</strong> para criar suas primeiras views personalizadas.</p>
                          </div>
                        ) : (
                          ['contact','company'].map(type => {
                            const typeViews = savedViews.filter((v: any) => v.entityType === type);
                            return (
                              <div key={type}>
                                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                                  {type==='contact' ? <><UsersIcon className="h-4 w-4 text-indigo-500" /> Contatos</> : <><Building2Icon className="h-4 w-4 text-blue-500" /> Simulações</>}
                                  <span className="text-xs font-normal text-gray-400 normal-case">({typeViews.length} visualiza{typeViews.length===1?'ção':'ções'})</span>
                                </h3>
                                {typeViews.length===0 ? (
                                  <p className="text-sm text-gray-400 italic py-6 text-center border border-dashed border-gray-200 rounded-xl bg-gray-50">
                                    Nenhuma visualização salva para {type==='contact'?'Contatos':'Simulações'}.
                                  </p>
                                ) : (
                                  <div className="space-y-2">
                                    {typeViews.map((v: any) => (
                                      <div key={v.id} className={`flex items-center gap-3 p-3 border rounded-xl bg-white transition-all ${v.isDefault?'border-blue-200 bg-blue-50/40':'border-gray-200 hover:border-gray-300'}`}>
                                        {editingViewId===v.id ? (
                                          <input
                                            className="flex-1 px-3 py-1.5 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                            value={editingViewName}
                                            onChange={e=>setEditingViewName(e.target.value)}
                                            autoFocus
                                            onKeyDown={e=>{if(e.key==='Enter'){onRenameView?.(v.id,editingViewName);setEditingViewId(null);}else if(e.key==='Escape')setEditingViewId(null);}}
                                            onBlur={()=>{if(editingViewName.trim())onRenameView?.(v.id,editingViewName);setEditingViewId(null);}}
                                          />
                                        ) : (
                                          <span className="flex-1 text-sm font-medium text-gray-800 flex items-center gap-2">
                                            {v.name}
                                            {v.isDefault && (
                                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-yellow-100 text-yellow-700 border border-yellow-200 px-1.5 py-0.5 rounded-full">
                                                <Star className="h-2.5 w-2.5" /> Padrão
                                              </span>
                                            )}
                                            <span className="text-[10px] text-gray-400 font-normal">{Object.keys(v.filters||{}).length} filtro(s)</span>
                                          </span>
                                        )}
                                        <div className="flex items-center gap-1 shrink-0">
                                          <button onClick={()=>onSetDefaultView?.(v.id,type)} title={v.isDefault?'Remover como padrão':'Definir como padrão'} className={`p-1.5 rounded-lg transition-colors ${v.isDefault?'text-yellow-500 hover:bg-yellow-50':'text-gray-300 hover:text-yellow-500 hover:bg-yellow-50'}`}>
                                            <Star className={`h-4 w-4 ${v.isDefault?'fill-yellow-400 text-yellow-500':''}`} />
                                          </button>
                                          <button onClick={()=>{setEditingViewId(v.id);setEditingViewName(v.name);}} title="Renomear" className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                            <Edit2 className="h-4 w-4" />
                                          </button>
                                          <button onClick={()=>onDeleteView?.(v.id)} title="Excluir" className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 className="h-4 w-4" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                </div>
        </div>
    );
};
