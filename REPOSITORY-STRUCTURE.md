# 📁 Estrutura do Repositório para GitHub

## Resumo

O repositório que será enviado para GitHub terá a seguinte estrutura:

```
abrava-crm-emailmkt/
│
├── .git/                          # Git metadata
├── .gitignore                     # ✅ Criado
├── .env.example                   # ✅ Criado (template de variáveis)
│
├── abravacom-main/                # Pasta principal do projeto
│   │
│   ├── crm/                       # 🎯 APP REACT QUE SERÁ DEPLOYADO
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   └── WhatsAppSender.tsx  # ✅ Atualizado (botão condicional + auto-refresh)
│   │   │   ├── App.tsx
│   │   │   ├── index.tsx
│   │   │   └── ...
│   │   ├── dist/                  # Output do build (gerado no Vercel)
│   │   ├── package.json           # Dependencies do CRM
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   ├── postcss.config.js
│   │   ├── .env.example           # ✅ Atualizado com instruções claras
│   │   └── index.html
│   │
│   ├── wpp-api-server/            # ⚠️ NÃO SERÁ DEPLOYADO (rodará na sua máquina)
│   │   ├── server.js
│   │   ├── manage-session.js
│   │   ├── package.json
│   │   └── .env.example
│   │
│   ├── components/                # Componentes antigos (podem ser removidos)
│   ├── pages/
│   ├── public/
│   ├── scripts/
│   ├── utils/
│   ├── data/
│   ├── google-ads-python-main/    # (pode ser removido - não é usado)
│   ├── crm/                       # (duplicado? pode revisar)
│   │
│   ├── package.json               # Raiz (pode remover)
│   ├── vite.config.ts             # Raiz (pode remover)
│   ├── tsconfig.json              # Raiz (pode remover)
│   ├── .env.example               # Raiz (pode remover)
│   │
│   ├── README.md
│   ├── FIREBASE_SETUP_GUIDE.md
│   ├── DB-SCHEMA.md
│   ├── firestore.rules
│   └── ... mais arquivos
│
├── launcher/                      # Launcher Electron (pode remover - não é usado em produção)
├── whatsapp-web.js-main/          # Dependência (não é usada - pode remover)
│
├── DEPLOY-VERCEL.md               # ✅ Criado (guia completo)
├── DEPLOY-QUICK.md                # ✅ Criado (guia rápido)
├── CHECKLIST-DEPLOYMENT.md        # ✅ Criado (checklist)
├── README-DEPLOYMENT.md           # ✅ Pode ser criado
│
├── prepare-deploy.bat             # ✅ Script para preparar deploy
├── start-launcher.bat             # Launcher (local)
├── start-wpp-api.bat              # WPP API starter (local)
│
└── vercel-deploy.json             # ✅ Configuração Vercel (referência)
```

---

## ✅ O que será enviado para GitHub

```
abravacom-main/
├── crm/                       # ← ISSO vai pro Vercel
│   ├── src/
│   ├── dist/                  # Gerado no Vercel
│   ├── package.json
│   ├── .env.example           # ✅ Atualizado
│   └── ...
│
├── wpp-api-server/            # ← NÃO vai pro Vercel (rodará na sua máquina)
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
└── ... outros arquivos (README, docs, etc.)
```

---

## ⚠️ Arquivos que PODEM ser removidos do repositório

Para deixar o repositório mais limpo, você pode remover:

- `/launcher/` - Launcher Electron (não é usado em produção)
- `/whatsapp-web.js-main/` - Cópia do lib original (não necessário)
- `/google-ads-python-main/` - Código de exemplo (não é usado)
- Arquivos `*.py`, `*.mjs`, `*.cjs` soltos na raiz
- Arquivos de teste temporários

**Mas não é obrigatório** — o `.gitignore` já ignora os principais coisas (node_modules, dist, .env, etc.).

---

## 🚀 Como o Vercel vai fazer build

1. Detecta: `abravacom-main/` como raiz
2. Encontra: `crm/package.json`
3. Executa: `cd crm && npm run build`
4. Gera: `crm/dist/` (arquivo estático)
5. Deploy: Para `https://seu-projeto.vercel.app/`

---

## 📝 Configuração do Vercel (dashboard)

```yaml
Root Directory: abravacom-main
Build Command: cd crm && npm run build
Output Directory: crm/dist

Environment Variables:
  VITE_WPP_API_KEY: seu-secret
  VITE_WHATSAPP_API_URL: https://seu-ngrok.ngrok.io
  VITE_FIREBASE_*: suas-credenciais
```

---

## 📦 Tamanho Estimado do Push

- **Sem node_modules**: ~50-100 MB
- **Com dependências resolvidas**: Vercel instala no build
- **Tempo de build**: ~3-5 minutos

---

## ✅ Próximas Ações

1. **Execute**: `prepare-deploy.bat`
2. **Review**: `git status` (verificar o que será enviado)
3. **Push**: 
   ```bash
   git add .
   git commit -m "Initial commit: CRM WhatsApp"
   git push -u origin main
   ```
4. **Vercel**: Importar repositório e configurar

---

## 📖 Documentação Criada

| Arquivo | Propósito |
|---------|-----------|
| `.gitignore` | Ignorar node_modules, .env, dist, etc. |
| `.env.example` | Template de variáveis |
| `DEPLOY-VERCEL.md` | Guia completo (30min leitura) |
| `DEPLOY-QUICK.md` | Guia rápido (5min) |
| `CHECKLIST-DEPLOYMENT.md` | Checklist passo-a-passo |
| `prepare-deploy.bat` | Script automático de prep |

---

**Status**: Pronto para enviar para GitHub ✅
