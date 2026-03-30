import React, { useState } from 'react';
import { X, Eye } from 'lucide-react';
import type { EmailTemplate } from './EmailTemplates';
import { DEFAULT_TEMPLATES_LIST } from './EmailTemplates';

interface TemplateSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: EmailTemplate) => void;
  onPreview?: (template: EmailTemplate | null) => void;
}

const getStoredTemplates = (): EmailTemplate[] => {
  try {
    const stored = localStorage.getItem('crm_email_templates');
    if (stored) return JSON.parse(stored);
  } catch {
    //
  }
  return DEFAULT_TEMPLATES_LIST;
};

export const TemplateSelectModal: React.FC<TemplateSelectModalProps> = ({ isOpen, onClose, onSelect, onPreview }) => {
  const [templates, setTemplates] = useState<EmailTemplate[]>(getStoredTemplates());
  const [selectedCategory, setSelectedCategory] = useState('all');

  if (!isOpen) return null;

  const categories = ['all', 'newsletter', 'promotion', 'confirmation', 'password', 'notification', 'invitation', 'feedback', 'report', 'custom'];
  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  const handleSelect = (template: EmailTemplate) => {
    onSelect(template);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="text-2xl font-bold text-slate-900">📧 Escolher Template</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 transition"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Category Filter */}
        <div className="px-6 py-4 border-b border-gray-200 bg-slate-50 overflow-x-auto">
          <div className="flex gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                {cat === 'all' ? '📋 Todos' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTemplates.map(template => (
              <div
                key={template.id}
                className="border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition bg-white"
              >
                {/* Template Info */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-slate-900">{template.name}</h3>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {template.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{template.description}</p>
                </div>

                {/* Subject */}
                <div className="p-4 border-b border-gray-100 bg-slate-50">
                  <p className="text-xs text-slate-600">Assunto:</p>
                  <p className="text-sm font-mono text-slate-900 truncate">{template.subject}</p>
                </div>

                {/* Preview & Select */}
                <div className="p-4 flex gap-2">
                  <button
                    onClick={() => {
                      // delegate preview handling to parent (sidebar)
                      onPreview?.(template);
                    }}
                    className="flex-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm flex items-center justify-center gap-1 transition"
                  >
                    <Eye className="h-4 w-4" />
                    Visualizar
                  </button>
                  <button
                    onClick={() => handleSelect(template)}
                    className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition"
                  >
                    ✅ Usar
                  </button>
                </div>

                {/* Inline preview removed — parent component shows a sidebar preview */}
              </div>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-600">Nenhum template encontrado</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-300 hover:bg-slate-400 text-slate-900 rounded-lg transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
