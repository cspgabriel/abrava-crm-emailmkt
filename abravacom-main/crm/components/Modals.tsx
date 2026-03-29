import React, { useState } from 'react';
import { Loader2, Send, Merge, Copy, ArrowRight } from 'lucide-react';

export const BulkCopyModal = ({ isOpen, onClose, selectedCount, onConfirm, fields }: any) => {
    const [sourceField, setSourceField] = useState('');
    const [targetField, setTargetField] = useState('');
    const [overwrite, setOverwrite] = useState(false);

    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                        <Copy className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Copiar/Duplicar Dados</h3>
                        <p className="text-sm text-gray-500">{selectedCount} registros selecionados</p>
                    </div>
                </div>

                <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Copiar DE (Origem)</label>
                        <select 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            value={sourceField}
                            onChange={(e) => setSourceField(e.target.value)}
                        >
                            <option value="">Selecione a coluna de origem...</option>
                            {fields.map((f: any) => (
                                <option key={f.key} value={f.key}>{f.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-center">
                        <ArrowRight className="h-5 w-5 text-gray-400" />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Copiar PARA (Destino)</label>
                        <div className="relative">
                            <input 
                                list="targetFields"
                                type="text"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Selecione ou digite nova coluna..."
                                value={targetField}
                                onChange={(e) => setTargetField(e.target.value)}
                            />
                            <datalist id="targetFields">
                                {fields.map((f: any) => (
                                    <option key={f.key} value={f.key}>{f.label}</option>
                                ))}
                            </datalist>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">Se digitar um nome novo, uma nova coluna será criada.</p>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input 
                            type="checkbox" 
                            id="overwrite" 
                            checked={overwrite} 
                            onChange={(e) => setOverwrite(e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                        />
                        <label htmlFor="overwrite" className="text-sm text-gray-700 cursor-pointer">Sobrescrever dados existentes no destino?</label>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium text-sm">Cancelar</button>
                    <button 
                        disabled={!sourceField || !targetField} 
                        onClick={() => onConfirm(sourceField, targetField, overwrite)} 
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 text-sm flex items-center gap-2"
                    >
                        Executar Cópia
                    </button>
                </div>
            </div>
        </div>
    )
}

export const BulkTagModal = ({ isOpen, onClose, selectedCount, onConfirm }: any) => {
    const [tags, setTags] = useState('');
    if(!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Adicionar Tags em Massa</h3>
                <p className="text-sm text-gray-500 mb-4">Adicionando tags para <strong>{selectedCount}</strong> registros selecionados.</p>
                <input 
                    type="text" 
                    autoFocus
                    placeholder="Ex: VIP; Palestrante; 2024" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                />
                <p className="text-xs text-gray-400 mb-6">Separe múltiplas tags com ponto e vírgula (;).</p>
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-3 py-2 text-gray-600 text-sm hover:bg-gray-50 rounded-lg">Cancelar</button>
                    <button disabled={!tags} onClick={() => onConfirm(tags)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-blue-700">Adicionar Tags</button>
                </div>
            </div>
        </div>
    )
}

export const CampaignModal = ({ isOpen, onClose, selectedCount, onConfirm, isSubmitting }: any) => {
    const [subject, setSubject] = useState('');
    const [responsible, setResponsible] = useState('');
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                <div className="mb-6"><h3 className="text-lg font-bold text-gray-900 mb-1">Nova Campanha de Email</h3><p className="text-sm text-gray-500">Enviando para <strong>{selectedCount}</strong> contato(s).</p></div>
                <div className="space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Assunto do Email</label><input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex: Apresentação Institucional" value={subject} disabled={isSubmitting} onChange={(e) => setSubject(e.target.value)} /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Responsável pelo Envio</label><input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Seu nome" value={responsible} disabled={isSubmitting} onChange={(e) => setResponsible(e.target.value)} /></div>
                </div>
                <div className="mt-8 flex justify-end gap-3">
                    <button onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium disabled:opacity-50">Cancelar</button>
                    <button disabled={!subject || !responsible || isSubmitting} onClick={() => onConfirm(subject, responsible)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center gap-2">{isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Registrando...</> : <><Send className="h-4 w-4" /> Abrir Outlook e Registrar</>}</button>
                </div>
            </div>
        </div>
    )
}

export const NewSegmentModal = ({ isOpen, onClose, onConfirm }: any) => {
    const [name, setName] = useState('');
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Novo Segmento</h3>
                <input autoFocus type="text" placeholder="Nome do segmento (ex: VIPs)" className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-6" value={name} onChange={(e) => setName(e.target.value)} />
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-3 py-2 text-gray-600 text-sm">Cancelar</button>
                    <button disabled={!name} onClick={() => onConfirm(name)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold disabled:opacity-50">Criar</button>
                </div>
            </div>
        </div>
    )
}

export const BatchSendModal = ({ isOpen, onClose, batches }: any) => {
    if (!isOpen || !batches || batches.length === 0) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Envio em Lotes</h3>
                    <p className="text-sm text-gray-500">Devido ao limite do Outlook, o envio foi dividido em {batches.length} lotes.</p>
                </div>
                <div className="space-y-4">
                    {batches.map((batch: any, index: number) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg flex items-center justify-between hover:border-blue-300 transition-colors">
                            <div>
                                <h4 className="font-bold text-gray-800">Lote {index + 1}</h4>
                                <p className="text-xs text-gray-500">{batch.count} destinatários</p>
                            </div>
                            <a 
                                href={batch.link}
                                target="_blank"
                                rel="noreferrer"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2"
                            >
                                <Send className="h-4 w-4" /> Enviar
                            </a>
                        </div>
                    ))}
                </div>
                <div className="mt-6 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium">Fechar</button>
                </div>
            </div>
        </div>
    )
}

export const WhatsappBatchModal = ({ isOpen, onClose, batches }: any) => {
    if (!isOpen || !batches || batches.length === 0) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="mb-4 shrink-0">
                    <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                        <span className="p-1.5 bg-green-100 text-green-600 rounded-lg">
                            <Send className="h-5 w-5" />
                        </span> 
                        Envio por WhatsApp
                    </h3>
                    <p className="text-sm text-gray-500">Clique em cada link para disparar mensagens individuais via Web WhatsApp.</p>
                </div>
                
                <div className="space-y-2 overflow-y-auto pr-2 flex-1">
                    {batches.map((batch: any, index: number) => (
                        <div key={index} className="p-3 border border-gray-100 bg-gray-50 rounded-lg flex items-center justify-between hover:border-green-300 transition-colors">
                            <div className="min-w-0 pr-4">
                                <h4 className="font-bold text-gray-800 text-sm truncate">{batch.name || 'Contato sem nome'}</h4>
                                <p className="text-[11px] text-gray-500 font-mono mt-0.5">{batch.phone}</p>
                            </div>
                            <a 
                                href={batch.link}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 flex items-center gap-1 shrink-0"
                            >
                                <Send className="h-3 w-3" /> Abrir no App
                            </a>
                        </div>
                    ))}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end shrink-0">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium text-sm">Fechar Painel</button>
                </div>
            </div>
        </div>
    )
}