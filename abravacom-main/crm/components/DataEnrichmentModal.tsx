
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Loader2, Search, Check, AlertTriangle, ArrowRight, Sparkles, Globe, X, Database } from 'lucide-react';
import { cleanText } from '../utils/helpers';

export const DataEnrichmentModal = ({ isOpen, onClose, companies, onConfirm, fields = [] }) => {
    const [step, setStep] = useState<'select' | 'processing' | 'review'>('select');
    const [selectedField, setSelectedField] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectionState, setSelectionState] = useState<{[id:string]: boolean}>({});

    // Initialize selectedField with the first available field when modal opens
    useEffect(() => {
        if (isOpen && fields.length > 0 && !selectedField) {
            // Prefer empty fields usually used for enrichment if available, otherwise first one
            const preferred = fields.find((f: any) => ['website', 'instagram', 'linkedin', 'revenue'].includes(f.key));
            setSelectedField(preferred ? preferred.key : fields[0].key);
        }
    }, [isOpen, fields]);

    if (!isOpen) return null;

    const handleSearch = async () => {
        if (!selectedField) return;
        setLoading(true);
        setStep('processing');
        
        const fieldObj = fields.find((f: any) => f.key === selectedField);
        const fieldLabel = fieldObj ? fieldObj.label : selectedField;
        
        try {
            const apiKey = localStorage.getItem('crm_api_key') || process.env.API_KEY;
            if (!apiKey) {
                alert("Configure sua chave de API nas configurações antes de usar recursos de IA.");
                setLoading(false);
                setStep('select');
                return;
            }

            const ai = new GoogleGenAI({ apiKey });
            
            // Chunking requests
            const chunkSize = 5;
            let allResults: any[] = [];
            
            for (let i = 0; i < companies.length; i += chunkSize) {
                const chunk = companies.slice(i, i + chunkSize);
                
                const prompt = `
                Atue como um especialista em enriquecimento de dados corporativos e pesquisa na web.
                
                OBJETIVO: Encontrar a informação referente ao campo "${fieldLabel}" para as seguintes simulações (focadas no Rio de Janeiro/Brasil).
                
                CONTEXTO: O usuário quer preencher a coluna "${fieldLabel}" no CRM.
                
                EMPRESAS:
                ${chunk.map((c: any) => `- ID: "${c.id}", Nome: "${c.name}", Localização: "${c.location || 'Rio de Janeiro'}", Web: "${c.website || ''}"`).join('\n')}
                
                INSTRUÇÕES:
                1. Use o Google Search para encontrar a informação mais recente e precisa.
                2. Retorne APENAS um array JSON válido. SEM markdown, SEM explicações extras.
                3. O formato deve ser: [{"id": "id_da_simulação", "value": "valor_encontrado_curto_e_objetivo", "source": "url_da_fonte"}]
                4. Se não encontrar, retorne null no campo "value".
                5. Se o campo for numérico (ex: faturamento, funcionários), tente trazer o número ou faixa estimada.
                `;

                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                    config: {
                        tools: [{ googleSearch: {} }]
                    }
                });

                let text = response.text || '';
                text = text.replace(/```json/g, '').replace(/```/g, '').trim();
                
                try {
                    const jsonPart = JSON.parse(text);
                    if (Array.isArray(jsonPart)) {
                        allResults = [...allResults, ...jsonPart];
                    }
                } catch (e) {
                    console.error("Erro parsing JSON chunk", e, text);
                }
            }

            // Merge results
            const merged = companies.map((c: any) => {
                const found = allResults.find((r: any) => r.id === c.id);
                return {
                    id: c.id,
                    name: c.name,
                    currentValue: c[selectedField] || '',
                    suggestedValue: found?.value || '',
                    source: found?.source,
                    status: found?.value ? 'found' : 'not_found'
                };
            });

            setResults(merged);
            
            // Auto-select found items
            const initialSelection: any = {};
            merged.forEach((m: any) => {
                if (m.status === 'found' && m.suggestedValue !== m.currentValue) {
                    initialSelection[m.id] = true;
                }
            });
            setSelectionState(initialSelection);
            
            setStep('review');

        } catch (err) {
            console.error(err);
            alert("Erro ao buscar dados. Verifique sua chave de API e tente novamente.");
            setStep('select');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = () => {
        const updates: any = {};
        results.forEach(r => {
            if (selectionState[r.id]) {
                updates[r.id] = { [selectedField]: r.suggestedValue };
            }
        });
        onConfirm(updates);
        onClose();
    };

    const toggleSelection = (id: string) => {
        setSelectionState(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const updateSuggestion = (id: string, val: string) => {
        setResults(prev => prev.map(r => r.id === id ? { ...r, suggestedValue: val } : r));
        if (!selectionState[id]) toggleSelection(id);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-white rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Enriquecimento de Dados com IA</h3>
                            <p className="text-sm text-gray-500">
                                {step === 'select' && `Selecione o campo para preencher em ${companies.length} simulação(s)`}
                                {step === 'processing' && 'Pesquisando na internet...'}
                                {step === 'review' && 'Revise e confirme as alterações'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} disabled={loading}><X className="h-5 w-5 text-gray-400 hover:text-gray-600" /></button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {step === 'select' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Qual coluna do sistema você deseja preencher?</label>
                                <div className="relative">
                                    <Database className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <select 
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white appearance-none"
                                        value={selectedField}
                                        onChange={(e) => setSelectedField(e.target.value)}
                                    >
                                        <option value="" disabled>Selecione um campo...</option>
                                        {fields.map((f: any) => (
                                            <option key={f.key} value={f.key}>
                                                {f.label} ({f.key})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    A IA irá pesquisar no Google informações relacionadas ao nome da coluna selecionada (ex: se selecionar "Website", buscará o site; se "Faturamento", buscará a receita).
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                    <h4 className="font-bold text-gray-800 text-sm mb-1">Dica Pro</h4>
                                    <p className="text-xs text-gray-500">Para melhores resultados, certifique-se que os nomes das simulações estão corretos. Campos como "Instagram", "LinkedIn", "Telefone" e "Endereço" costumam ter alta taxa de sucesso.</p>
                                </div>
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 flex gap-3">
                                    <Globe className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                    <div className="text-sm text-blue-800">
                                        <p className="font-bold mb-1">Pesquisa em Tempo Real</p>
                                        <p className="text-xs">Utilizamos o Google Search Grounding para garantir dados atualizados.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'processing' && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-200 rounded-full blur-xl animate-pulse"></div>
                                <Loader2 className="h-16 w-16 text-blue-600 animate-spin relative z-10" />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-bold text-gray-900">Pesquisando dados...</h3>
                                <p className="text-gray-500">Buscando informações para o campo: <strong>{fields.find((f:any) => f.key === selectedField)?.label}</strong></p>
                            </div>
                        </div>
                    )}

                    {step === 'review' && (
                        <div className="space-y-4">
                            <div className="bg-blue-50 px-4 py-2 rounded-lg text-sm text-blue-800 border border-blue-100 flex items-center justify-between">
                                <span>Campo Alvo: <strong>{fields.find((f:any) => f.key === selectedField)?.label}</strong></span>
                            </div>
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 text-gray-500 font-semibold text-xs uppercase sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 rounded-tl-lg">Aplicar</th>
                                        <th className="px-4 py-3">Simulação</th>
                                        <th className="px-4 py-3">Valor Atual</th>
                                        <th className="px-4 py-3">Sugestão da IA</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {results.map((item) => (
                                        <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${selectionState[item.id] ? 'bg-blue-50/50' : ''}`}>
                                            <td className="px-4 py-3">
                                                <input 
                                                    type="checkbox" 
                                                    checked={!!selectionState[item.id]} 
                                                    onChange={() => toggleSelection(item.id)}
                                                    disabled={!item.suggestedValue}
                                                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-30" 
                                                />
                                            </td>
                                            <td className="px-4 py-3 font-medium text-gray-900">{cleanText(item.name)}</td>
                                            <td className="px-4 py-3 text-sm text-gray-500 max-w-[150px] truncate" title={item.currentValue}>{item.currentValue || '-'}</td>
                                            <td className="px-4 py-3">
                                                {item.suggestedValue ? (
                                                    <div className="space-y-1">
                                                        <input 
                                                            type="text" 
                                                            value={item.suggestedValue} 
                                                            onChange={(e) => updateSuggestion(item.id, e.target.value)}
                                                            className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:border-blue-500 focus:outline-none bg-white"
                                                        />
                                                        {item.source && (
                                                            <a href={item.source} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline flex items-center gap-1">
                                                                <Globe className="h-3 w-3"/> Fonte encontrada
                                                            </a>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-orange-500 flex items-center gap-1 bg-orange-50 px-2 py-1 rounded w-fit">
                                                        <AlertTriangle className="h-3 w-3"/> Não encontrado
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {results.filter(r => !r.suggestedValue).length > 0 && (
                                <p className="text-xs text-gray-400 italic text-center">Alguns dados não foram encontrados publicamente.</p>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end gap-3">
                    {step === 'select' && (
                        <button onClick={handleSearch} disabled={!selectedField} className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-bold shadow-md flex items-center gap-2 disabled:opacity-50">
                            <Search className="h-4 w-4" /> Buscar Dados
                        </button>
                    )}
                    {step === 'review' && (
                        <>
                            <button onClick={() => setStep('select')} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Voltar</button>
                            <button onClick={handleConfirm} disabled={Object.keys(selectionState).filter(k => selectionState[k]).length === 0} className="px-6 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg font-bold shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                <Check className="h-4 w-4" /> 
                                Confirmar {Object.keys(selectionState).filter(k => selectionState[k]).length} Atualização(ões)
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
