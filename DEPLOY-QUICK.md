# 🚀 Quick Start - Deploy no Vercel

## ⚡ Resumo Executivo

Seu CRM rodando localmente precisa ser deployado no Vercel. O servidor WPP API continua na sua máquina.

**Tempo estimado**: 15 minutos

---

## 🎯 Passo a Passo

### 1️⃣ Preparar o Repositório

Execute o script de preparação:

```bash
cd c:\Users\cspga\Downloads\abravacom-main
prepare-deploy.bat
```

Este script irá:
- ✅ Inicializar Git
- ✅ Adicionar remote GitHub
- ✅ Criar .gitignore
- ✅ Instalar dependências
- ✅ Testar build

### 2️⃣ Fazer Push no GitHub

```bash
git add .
git commit -m "Initial commit: CRM WhatsApp"
git push -u origin main
```

### 3️⃣ Exponha o Servidor WPP API

**Opção A: NGROK (rápido, para testes)**
```bash
ngrok http 8787
```
Copie a URL: `https://abc123.ngrok.io`

**Opção B: Cloudflare Tunnel (mais estável)**
```bash
cloudflared tunnel run seu-tunnel
```

### 4️⃣ Deploy no Vercel

1. Vá para [vercel.com/new](https://vercel.com/new)
2. Clique em "Import Git Repository"
3. Selecione `abrava-crm-emailmkt`
4. Configure:
   - **Root Directory**: `abravacom-main`
   - **Build Command**: `cd crm && npm run build`
   - **Output Directory**: `crm/dist`

5. **Environment Variables** (adicionar):
   ```
   VITE_WPP_API_KEY = seu-secret
   VITE_WHATSAPP_API_URL = https://abc123.ngrok.io (ou seu tunnel)
   VITE_FIREBASE_API_KEY = (valor do Firebase)
   VITE_FIREBASE_AUTH_DOMAIN = seu-projeto.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID = seu-id
   VITE_FIREBASE_STORAGE_BUCKET = seu-bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID = seu-id
   VITE_FIREBASE_APP_ID = seu-app-id
   ```

6. Clique em **Deploy**

---

## ✅ Verificação

Após deploy:

- Acesse: `https://seu-projeto.vercel.app/crm/`
- QR code deve aparecer
- Scanear QR deve funcionar
- Mensagens devem enviar

---

## 📖 Documentação Completa

Veja `DEPLOY-VERCEL.md` para mais detalhes

---

## 🆘 Ajuda Rápida

| Problema | Solução |
|----------|---------|
| "CORS Error" | Verifique VITE_WHATSAPP_API_URL e CORS no server |
| "QR não carrega" | Teste localmente antes: http://localhost:3001/crm/ |
| "Firebase error" | Revise variáveis de ambiente no Vercel |
| "Build fails" | Execute `npm install --legacy-peer-deps` local |

---

**Dúvidas?** Veja `DEPLOY-VERCEL.md`
