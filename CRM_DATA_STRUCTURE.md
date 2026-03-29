# Estrutura de Dados do CRM - Análise Completa

## 📊 Dados Armazenados Atualmente

### 1. **Histórico de Envio WhatsApp** 
- **Armazenamento**: localStorage
- **Chave**: `crm_whatsapp_send_history`
- **Tipo**: Array de objetos `SendHistoryItem`
- **Campos**:
  - `id`: string (identificador único)
  - `phone`: string (número do telefone)
  - `name`: string (nome do destinatário)
  - `message`: string (conteúdo da mensagem)
  - `ok`: boolean (sucesso/falha)
  - `createdAt`: string (data ISO)
  - `responseId?`: string (ID de resposta da API)
- **Limite**: 600 últimos registros mantidos em localStorage
- **Frequência**: Adicionado a cada envio individual ou em massa

### 2. **Dados de Empresas (Companies)**
- **Armazenamento**: Firebase Firestore (coleção `companies`)
- **Campos Principais**:
  - userName, userEmail, userPhone
  - type, creditAmount
  - status, updatedAt
  - Outros campos customizáveis

### 3. **Dados de Contatos (Contacts)**
- **Armazenamento**: Firebase Firestore (coleção `contacts`)
- **Campos Principais**:
  - name, email, phone
  - company_name, company_industry
  - total_simulations, mailing
  - role, department
  - updatedAt

### 4. **Campanhas (Campaigns)**
- **Armazenamento**: Firebase Firestore (coleção `campaigns`)
- **Campos Principais**:
  - subject, recipientEmails, recipientCount
  - date, method (ex: "whatsapp", "email")
  - status, content

### 5. **Simulações (Simulations)**
- **Armazenamento**: Firebase Firestore (coleção `simulations`)
- **Tipo**: ConsortiumType ('Imóvel')
- **Campos Principais**:
  - id, userId, type, creditAmount
  - userName, userPhone, userEmail
  - status: 'pending' | 'analyzed' | 'completed'
  - results: { installments, monthlyValue, adminFee, reserveFund }
  - sentAt, sentBy ('whatsapp' | 'email')
  - nextContactAt, lastActivity

### 6. **Cartas Contempladas (ContemplatedLetters)**
- **Armazenamento**: Firebase Firestore (coleção `contemplated_letters`)
- **Campos Principais**:
  - id, userId, category ('Carro' | 'Imóvel' | 'Caminhão' | 'Giro')
  - credit, entry, installmentsCount, installmentValue
  - group, administrator,status ('available' | 'reserved' | 'sold')
  - observations, code, name
  - contactPhone, contactEmail

### 7. **Perfil do Usuário (UserProfile)**
- **Armazenamento**: Firebase Firestore (coleção `users`)
- **Campos Principais**:
  - uid, email, displayName
  - role ('client' | 'admin')
  - createdAt, lastActivityAt
  - lastActivityDesc

### 8. **Chaves de API**
- **Armazenamento**: localStorage
- **Chaves**:
  - `crm_api_key`: API key do WPP API
  - `wpp_api_key`: WPP API key alternativo
  - `crm_auth_token`: Token de autenticação do CRM

### 9. **Formulários (Forms)**
- **Armazenamento**: Firebase Firestore (coleção `forms`)
- **Tipo**: Formulários dinâmicos customizáveis

---

## ⚠️ Coleções Planejadas MAS NÃO CRIADAS NO FIREBASE

### **`annotations` ou `contact_notes`** ❌
- **Propósito**: Armazenar anotações de contatos/simulações
- **Campos Sugeridos**:
  ```typescript
  {
    id: string;
    contactId: string;
    simulationId?: string;
    author: string;
    content: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    visibility: 'private' | 'team' | 'public';
  }
  ```
- **Status**: Não criada - dados de anotações estão sendo perdidos

### **`whatsapp_send_history`** ❌
- **Propósito**: Backup persistente do histórico de envio no Firebase
- **Campos Sugeridos**:
  ```typescript
  {
    id: string;
    phone: string;
    name: string;
    message: string;
    ok: boolean;
    createdAt: Timestamp;
    sentBy: string;  // email do admin que enviou
    chipType: 'cold' | 'warm' | 'hot' | 'superhot';
    responseId?: string;
  }
  ```
- **Status**: Não criada - dados apenas em localStorage (máx 600 registros)
- **Risco**: Perda de dados ao limpar localStorage ou trocar dispositivo

### **`whatsapp_campaigns`** ❌
- **Propósito**: Campanhas programadas/agendadas
- **Campos Sugeridos**:
  ```typescript
  {
    id: string;
    name: string;
    recipients: string[];  // array de phones
    message: string;
    scheduledFor: Timestamp;
    status: 'draft' | 'scheduled' | 'sent' | 'failed';
    createdBy: string;
    createdAt: Timestamp;
    sentAt?: Timestamp;
  }
  ```
- **Status**: Não criada

### **`activity_log`** ❌
- **Propósito**: Registro de auditoria de todas as ações no CRM
- **Campos Sugeridos**:
  ```typescript
  {
    id: string;
    userId: string;
    action: string;  // 'created', 'updated', 'deleted', 'sent', etc
    entityType: string;  // 'contact', 'company', 'simulation', 'whatsapp_send'
    entityId: string;
    changes?: object;  // before/after values
    timestamp: Timestamp;
  }
  ```
- **Status**: Não criada

---

## 🔄 Dados Temporários (Não Persistem)

- **Quotas de Envio**: Calculadas em runtime a partir do histórico
- **Estado da Sessão WhatsApp**: Em memória do servidor (porta 8787)
- **QR Code**: Gerado em tempo real, não armazenado

---

## 📌 Recomendações

### Migração para Firebase
1. Mover `whatsapp_send_history` do localStorage para Firebase
2. Criar coleção `annotations` para anotações de contatos
3. Implementar `activity_log` para auditoria

### Backup
- localStorage serve apenas como cache local
- Dados críticos devem estar no Firebase para persistência

---

## 🔐 Segurança Firestore

**Arquivo atual**: `firestore.rules` (verificar permissões de leitura/escrita)

**Coleções que precisam de regras**:
- `annotations` - Apenas autor e admins podem ler/editar
- `whatsapp_send_history` - Histórico deve ser privado por usuário
- `activity_log` - Apenas admins devem acessar
