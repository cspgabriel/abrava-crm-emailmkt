# 🚀 Firebase Setup & WhatsApp Server Fix Guide

## ✅ Passo 1: Criar as Coleções Firebase

### Opção A: Usar o Script Node.js (RECOMENDADO)

```bash
# 1. Instale o Firebase Admin SDK (se não tiver)
cd abravacom-main
npm install firebase-admin

# 2. Obtenha o arquivo de credenciais do Firebase
# - Vá para: https://console.firebase.google.com/project/finance8-96cb0/settings/serviceaccounts/adminsdk
# - Clique em "Gerar nova chave privada"
# - Salve como: firebase-service-account.json

# 3. Execute o script de inicialização
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json node scripts/init-firebase-collections.js
```

### Opção B: Autenticação via gcloud (SEM arquivo JSON)

```bash
# 1. Instale/Configure gcloud
gcloud auth login
gcloud config set project finance8-96cb0

# 2. Configure credenciais padrão
gcloud auth application-default login

# 3. Execute o script (usará credenciais padrão)
node scripts/init-firebase-collections.js
```

### Opção C: Criar Manualmente no Firebase Console

1. Vá para https://console.firebase.google.com/project/finance8-96cb0
2. Clique em **Firestore Database** → **Coleções**
3. Crie cada coleção clicando em **+ Iniciar coleção**:
   - `annotations`
   - `whatsapp_send_history`
   - `whatsapp_campaigns`
   - `activity_log`

---

## ✅ Passo 2: Atualizar Regras Firestore

As regras foram atualizadas em `firestore.rules`. Agora faça o deploy:

### Deploy via Cloud Console (Mais Fácil)

1. Vá para https://console.firebase.google.com/project/finance8-96cb0/firestore/rules
2. Copie o conteúdo de `firestore.rules`
3. Cole na aba **Regras** do console
4. Clique em **Publicar**

### Deploy via Firebase CLI

```bash
# 1. Instale Firebase CLI (se não tiver)
npm install -g firebase-tools

# 2. Autentique
firebase login

# 3. Faça o deploy das regras
firebase deploy --only firestore:rules --project finance8-96cb0
```

### Validar o Deploy

```bash
# Verifique se as regras estão ativas
curl https://console.firebase.google.com/project/finance8-96cb0/firestore/rules
```

---

## 🔴 Problema: Erro 503 no WhatsApp Server

### Sintomas:
- Frontend mostra: `✓ WhatsApp conectado com sucesso! 552126251150`
- Ao enviar: `POST https://wpp-api.abravacom.com.br/send 503 (Service Unavailable)`

### Causa:
O servidor retorna 503 quando `client.info.wid` não existe, o que significa:
1. **Cliente desconectou momentaneamente** entre o status check e o send
2. **Servidor caiu ou está reiniciando**
3. **Problema com Puppeteer/Chrome** (crash do navegador)

### ✅ Soluções (em ordem de impacto):

#### 1. Monitor de Reconexão Automática (CRÍTICO)
```javascript
// Adicionar ao server.js após o event 'ready':

let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;

client.on('disconnected', async (reason) => {
  console.warn('⚠️  WhatsApp desconectado:', reason);
  
  // Se foi erro de envio, reconecta agressivamente
  if (reason?.includes('timeout') || reason?.includes('destroyed')) {
    reconnectAttempts++;
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      console.log(`🔄 Tentando reconectar (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
      setTimeout(() => client.initialize(), 3000);
    }
  }
});

client.on('ready', () => {
  reconnectAttempts = 0; // Reset counter
  console.log('✅ WhatsApp reconectado com sucesso!');
});
```

#### 2. Health Check com Retry no Frontend
```typescript
// Em WhatsAppSender.tsx, na função handleSendBulk():

async function sendWithRetry(phone, message, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`${apiBase}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify({ phone, message })
      });
      
      if (response.ok) return await response.json();
      
      if (response.status === 503 && attempt < maxRetries) {
        console.warn(`⚠️  Servidor indisponível. Tentando novamente em 2s...`);
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      
      throw new Error(`HTTP ${response.status}`);
    } catch (err) {
      if (attempt === maxRetries) throw err;
      console.warn(`Tentativa ${attempt} falhou:`, err.message);
      await new Promise(r => setTimeout(r, 1500 * attempt));
    }
  }
}
```

#### 3. Aumentar Timeouts no Puppeteer
```javascript
// Em server.js, na inicialização do Client:

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: 'abravacon-wpp',
  }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    timeout: 60000, // ⬅️ Aumentar de 30s para 60s
    handleSIGINT: false,
  },
  webVersionCache: {
    type: 'remote',
    remotePath: 'https://raw.githubusercontent.com/wppconnect-team/evolution-api/main/src/lib/waweb',
  },
});
```

#### 4. Verificar Espaço em Disco
```bash
# Se o Chrome/Puppeteer falhar, pode ser falta de espaço
df -h

# Limpar cache do whatsapp-web.js
rm -rf .wwebjs_auth
rm -rf ~/.cache/puppeteer  # ou C:\Users\%username%\AppData\Local\Puppeteer
```

#### 5. Verificar Logs do Servidor
```bash
# Em development, rode o servidor com logs verbosos:
DEBUG=* npm run dev

# Ou adicione mais logs em server.js:
console.log('[WPP] Client state:', {
  exists: !!client,
  hasInfo: !!client?.info,
  hasWid: !!client?.info?.wid,
  ready: client?.isReady
});
```

---

## 🔧 Checklist de Validação

### Firebase
- [ ] Coleções criadas: `annotations`, `whatsapp_send_history`, `whatsapp_campaigns`, `activity_log`
- [ ] Regras Firestore atualizadas e publicadas
- [ ] GET `/status` retorna: `{"ready": true}`

### WhatsApp Server
- [ ] Servidor rodando: `npm run dev` no `wpp-api-server/`
- [ ] Porta aberta: `curl http://localhost:8787/healthz`
- [ ] Conectado: `curl http://localhost:8787/status` retorna `connected: true`
- [ ] QR Code visível em http://localhost:3001/crm se desconectado

### Frontend
- [ ] Mensagens de erro claras ao enviar
- [ ] Retry automático em caso de 503
- [ ] Progress bar mostrando envios realizados

---

## 📞 Troubleshooting

### "Missing or insufficient permissions"
```
Erro: [code=permission-denied]
Solução: Verifique se as regras Firestore foram publicadas
- Vá para https://console.firebase.google.com/project/finance8-96cb0/firestore/rules
- Clique em "Publicar"
```

### "WhatsApp session not initialized"
```
Erro: 503 Service Unavailable
Solução: O servidor está reiniciando
- Aguarde 10-15 segundos para o WhatsApp reconectar
- Ou reinicie manual: kill + restart do servidor
```

### "Cannot read properties of undefined"
```
Erro: Client state corrupted
Solução: Limpe a sessão persistida
- Delete: C:\Users\%username%\.wwebjs_auth (Windows)
- Delete: ~/.wwebjs_auth (Linux/Mac)
- Reinicie o servidor
```

---

## 📚 Referências

- Firebase Firestore Docs: https://firebase.google.com/docs/firestore
- whatsapp-web.js: https://github.com/pedroslopez/whatsapp-web.js
- Firebase Security Rules: https://firebase.google.com/docs/firestore/security/get-started
