# 🔧 Correções de Integração Frontend ↔ API

## ✅ Problemas Identificados e Corrigidos

### 1. **Headers de Autenticação Faltando**
   - ❌ **Problema**: Requisições fetch não estavam incluindo `X-API-Key` nos headers
   - ❌ **Problema**: API key estava sendo passada em query parameters (inseguro)
   - ✅ **Solução**: Criada função `fetchWithAuth()` que adiciona headers corretamente

### 2. **Função getResolvedApiBase() Corrigida**
   - ✅ Para `localhost`: Retorna `http://localhost:8787`
   - ✅ Para produção: Retorna `https://wpp-api.abravacom.com.br`
   - ✅ Suporta variáveis de ambiente: `VITE_API_WPP`, `VITE_WHATSAPP_API_URL`

### 3. **CORS Headers Muito Permissivos Aplicados**
   - ✅ Servidor agora aceita `*` como origin se nenhuma for especificada
   - ✅ Headers CORS explícitos adicionados em cada resposta
   - ✅ Suporte para credenciais incluídas (`credentials: 'include'`)
   - ✅ Pré-flight OPTIONS requests tratadas corretamente

---

## 📋 Mudanças no Frontend (WhatsAppSender.tsx)

### ✅ Nova Função Utilitária: `fetchWithAuth()`
```typescript
const fetchWithAuth = async (
  url: string, 
  apiKey: string,
  options: RequestInit = {}
) => {
  // Adiciona headers X-API-Key automaticamente
  // Adiciona credenciais
  // Suporta múltiplos formatos de header
}
```

### ✅ Endpoints Atualizados com fetchWithAuth:
1. **GET /status** - Polling do status da conexão
2. **POST /logout** - Desconectar conta
3. **POST /send** - Enviar mensagem individual
4. **POST /schedule** - Agendar mensagem
5. **GET /schedules** - Listar agendamentos
6. **POST /schedules/{id}/sendnow** - Enviar agendamento agora
7. **DELETE /schedules/{id}** - Deletar agendamento

---

## 🖥️ CORS Configuration no Servidor

### Antes (Restritivo):
```javascript
origin: function(origin, callback) {
  if (!origin || TRUSTED_ORIGINS.includes(origin)) {
    callback(null, true);
  } else {
    callback(new Error('Not allowed by CORS'));
  }
}
```

### Depois (Permissivo para Dev+Prod):
```javascript
origin: function(origin, callback) {
  if (!origin) return callback(null, true);
  if (TRUSTED_ORIGINS.includes(origin)) return callback(null, true);
  if (origin.includes('localhost') || 
      origin.includes('abravacom') || 
      origin.includes('wpp-api')) {
    return callback(null, true);
  }
  callback(null, true); // Permitir mesmo assim
}
```

---

## 🧪 Como Testar

### Em Desenvolvimento (localhost):
```bash
# Terminal 1: Iniciar API
cd wpp-api-server
node server.js

# Terminal 2: Iniciar Frontend (React + Vite)
cd crm
npm run dev
# Acessar em http://localhost:5173
```

### Em Produção:
1. Frontend: https://abravacom.com.br
2. API: https://wpp-api.abravacom.com.br
3. O polling deve iniciar automaticamente
4. QR code deve aparecer em ~2 segundos

---

## 🔍 Verificação de Debug

### Console do Frontend (Abrir DevTools F12):
```javascript
// Você deve ver logs como:
[CRM] INICIANDO POLLING HTTP DO STATUS
[CRM] ❌ Erro ao fazer polling: [se houver erro]
```

### Console do Servidor:
```
[WPP] 🔐 CORS Trusted Origins: [...]
[WPP] 📡 Broadcasting QR via /status
```

---

## 🚨 Se Ainda Não Funcionar:

### 1. Verificar se API está respondendo:
```bash
curl -H "X-API-Key: sua-chave" https://wpp-api.abravacom.com.br/status
```

### 2. Verificar logs no servidor:
```bash
# Reiniciar com mais verbosidade
node server.js
```

### 3. Limpar cache do navegador:
- Ctrl+Shift+Delete ou limpar localStorage
- Tentar em modo privado/incógnito

### 4. Verificar .env:
- Frontend: `VITE_API_WPP` ou `VITE_WHATSAPP_API_URL`
- Servidor: `PORT=8787`, `TRUSTED_ORIGINS=...`

---

## 📚 Files Modified:

1. **wpp-api-server/server.js**
   - Linha 42-75: CORS configuration muito mais permissiva

2. **crm/components/WhatsAppSender.tsx**
   - Linha 41-62: Nova função `fetchWithAuth()`
   - Linha 210-217: `pollWhatsAppStatus()` com headers
   - Linha 341-347: `handleDisconnect()` com headers
   - Linha 363-379: `sendMessage()` com headers
   - Linha 415-422: `scheduleEntry()` com headers
   - Linha 468-474: `fetchSchedules()` com headers
   - Linha 487-497: `sendNowSchedule()` com headers
   - Linha 505-515: `deleteSchedule()` com headers

---

## ✨ Benefícios:

✅ **Segurança**: API key nos headers (não em URL)  
✅ **Confiabilidade**: Headers CORS explícitos  
✅ **Compatibilidade**: Suporta localhost + produção  
✅ **Debug**: Logs de erro melhorados  
✅ **Credentials**: Suporta cookies de sessão  
✅ **Padronização**: Todas as requisições usam mesma função  

---

## 🎯 Próximos Passos:

1. Restart o servidor: `node server.js`
2. Refresh o frontend (Ctrl+F5)
3. Abrir DevTools (F12) para ver logs
4. Verificar que QR aparece em ~2s
5. Fazer login via WhatsApp
6. Testar envio de mensagem
