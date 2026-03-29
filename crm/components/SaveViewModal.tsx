import React, { useState } from 'react';
import { firestoreCreateView, firestoreSetDefaultView } from '../utils/savedViews';

export type SaveViewModalProps = {
  open: boolean;
  onClose: () => void;
  ownerUid: string;
  entityType: 'contact' | 'company';
  currentFilters: any;
  currentColumns?: string[];
};

export default function SaveViewModal({
  open,
  onClose,
  ownerUid,
  entityType,
  currentFilters,
  currentColumns
}: SaveViewModalProps) {
  const [name, setName] = useState('');
  const [makeDefault, setMakeDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const id = await firestoreCreateView({
        name: name.trim(),
        entityType,
        filters: currentFilters,
        ownerUid,
        isDefault: makeDefault
      });
      if (makeDefault) {
        await firestoreSetDefaultView(entityType, id);
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar visualização');
    } finally {
      setSaving(false);
      setName('');
      setMakeDefault(false);
    }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Salvar visualização</h3>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nome da visualização"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <label className="flex items-center gap-2 mb-4">
          <input type="checkbox" checked={makeDefault} onChange={e => setMakeDefault(e.target.checked)} />
          Definir como padrão
        </label>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} disabled={saving} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
          <button onClick={handleSave} disabled={saving || !name} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}
