# 🚨 TROUBLESHOOTING - QR Code Não Aparece

## 🔍 Diagnóstico Rápido

### Passo 1: Verificar se o Terminal Mostra `📸 QR CODE RECEBIDO`

```bash
# Terminal com o servidor WPP API
[WPP] ⏳ Tentativa 1/8 de inicialização...
[WPP] ✓ Cliente inicializado com sucesso!
[WPP] 📸 QR CODE RECEBIDO - Sessão nova requer autenticação
[WPP] ✅ QR convertido para base64
```

✅ **Se aparecer `📸 QR CODE RECEBIDO`**: Servidor gerou QR corretamente
❌ **Se NÃO aparecer**: Servidor está travado ou sem permissão - vá para **[Seção "Servidor Travado"](#servidor-travado)**

---

### Passo 2: Testar HTTP Endpoint Diretamente

```bash
# Abra em nova aba do browser:
http://localhost:8787/qr

# Ou pelo terminal:
curl http://localhost:8787/qr
```

**Respostas esperadas:**

✅ **Se retornar:**
```json
{
  "ok": true,
  "qr": "data:image/png;base64,iVBORw0KGgoAAAANS..."
}
```
→ QR disponível! Vá para **[Passo 3](#passo-3-verificar-frontend)**

⚠️ **Se retornar:**
```json
{
  "ok": false,
  "msg": "No QR available"
}
```
→ Servidor recebeu QR mas frontend não conseguiu. Vá para **[Passo 3](#passo-3-verificar-frontend)**

❌ **Se retornar erro de conexão (Connection refused):**
→ Servidor não está rodando. Execute: `node wpp-api-server/server.js`

---

### Passo 3: Verificar Frontend

Abra o browser (Frontend CRM) e **aperte F12** para abrir DevTools → Aba **Console**

Procure por essas mensagens:

✅ **SUCESSO - Se aparecer uma dessas:**
```
[CRM] ✅ QR code obtido via fallback HTTP
[CRM] 🔄 QR code atualizado via polling
[CRM] 📨 Status do WhatsApp: {...}
```

❌ **FALHA - Se aparecer:**
```
[CRM] ❌ Erro WebSocket: ...
[CRM] ⚠️  Fallback HTTP /qr falhou: ...
```

**Se vir erro de WebSocket:**
1. Abra `http://localhost:8787/debug` em outra aba
2. Veja quantos `wsClientsConnected` tem
3. Se for 0, o frontend não conseguiu conectar

---

## 🧪 Script de Teste

```bash
# Na pasta wpp-api-server:
node test-qr.js

# Vai testar:
# 1. HTTP /qr endpoint
# 2. WebSocket
# 3. Debug endpoint
# 4. Mostrar estado atual
```

Exemplo de saída:
```
✅ GET /qr: ✅ QR DISPONÍVEL
   QR size: 1.2 KB
   
✅ WebSocket conectado
✅ Status recebido via WebSocket
   connectionState: waiting-qr
   hasQR: true
   QR size: 1.2 KB

✅ GET /debug: {
  connectionState: "waiting-qr",
  whatsappReady: false,
  hasQR: true,
  wsClientsConnected: 0,
  ...
}
```

---

## 🔧 Soluções por Erro

### Servidor Travado

**Sintoma:**
- Terminal mostra `⏳ Tentativa 1/8...` mas não progride
- Ou fica em retry infinito
- Ou mostra erro "already running"

**Solução:**

```bash
# Opção 1: Script de limpeza
node wpp-api-server/quick-reset-session.js

# Opção 2: Batch simples
wpp-api-server\restart-wpp-clean.bat

# Opção 3: Manual
taskkill /F /IM chrome.exe /T
timeout /t 2
node wpp-api-server/server.js
```

---

### Frontend Não Conecta ao WebSocket

**Sintoma:**
- Terminal mostra `📸 QR CODE RECEBIDO` ✅
- Frontend mostra `⏳ Gerando QR...` para sempre
- Console mostra: `❌ Erro WebSocket: ...`

**Causas possíveis:**

#### 1. CORS Problem
```
Access to XMLHttpRequest at 'http://localhost:8787/...' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solução:**
```bash
# Verificar se CORS está correto no server.js
# Deve incluir localhost:3000

# Testar manualmente:
# Tab 1: node wpp-api-server/server.js
# Tab 2: npm run dev (seu frontend)
# Abra browser em http://localhost:3000
```

#### 2. Wrong API Base URL
```javascript
// O frontend está tentando conectar em:
http://localhost:8787    ← está errado?
http://127.0.0.1:8787    ← ou no host errado?
```

**Solução:**
Verifique em [WhatsAppSender.tsx](../../crm/components/WhatsAppSender.tsx#L37-L43)
```javascript
const getResolvedApiBase = (apiBase = '') => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:8787';  // ← AQUI
  }
  ...
}
```

---

### QR Código Vazio ou Corrupto

**Sintoma:**
- Terminal `📸 QR CODE RECEBIDO` ✅
- Frontend mostra `<img src="data:image/png..." />` mas imagem não carrega
- Ou imagem aparece vazia/corrupta

**Solução:**
```javascript
// 1. DevTools → Network → /qr
// Olhe a resposta. QR deve ter `data:image/png;base64,iVBORw0KGgo...`

// 2. Se estiver muito curto ou vazio:
node wpp-api-server/quick-reset-session.js

// 3. Se ainda não funcionar:
// Servidor pode estar sem permissão de escrita
// Verifique pasta wpp-api-server/.wwebjs_auth
```

---

### "Session persisted encontrada" mas QR novo aparece

**Sintoma:**
- Servidor mostra: `🔄 SESSÃO ANTERIOR DETECTADA - Restaurando...`
- Mas depois pede novo QR
- Sessão anterior foi perdida

**Causas:**
- Chromium deixou lock files corrompidos
- Arquivo de sessão está corrompido

**Solução:**
```bash
# Nuclear reset (VAI pedir novo QR):
node wpp-api-server/quick-reset-session.js full

# Depois:
node wpp-api-server/server.js

# Escaneie o novo QR
```

---

## 📋 Checklist de Diagnóstico Completo

- [ ] Terminal mostra `📸 QR CODE RECEBIDO`?
  - ❌ Não: Servidor pode estar sem permissão, rodando processo antigo, ou o whatsapp-web.js falhou
  - ✅ Sim: Continuar

- [ ] `curl http://localhost:8787/qr` retorna QR?
  - ❌ Não: Converter QR para base64 falhou (raro)
  - ✅ Sim: Continuar

- [ ] Browser console mostra `✅ QR code obtido via fallback HTTP`?
  - ❌ Não: Frontend não conseguiu fazer fetch
  - ✅ Sim: QR DEVE estar aparecendo

- [ ] QR está visível no frontend?
  - ✅ Sim: Escaneie e aguarde 2-3s para conectar
  - ❌ Não: Continuar abaixo

- [ ] Elemento `<img src="data:image/png..." />` existe no HTML?
  - ❌ Não: `connectionState` não é `waiting-qr`
  - ✅ Sim: Continuar

- [ ] Imagem está quebrada (no mínimo 200x200px)?
  - ❌ Sim: QR corrupto, refaça o reset
  - ✅ Não: Escaneie!

---

## 🎯 Resumo Rápido

| Problema | Solução |
|----------|---------|
| Terminal não mostra `📸 QR` | `node quick-reset-session.js` |
| Servidor trava em retry | `restart-wpp-clean.bat` |
| WebSocket não conecta | Verificar CORS + URL base |
| QR aparece mas não funciona | Aguarde 2-3s + escaneie novamente |
| QR quebrado/corrupto | `node quick-reset-session.js full` |

---

## 🆘 Último Recurso

Se nada funcionar:

```bash
# 1. Parar servidor
Ctrl+C

# 2. Limpeza nuclear
node wpp-api-server/quick-reset-session.js full

# 3. Remover tudo (CUIDADO!)
rmdir /s /q wpp-api-server\.wwebjs_auth

# 4. Reiniciar tudo
node wpp-api-server/server.js

# 5. Escaneie novo QR
# Frontend deve pedir novo

# 6. Se servidor ainda der erro:
taskkill /F /IM chrome.exe /T
node wpp-api-server/server.js
```

---

**Versão**: 1.0 | **Status**: ✅ Testado | **Última atualização**: 2026-03-29
