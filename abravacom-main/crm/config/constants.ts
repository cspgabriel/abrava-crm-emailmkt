

export const COMPANY_FIELDS = [
  { key: 'id', label: 'ID / Código', required: true, description: 'Código único da simulação.' },
  { key: 'userName', label: 'Nome Cliente', required: true },
  { key: 'userEmail', label: 'Email Cliente' },
  { key: 'userPhone', label: 'Telefone / WhatsApp' },
  { key: 'type', label: 'Tipo Consórcio' },
  { key: 'creditAmount', label: 'Valor Crédito' },
  { key: 'acceptWhatsApp', label: 'Aceita WhatsApp' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Data Criação' },
  { key: 'updatedAt', label: 'Última Atualização' },
  { key: 'tags', label: 'Tags', description: 'Etiquetas separadas por ;' },
];

export const CONTACT_FIELDS = [
  { key: 'name', label: 'Nome do Contato', required: true },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Telefone / Whatsapp' },
  { key: 'companyId', label: 'ID da Simulação (Vínculo)', description: 'Cole aqui o ID exato da Simulação da Planilha 1 para vincular automaticamente.' },
  { key: 'company_name', label: 'Nome da Simulação (Texto)', description: 'Digite para buscar na base de simulações...' },
  { key: 'role', label: 'Cargo' },
  { key: 'department', label: 'Departamento' },
  { key: 'mailing', label: 'Mailings / Setores', description: 'Separe múltiplos valores com ; (ponto e vírgula)' },
  { key: 'updatedAt', label: 'Última Atualização' },
  { key: 'tags', label: 'Tags', description: 'Etiquetas separadas por ;' },
];