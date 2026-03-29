# 📋 Checklist Completo - Deploy Vercel

## ✅ Fase 1: Preparação Local (Sua Máquina)

- [ ] **Revisar código do CRM**
  - [ ] Botão "Atualizar Status" aparece apenas quando desconectado ✓
  - [ ] Instruções aparecem junto com o botão ✓
  - [ ] Poll automático a cada 2s (desconectado) e 5s (conectado) ✓
  - [ ] Instrutivo texto em português português português ✓

- [ ] **Testar localmente**
  ```bash
  cd abravacom-main\crm
  npm run dev
  # Abra http://localhost:3001/crm/ e teste tudo
  ```

- [ ] **Verificar build**
  ```bash
  npm run build
  npm run lint
  # Sem erros?
  ```

---

## ✅ Fase 2: Preparar Repositório GitHub

- [ ] **Executar script de prep**
  ```bash
  prepare-deploy.bat
  ```

- [ ] **Revisar estrutura**
  ```bash
  git status
  # Confirmar que node_modules/ está ignorado
  ```

- [ ] **Fazer commit e push**
  ```bash
  git add .
  git commit -m "Initial commit: CRM WhatsApp com Vite + React + Firebase"
  git push -u origin main
  ```

- [ ] **Verificar no GitHub**
  - [ ] Visite https://github.com/cspgabriel/abrava-crm-emailmkt
  - [ ] Confirme que vê a pasta `abravacom-main/`
  - [ ] Confirme que `node_modules/` não está lá

---

## ✅ Fase 3: Expor Servidor WPP API (Sua Máquina)

### Opção A: NGROK (Rápido, para Testes)

- [ ] **Download e instalação**
  ```bash
  # Baixar de https://ngrok.com/download
  ngrok http 8787
  ```

- [ ] **Copiar URL pública**
  - Você verá algo como: `https://abc123-def456.ngrok.io`
  - Salve esta URL (vai precisar no Vercel)

- [ ] **Manter rodando**
  - NGROK deve ficar aberto enquanto usar o app
  - A URL muda a cada 2 horas

### Opção B: Cloudflare Tunnel (Mais Estável)

- [ ] **Instalar Cloudflared**
  ```bash
  # Você já tem: cloudflared.exe
  ```

- [ ] **Criar tunnel**
  ```bash
  cloudflared tunnel run seu-crm
  ```

- [ ] **Configurar DNS**
  - Crie um CNAME apontando para seu tunnel
  - Exemplo: `wpp-api.seu-dominio.com`

---

## ✅ Fase 4: Configurar no Vercel

- [ ] **Acessar Vercel**
  - [ ] Vá para https://vercel.com
  - [ ] Faça login / crie conta (integrar com GitHub)

- [ ] **Importar repositório**
  - [ ] Clique em "New Project"
  - [ ] Selecione "Import Git Repository"
  - [ ] Procure por `abrava-crm-emailmkt`
  - [ ] Clique em Import

- [ ] **Configurar Build**
  - [ ] Root Directory: `abravacom-main`
  - [ ] Build Command: `cd crm && npm run build`
  - [ ] Output Directory: `crm/dist`
  - [ ] Node version: `20.x` (ou recente)

- [ ] **Adicionar Environment Variables**
  
  | Variável | Valor | Origem |
  |----------|-------|--------|
  | `VITE_WPP_API_KEY` | `seu-secret` | Mesmo que localhost |
  | `VITE_WHATSAPP_API_URL` | `https://abc123.ngrok.io` (ou seu tunnel) | NGROK/Tunnel |
  | `VITE_FIREBASE_API_KEY` | Copiar do Firebase | Firebase Console |
  | `VITE_FIREBASE_AUTH_DOMAIN` | `seu-projeto.firebaseapp.com` | Firebase Console |
  | `VITE_FIREBASE_PROJECT_ID` | `seu-projeto-id` | Firebase Console |
  | `VITE_FIREBASE_STORAGE_BUCKET` | `seu-projeto.appspot.com` | Firebase Console |
  | `VITE_FIREBASE_MESSAGING_SENDER_ID` | Seu ID | Firebase Console |
  | `VITE_FIREBASE_APP_ID` | Seu ID | Firebase Console |

  - [ ] Adicionar cada uma
  - [ ] Salvar

- [ ] **Deploy**
  - [ ] Clique em "Deploy Project"
  - [ ] Aguarde build completar (~3-5 minutos)
  - [ ] Você verá ✓ quando pronto

---

## ✅ Fase 5: Testar Produação (Vercel)

- [ ] **Acessar app**
  - [ ] URL: `https://seu-projeto.vercel.app/crm/`
  - [ ] Deve carregar sem erros

- [ ] **Testar QR Code**
  - [ ] QR deve aparecer
  - [ ] Scanear com WhatsApp deve conectar
  - [ ] Número deve aparecer como "✅ WhatsApp Conectado"

- [ ] **Testar Mensagens**
  - [ ] Enviar mensagem de teste
  - [ ] Deve aparecer no histórico
  - [ ] Firebase deve registrar

- [ ] **Testar Refresh**
  - [ ] Desconectar WhatsApp
  - [ ] QR reaparece automaticamente
  - [ ] Botão "Atualizar Status" aparece

---

## 🆘 Se Algo Der Errado

### Build falha
```bash
cd abravacom-main\crm
npm install --legacy-peer-deps
npm run build
```

### CORS error
- [ ] Verifique `VITE_WHATSAPP_API_URL` no Vercel
- [ ] Certifique-se que NGROK/Tunnel está rodando
- [ ] Teste em localhost primeiro

### Firebase não salva
- [ ] Verifique variáveis no Vercel
- [ ] Revise Firestore Rules (permitir acesso do Vercel)

### QR não carrega
- [ ] Teste em localhost: http://localhost:3001/crm/
- [ ] Verifique /Developer Tools → Network
- [ ] Verifique se server WPP API está rodando

### Servidor WPP API offline
```bash
cd wpp-api-server
npm start
```

---

## 📞 Suporte

| Docs | Link |
|------|------|
| Detalhado | DEPLOY-VERCEL.md |
| Rápido | DEPLOY-QUICK.md |
| Setup Inicial | Já fez ✓ |

---

## 🎉 Sucesso!

Quando tudo funciona:

1. App rodando em: `https://seu-projeto.vercel.app/crm/`
2. WPP API na sua máquina: `http://localhost:8787` (exposto via NGROK)
3. Firebase salvando dados automaticamente
4. Deploy automático a cada push no GitHub

---

**Status**: Pronto para deployment ✅
