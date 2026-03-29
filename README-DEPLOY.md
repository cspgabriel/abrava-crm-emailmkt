# 🚀 CRM WhatsApp - Deploy no Vercel

**Status**: ✅ Pronto para Deploy  
**Data**: Março 2026  
**Versão**: 1.0.0 Production Ready

---

## 📌 O Que É Este Projeto?

Um CRM (Customer Relationship Management) integrado com WhatsApp para:
- ✅ Enviar mensagens em massa via WhatsApp
- ✅ Agendar campanhas
- ✅ Rastrear histórico de envios
- ✅ Gerenciar contactos
- ✅ Monitorar quota de mensagens

---

## 🎯 Visão Geral do Deploy

```
Seu CRM (Frontend):          Servidor WhatsApp:
┌─────────────────┐         ┌──────────────────┐
│ Vercel (Cloud)  │ ◄────► │ Seu PC (Local)   │
│  React + Vite   │         │ Port 8787        │
│  (Interface)    │         │ (Session)        │
└─────────────────┘         └──────────────────┘
      ▲                               ▲
      │                               │
      └─ Firebase (Cloud) ────────────┘
         (Salva dados)
```

---

## 🚀 Começar Agora

### 1️⃣ Execute o Script de Preparação (5 min)
```bash
cd c:\Users\cspga\Downloads\abravacom-main
.\prepare-deploy.bat
```

Isso irá:
- ✅ Inicializar Git
- ✅ Instalar dependências
- ✅ Testar build
- ✅ Criare .gitignore

### 2️⃣ Faça Push no GitHub
```bash
git add .
git commit -m "Initial: CRM WhatsApp Production Ready"
git push -u origin main
```

### 3️⃣ Deploy no Vercel
1. Vá para https://vercel.com/new
2. Importe `abrava-crm-emailmkt`
3. Configure variáveis de ambiente
4. Clique "Deploy"

**Pronto!** 🎉

---

## 📚 Documentação

| Arquivo | Leia Quando... |
|---------|---|
| **DEPLOYMENT-SUMMARY.md** | Quer visão geral (3 min) |
| **DEPLOY-QUICK.md** | Quer começar rápido (5 min) |
| **DEPLOY-VERCEL.md** | Quer entender tudo (30 min) |
| **CHECKLIST-DEPLOYMENT.md** | Quer passo-a-passo (15 min) |
| **REPOSITORY-STRUCTURE.md** | Quer conhecer estrutura |
| **Este arquivo (README)** | Quer entender projeto |

---

## 🔑 Variáveis de Ambiente (Vercel)

| Variável | Valor |
|----------|-------|
| `VITE_WPP_API_KEY` | Seu secret |
| `VITE_WHATSAPP_API_URL` | `https://seu-ngrok.ngrok.io` |
| `VITE_FIREBASE_API_KEY` | (Firebase Console) |
| `VITE_FIREBASE_AUTH_DOMAIN` | seu-projeto.firebaseapp.com |
| `VITE_FIREBASE_PROJECT_ID` | seu-projeto-id |
| `VITE_FIREBASE_STORAGE_BUCKET` | seu-projeto.appspot.com |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | seu-sender-id |
| `VITE_FIREBASE_APP_ID` | seu-app-id |

---

## 🌐 Arquitetura

### Frontend (Vercel)
- React 18
- Vite (build rápido)
- Tailwind CSS (UI)
- TypeScript

### Backend WPP (Sua Máquina)
- Node.js + Express
- whatsapp-web.js (lib)
- Session persistence
- Port 8787

### Database (Firebase)
- Firestore (NoSQL)
- Real-time sync
- Histórico de envios

---

## ✅ Funcionalidades Implementadas

### Conexão WhatsApp
- [x] QR code scan
- [x] Session persistence
- [x] Auto-connect on startup
- [x] Disconnect function
- [x] Status monitoring (auto-refresh)

### Interface
- [x] Responsive design
- [x] Dark/Light mode ready
- [x] Português localizado
- [x] Emoji indicators
- [x] Loading states

### Envio de Mensagens
- [x] Single message
- [x] Bulk send with delay
- [x] Message formatting (bold, italic, code)
- [x] Template variables
- [x] Progress tracking

### Histórico & Quotas
- [x] Message history
- [x] Quota limits by chip type
- [x] Daily/weekly/monthly tracking
- [x] Firebase integration
- [x] Persistent storage

### UX Melhorias
- [x] Botão "Atualizar Status" (apenas quando desconectado)
- [x] Instruções ao lado do botão
- [x] Auto-refresh a cada 2-5 segundos
- [x] Visibilidade change detection
- [x] Conexão status em tempo real

---

## 🔄 Fluxo de Atualização

Após deploy inicial, para fazer atualizações:

```bash
# 1. Faça sua alteração no código
# 2. Teste localmente
# 3. Commit e push
git add .
git commit -m "Sua mensagem"
git push origin main
# 4. Vercel fará deploy automaticamente (3-5 min)
```

---

## 🆘 Troubleshooting

### QR code não aparece
```bash
# Teste localmente primeiro
cd abravacom-main\crm
npm run dev
# Abra http://localhost:3001/crm
```

### Mensagens não enviam
- [ ] Servidor WPP rodando? (`npm start` em wpp-api-server)
- [ ] NGROK/Tunnel exposto?
- [ ] Variável `VITE_WHATSAPP_API_URL` correta?

### Firebase não salva
- [ ] Variáveis Firebase corretas no Vercel?
- [ ] Rules permitem acesso?
- [ ] Projeto Firebase ativo?

### Build falha no Vercel
```bash
# Teste localmente
cd abravacom-main\crm
npm install --legacy-peer-deps
npm run build
```

---

## 📊 Tech Stack

```
Frontend:
  - React 18.2.0
  - Vite 6.2.0
  - TypeScript 5.8
  - Tailwind CSS 4.2
  - Lucide React (Icons)

Backend (Local):
  - Node.js 20+
  - Express
  - whatsapp-web.js
  - Firebase Admin SDK

Database:
  - Firebase Firestore
  - localStorage (cliente)

DevOps:
  - GitHub (Source)
  - Vercel (Frontend Deploy)
  - Firebase (Backend Data)
  - NGROK/Tunnel (Local Expose)
```

---

## 📁 Estrutura Principal

```
abravacom-main/
├── crm/                    # ← APP QUE SERÁ DEPLOYADO
│   ├── src/
│   │   ├── components/
│   │   │   └── WhatsAppSender.tsx  (Main Component)
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── dist/               # Build output
│   ├── package.json
│   └── vite.config.ts
│
├── wpp-api-server/         # ← RODA NA SUA MÁQUINA
│   ├── server.js
│   └── package.json
│
└── Documentação/
    ├── DEPLOY-VERCEL.md
    ├── CHECKLIST-DEPLOYMENT.md
    └── REPOSITORY-STRUCTURE.md
```

---

## 🎓 Guia de Primeiros Passos

### Requisitos
- [ ] Node.js 20+ instalado
- [ ] Git configurado
- [ ] Conta GitHub criada
- [ ] Conta Vercel criada (integra com GitHub)
- [ ] Firebase projeto criado

### Instalação Local
```bash
cd abravacom-main\crm
npm install --legacy-peer-deps
npm run dev
# Abra http://localhost:3001/crm
```

### Build
```bash
npm run build      # Gera /dist
npm run lint       # Verifica TypeScript
npm run preview    # Simula produção localmente
```

---

## 🚨 Importantes

⚠️ **Servidor WPP rodará sempre na sua máquina**
- Não será deployado no Vercel
- Precisa estar sempre rodando
- Expor via NGROK/Tunnel

⚠️ **Dados sensíveis em variáveis de ambiente**
- Nunca commit `.env`
- Use `.env.example` como template
- Configure no Vercel dashboard

⚠️ **CORS pode ser bloqueado**
- Certifique NGROK/Tunnel expõe corretamente
- Verificar CORS headers no servidor

---

## 🎯 Próximos Passos

1. [ ] Execute `prepare-deploy.bat`
2. [ ] Revise `git status`
3. [ ] Faça `git push` para GitHub
4. [ ] Configure Vercel com variáveis
5. [ ] Monitore o build
6. [ ] Teste a URL live

---

## 💬 Support

Para dúvidas:
- 📖 Leia a documentação em `.md` arquivos
- 🔍 Verifique console do navegador (F12)
- 📊 Verifique logs do Vercel dashboard
- 🐛 Teste localmente primeiro

---

## 📞 Contato

- GitHub: [https://github.com/cspgabriel/abrava-crm-emailmkt](https://github.com/cspgabriel/abrava-crm-emailmkt)
- Vercel: [https://vercel.com/dashboard](https://vercel.com/dashboard)
- Firebase: [https://console.firebase.google.com](https://console.firebase.google.com)

---

**Versão**: 1.0.0  
**Status**: Production Ready ✅  
**Última atualização**: Março 2026

🚀 **Está pronto? Execute `prepare-deploy.bat` para começar!**
