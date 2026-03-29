import React, { useState } from 'react';
import { CONTACT_FIELDS } from '../config/constants';

export const FormBuilderModal = ({ isOpen, onClose, onSave }: any) => {
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [selectedFields, setSelectedFields] = useState<string[]>(['name', 'email']);
    if (!isOpen) return null;
    const availableFields = CONTACT_FIELDS; 
    const toggleField = (key: string) => {
        if(key === 'email' || key === 'name') return; 
        if (selectedFields.includes(key)) setSelectedFields(selectedFields.filter(k => k !== key));
        else setSelectedFields([...selectedFields, key]);
    }
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100"><h3 className="text-lg font-bold text-gray-900">Novo Formulário de Atualização</h3></div>
                <div className="p-6 overflow-y-auto space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Título do Formulário</label><input type="text" className="w-full border rounded p-2" placeholder="Ex: Atualização Cadastral 2024" value={title} onChange={e => setTitle(e.target.value)} /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Descrição / Instruções</label><textarea className="w-full border rounded p-2" rows={3} placeholder="Por favor, confirme seus dados para continuarmos nosso contato." value={desc} onChange={e => setDesc(e.target.value)} /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-2">Campos para Preencher</label><div className="space-y-2">{availableFields.map(f => (<label key={f.key} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={selectedFields.includes(f.key)} onChange={() => toggleField(f.key)} disabled={f.key === 'name' || f.key === 'email'} className="rounded border-gray-300 text-blue-600" /><span className="text-sm text-gray-700">{f.label}</span>{(f.key === 'name' || f.key === 'email') && <span className="text-xs text-gray-400">(Obrigatório)</span>}</label>))}</div></div>
                </div>
                <div className="p-6 bg-gray-50 rounded-b-xl flex justify-end gap-2"><button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button><button onClick={() => onSave({ title, description: desc, fields: selectedFields })} disabled={!title} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">Criar Formulário</button></div>
            </div>
        </div>
    );
}