import React, { useState } from 'react';
import { Copy, Eye, Trash2, Plus, Code } from 'lucide-react';

export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  category: 'newsletter' | 'promotion' | 'confirmation' | 'password' | 'notification' | 'invitation' | 'feedback' | 'report' | 'custom';
  subject: string;
  htmlContent: string;
  previewText: string;
  createdAt: string;
  isDefault?: boolean;
}

// Templates pré-definidos
export const DEFAULT_TEMPLATES_LIST: EmailTemplate[] = [
  {
    id: 'newsletter-001',
    name: 'Newsletter Semanal',
    description: 'Template para newsletter comercial semanal',
    category: 'newsletter',
    subject: 'Confira as novidades desta semana!',
    previewText: 'Leia os melhores conteúdos...',
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; }
    .call-to-action { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #999; border-top: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📰 Newsletter Semanal</h1>
      <p>Sua dose de conteúdo premium</p>
    </div>
    <div class="content">
      <h2>Olá, [NOME]!</h2>
      <p>Preparamos um ótimo conteúdo para você esta semana:</p>
      
      <h3>📌 Destaques</h3>
      <ul>
        <li>Artigo 1: [Título]</li>
        <li>Artigo 2: [Título]</li>
        <li>Artigo 3: [Título]</li>
      </ul>
      
      <p>
        <a href="#" class="call-to-action">Leia Mais</a>
      </p>
    </div>
    <div class="footer">
      <p>&copy; 2024 Sua Empresa. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>`,
    isDefault: true
  },
  {
    id: 'promo-001',
    name: 'Promoção Especial',
    description: 'Template para campanhas promocionais',
    category: 'promotion',
    subject: '🎉 PROMOÇÃO ESPECIAL - 50% OFF',
    previewText: 'Corra, oferta limitada!',
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .banner { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 40px; text-align: center; border-radius: 8px; }
    .banner h1 { font-size: 36px; margin: 0; }
    .banner .discount { font-size: 48px; font-weight: bold; }
    .content { padding: 30px; background: #f9f9f9; }
    .timer { background: #fff3cd; border: 2px dashed #ff6b6b; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
    .cta { background: #ff6b6b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="banner">
      <h1>🎉 PROMOÇÃO ESPECIAL!</h1>
      <p class="discount">50% OFF</p>
      <p>Tempo limitado - Aproveite agora!</p>
    </div>
    <div class="content">
      <h2>Olá, [NOME]!</h2>
      <p>Você foi selecionado para receber uma oferta exclusiva:</p>
      
      <div class="timer">
        <strong>⏰ Falta pouco tempo!</strong>
        <p>Oferta válida até [DATA]</p>
      </div>
      
      <p>Não perca esta oportunidade incrível!</p>
      <p>
        <a href="#" class="cta">🛍️ COMPRAR AGORA</a>
      </p>
    </div>
  </div>
</body>
</html>`,
    isDefault: true
  },
  {
    id: 'confirm-001',
    name: 'Confirmação de Cadastro',
    description: 'Template para confirmação de email',
    category: 'confirmation',
    subject: 'Confirme seu email - [EMPRESA]',
    previewText: 'Clique para confirmar seu email',
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { padding: 30px; background: #f9f9f9; }
    .verify-button { background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold; }
    .code-box { background: white; border: 2px dashed #4CAF50; padding: 15px; text-align: center; font-family: monospace; font-size: 18px; margin: 20px 0; letter-spacing: 2px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Bem-vindo!</h1>
      <p>Confirme seu email para continuar</p>
    </div>
    <div class="content">
      <h2>Olá, [NOME]!</h2>
      <p>Obrigado por se registrar. Para ativar sua conta, clique no botão abaixo:</p>
      
      <p style="text-align: center;">
        <a href="#" class="verify-button">🔐 Confirmar Email</a>
      </p>
      
      <p style="text-align: center; color: #999;">Ou use este código:</p>
      <div class="code-box">ABC123XYZ</div>
      
      <p><strong>Este link expira em 24 horas.</strong></p>
    </div>
  </div>
</body>
</html>`,
    isDefault: true
  },
  {
    id: 'promo-blackfriday',
    name: 'Black Friday',
    description: 'Template exclusivo para Black Friday',
    category: 'promotion',
    subject: '⚫ BLACK FRIDAY - Descontos Imperdíveis!',
    previewText: 'As maiores ofertas do ano',
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; color: #333; background: #000; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .banner { background: linear-gradient(135deg, #FF0000 0%, #8B0000 100%); color: white; padding: 40px; text-align: center; border-radius: 8px; }
    .banner h1 { font-size: 48px; margin: 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.5); }
    .offer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
    .offer { background: white; padding: 15px; border-radius: 8px; text-align: center; }
    .offer-price { font-size: 24px; color: #FF0000; font-weight: bold; }
    .cta { background: #FF0000; color: white; padding: 15px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block; }
  </style>
</head>
<body>
  <div class="container">
    <div class="banner">
      <h1>⚫ BLACK FRIDAY</h1>
      <p style="font-size: 24px;">ATÉ 70% DE DESCONTO</p>
    </div>
    
    <div style="background: white; padding: 30px; border-radius: 8px; margin: 20px 0;">
      <h2 style="text-align: center;">Maiores Descontos do Ano!</h2>
      
      <div class="offer-grid">
        <div class="offer">
          <h3>Produto 1</h3>
          <p class="offer-price">R$ 99,90</p>
        </div>
        <div class="offer">
          <h3>Produto 2</h3>
          <p class="offer-price">R$ 149,90</p>
        </div>
      </div>
      
      <p style="text-align: center;">
        <a href="#" class="cta">🛍️ COMPRAR AGORA</a>
      </p>
    </div>
  </div>
</body>
</html>`,
    isDefault: true
  }
];

const TEMPLATES_STORAGE_KEY = 'crm_email_templates';

const getStoredTemplates = (): EmailTemplate[] => {
  try {
    const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    //
  }
  return DEFAULT_TEMPLATES_LIST;
};

export const EmailTemplates: React.FC<{ onSelectTemplate?: (template: EmailTemplate) => void }> = ({ onSelectTemplate }) => {
  const [templates, setTemplates] = useState<EmailTemplate[]>(getStoredTemplates());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', subject: '', htmlContent: '' });

  const categories = ['all', 'newsletter', 'promotion', 'confirmation', 'password', 'notification', 'invitation', 'feedback', 'report', 'custom'];

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  const handleDeleteTemplate = (id: string) => {
    if (confirm('Tem certeza? Esta ação não pode ser desfeita.')) {
      const updated = templates.filter(t => t.id !== id);
      setTemplates(updated);
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(updated));
    }
  };

  const handleSaveNewTemplate = () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.htmlContent) {
      alert('Preencha todos os campos');
      return;
    }

    const template: EmailTemplate = {
      id: `custom-${Date.now()}`,
      name: newTemplate.name,
      description: `Template customizado em ${new Date().toLocaleDateString()}`,
      category: 'custom',
      subject: newTemplate.subject,
      htmlContent: newTemplate.htmlContent,
      previewText: newTemplate.htmlContent.substring(0, 100),
      createdAt: new Date().toISOString()
    };

    const updated = [template, ...templates];
    setTemplates(updated);
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(updated));
    setNewTemplate({ name: '', subject: '', htmlContent: '' });
    setShowNewForm(false);
    alert('✅ Template criado com sucesso!');
  };

  const handleCopyTemplate = (template: EmailTemplate) => {
    navigator.clipboard.writeText(template.htmlContent);
    alert('✅ HTML copiado para a área de transferência');
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">📧 Biblioteca de Templates</h1>
        <p className="text-slate-600">Gerencie seus modelos de email HTML</p>
      </div>

      {/* Filter & Actions */}
      <div className="flex gap-4 flex-wrap items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg transition ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'Todos' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition"
        >
          <Plus className="h-4 w-4" />
          Novo Template
        </button>
      </div>

      {/* New Template Form */}
      {showNewForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Criar Novo Template</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Nome do template"
              value={newTemplate.name}
              onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              type="text"
              placeholder="Assunto do email"
              value={newTemplate.subject}
              onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <textarea
              placeholder="Código HTML"
              value={newTemplate.htmlContent}
              onChange={(e) => setNewTemplate({ ...newTemplate, htmlContent: e.target.value })}
              rows={10}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveNewTemplate}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
              >
                ✅ Salvar Template
              </button>
              <button
                onClick={() => setShowNewForm(false)}
                className="px-4 py-2 bg-slate-300 hover:bg-slate-400 text-slate-900 rounded-lg transition"
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map(template => (
          <div key={template.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900">{template.name}</h3>
                  <p className="text-xs text-slate-600 mt-1">{template.description}</p>
                </div>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  {template.category}
                </span>
              </div>
            </div>

            {/* Subject Preview */}
            <div className="p-4 border-b bg-slate-50">
              <p className="text-xs text-slate-600 font-mono">Assunto:</p>
              <p className="text-sm font-medium text-slate-900 truncate">{template.subject}</p>
            </div>

            {/* Actions */}
            <div className="p-4 flex gap-2">
              <button
                onClick={() => setPreviewId(previewId === template.id ? null : template.id)}
                className="flex-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm flex items-center justify-center gap-1 transition"
              >
                <Eye className="h-4 w-4" />
                Visualizar
              </button>
              <button
                onClick={() => handleCopyTemplate(template)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm flex items-center justify-center transition"
                title="Copiar HTML"
              >
                <Copy className="h-4 w-4" />
              </button>
              {!template.isDefault && (
                <button
                  onClick={() => handleDeleteTemplate(template.id)}
                  className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm flex items-center justify-center transition"
                  title="Deletar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Select Button (if callback provided) */}
            {onSelectTemplate && (
              <div className="px-4 pb-4">
                <button
                  onClick={() => {
                    onSelectTemplate(template);
                    alert('✅ Template selecionado!');
                  }}
                  className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition"
                >
                  ✅ Usar Este Template
                </button>
              </div>
            )}

            {/* Preview */}
            {previewId === template.id && (
              <div className="border-t p-4 bg-slate-50 max-h-96 overflow-hidden">
                <div className="text-xs text-slate-600 flex items-center gap-1 mb-2">
                  <Code className="h-3 w-3" />
                  Visualização
                </div>
                <iframe
                  srcDoc={template.htmlContent}
                  className="w-full h-64 border border-slate-300 rounded-lg"
                  title="Preview"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <p className="text-slate-600">Nenhum template encontrado nesta categoria</p>
        </div>
      )}
    </div>
  );
};
