import React, { useState, useEffect } from 'react';
import { Merge } from 'lucide-react';

export const MergeModal = ({ isOpen, onClose, items, onConfirm }: any) => {
    const [masterId, setMasterId] = useState<string>('');

    useEffect(() => {
        if(items.length > 0 && !masterId) setMasterId(items[0].id);
    }, [items, masterId]);

    if (!isOpen) return null;

    const handleMerge = () => {
        const master = items.find((i: any) => i.id === masterId);
        if(!master) return;

        // Merge Strategy:
        // 1. Start with Master record data.
        // 2. Iterate other records.
        // 3. If Master has empty/null field, take value from others.
        // 4. Combine arrays (tags, history).
        
        let merged: any = { ...master };
        const others = items.filter((i: any) => i.id !== masterId);

        others.forEach((other: any) => {
            Object.keys(other).forEach(key => {
                const masterVal = merged[key];
                const otherVal = other[key];

                // Check if master value is "empty"
                const isMasterEmpty = masterVal === null || masterVal === undefined || masterVal === '';
                const isOtherValid = otherVal !== null && otherVal !== undefined && otherVal !== '';

                if (isMasterEmpty && isOtherValid) {
                    merged[key] = otherVal;
                }
                
                // Special handling for Arrays (concat unique)
                if (Array.isArray(masterVal) && Array.isArray(otherVal)) {
                    // Simple concat for history objects might duplicate, but logic is acceptable for basic merge
                    merged[key] = [...masterVal, ...otherVal];
                }
            });
        });

        // Add a merge history note
        if (!merged.history) merged.history = [];
        merged.history.push({
            date: new Date().toISOString(),
            type: 'merge',
            description: `Mesclado com ${others.length} registro(s). IDs: ${others.map((o:any)=>o.id).join(', ')}`
        });

        const idsToDelete = others.map((i: any) => i.id);
        onConfirm(masterId, idsToDelete, merged);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-200">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <Merge className="h-5 w-5 text-blue-600"/> Mesclar Registros
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                    Selecione o registro <strong>Principal</strong> (Master). Dados vazios no principal serão preenchidos pelos dados dos outros registros. Os registros secundários serão <strong>excluídos permanentemente</strong>.
                </p>
                
                <div className="space-y-2 mb-6 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50">
                    {items.map((item: any) => (
                        <label key={item.id} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${masterId === item.id ? 'border-blue-500 bg-white ring-1 ring-blue-500' : 'border-gray-200 hover:bg-white'}`}>
                            <input 
                                type="radio" 
                                name="masterRecord" 
                                checked={masterId === item.id}
                                onChange={() => setMasterId(item.id)}
                                className="mr-3 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                                <div className="font-bold text-sm text-gray-800">{item.name || 'Sem Nome'}</div>
                                <div className="text-xs text-gray-500 flex gap-2">
                                    <span>{item.email || item.location || 'Sem Detalhes'}</span>
                                    <span className="text-gray-300">|</span>
                                    <span className="font-mono">ID: {item.id}</span>
                                </div>
                            </div>
                        </label>
                    ))}
                </div>

                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium">Cancelar</button>
                    <button onClick={handleMerge} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-bold shadow-md">
                        Confirmar Mesclagem
                    </button>
                </div>
            </div>
        </div>
    );
};