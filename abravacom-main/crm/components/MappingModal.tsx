import React, { useState, useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';

export const MappingModal = ({ isOpen, onClose, fileHeaders, fields, onConfirm, type }: any) => {
  const [mapping, setMapping] = useState<{[key:string]: string}>({});
  useEffect(() => {
    if (isOpen && fileHeaders.length > 0) {
      const newMapping: any = {};
      fields.forEach((field: any) => {
        const match = fileHeaders.find((h: string) => h.toLowerCase().includes(field.key.toLowerCase()) || h.toLowerCase().includes(field.label.toLowerCase().split(' ')[0].toLowerCase()));
        if (match) newMapping[field.key] = match;
      });
      setMapping(newMapping);
    }
  }, [isOpen, fileHeaders]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center"><div><h3 className="text-lg font-bold text-gray-900">Mapear Colunas</h3><p className="text-sm text-gray-500">Campos não mapeados serão criados automaticamente.</p></div><button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5"/></button></div>
        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-4">
            {fields.map((field: any) => (<div key={field.key} className="grid grid-cols-12 gap-4 items-center"><div className="col-span-5"><label className="text-sm font-medium text-gray-700 flex items-center gap-1">{field.label}{field.required && <span className="text-red-500">*</span>}</label>{field.description && <p className="text-xs text-gray-400">{field.description}</p>}</div><div className="col-span-1 text-center text-gray-300"><ArrowRight className="h-4 w-4 mx-auto"/></div><div className="col-span-6"><select className={`w-full text-sm border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 ${!mapping[field.key] && field.required ? 'border-red-300 bg-red-50' : 'border-gray-200'}`} value={mapping[field.key] || ''} onChange={(e) => setMapping({...mapping, [field.key]: e.target.value})}><option value="">-- Automático (Manter Original) --</option>{fileHeaders.map((h: string) => (<option key={h} value={h}>{h}</option>))}</select></div></div>))}
          </div>
        </div>
        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end gap-3"><button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button><button onClick={() => onConfirm(mapping)} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed" disabled={fields.filter((f: any) => f.required && !mapping[f.key]).length > 0}>Confirmar Importação</button></div>
      </div>
    </div>
  );
};