# 🚀 Guia de Deploy no Vercel - CRM WhatsApp

## 📋 Pré-requisitos

1. **Repositório GitHub** criado: `https://github.com/cspgabriel/abrava-crm-emailmkt.git`
2. **Conta Vercel** conectada ao GitHub
3. **Servidor WPP API** rodando localmente na sua máquina (porta 8787)
4. **Firebase** configurado com credenciais
5. **Túnel/Exposição** da porta 8787 (NGROK, Cloudflare Tunnel, etc.)

## 🛠️ Estrutura do Projeto

Após fazer o push, seu repositório terá esta estrutura:
```
abrava-crm-emailmkt/
├── abravacom-main/
│   ├── crm/                    # App React/Vite para deploy
│   │   ├── src/
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   ├── .env.example        # Copiar e preencher
│   │   └── dist/               # Build output
│   └── ...
├── wpp-api-server/             # Rodará localmente (NÃO fazer deploy)
├── vercel-deploy.json          # Configuração Vercel (referência)
└── README.md
```

## 📦 Passo 1: Preparar o Repositório

### 1.1 Clone e configure git

```bash
cd c:\Users\cspga\Downloads\abravacom-main
git init
git remote add origin https://github.com/cspgabriel/abrava-crm-emailmkt.git
git branch -M main
```

### 1.2 Prepare .gitignore

Certifique-se de adicionar ao `.gitignore`:
```
node_modules/
dist/
.env
.env.local
.DS_Store
.wwebjs_auth/
*.log
build_err.txt
check_err.txt
```

### 1.3 Faça o primeiro push

```bash
git add .
git commit -m "Initial commit: CRM WhatsApp with Vite + React + Firebase"
git push -u origin main
```

## 🔑 Passo 2: Configurar Variáveis de Ambiente no Vercel

Após fazer push, conecte seu repositório no Vercel:

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Selecione seu repositório `abrava-crm-emailmkt`
3. Configure as variáveis de ambiente:

| Variável | Valor | Exemplo |
|----------|-------|---------|
| `VITE_WPP_API_KEY` | Sua chave API | `seu-secret-aqui` |
| `VITE_WHATSAPP_API_URL` | URL pública do WPP API | `https://seu-ngrok.ngrok.io` |
| `VITE_FIREBASE_API_KEY` | Firebase API Key | (copiar do Firebase Console) |
| `VITE_FIREBASE_AUTH_DOMAIN` | Seu projeto | `seu-projeto.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Project ID | `seu-projeto-id` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage bucket | `seu-projeto.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID | (copiar do Firebase) |
| `VITE_FIREBASE_APP_ID` | App ID | (copiar do Firebase) |

## 🌐 Passo 3: Expor o Servidor WPP API

Como o servidor WPP API continua rodando na sua máquina, você precisa expô-lo publicamente:

### Opção A: NGROK (Recomendado para testes)

```bash
ngrok http 8787
```

Copie a URL pública (ex: `https://abc123.ngrok.io`) e coloque em `VITE_WHATSAPP_API_URL` no Vercel.

### Opção B: Cloudflare Tunnel (Mais estável)

```bash
cloudflared tunnel run seu-tunnel-nome --url http://localhost:8787
```

Configure um subdomínio (ex: `wpp-api.seu-dominio.com`) e use em `VITE_WHATSAPP_API_URL`.

### Opção C: Usar Seu Domínio + Roteador

Configure port forwarding no seu roteador para expor a porta 8787 e criar um DNS dinâmico.

## 📤 Passo 4: Deploy Automático

Após configurar variáveis no Vercel:

1. O Vercel detectará automaticamente o `abrava-crm-emailmkt` no GitHub
2. Configure o build:
   - **Build Command**: `cd crm && npm run build` (ou deixar automático)
   - **Output Directory**: `crm/dist`
   - **Root Directory**: `abravacom-main` (se necessário)

3. Clique em "Deploy" — o Vercel fará o build automaticamente

## ✅ Verificação Pós-Deploy

Após o deploy:

1. **Acesse**: `https://seu-projeto.vercel.app/crm/`
2. **Verifique conexões**:
   - ✅ QR code aparece
   - ✅ Scanear QR conecta corretamente
   - ✅ Mensagens são enviadas via seu servidor WPP (porta 8787)
   - ✅ Firebase salva histórico

3. **Verifique variáveis**: No Vercel → Settings → Environment Variables

## 🔄 Atualizações Futuras

Sempre que fizer alterações no código:

```bash
git add .
git commit -m "Sua mensagem"
git push origin main
```

Vercel fará deploy automaticamente!

## 🆘 Troubleshooting

### "CORS error ao conectar no WhatsApp API"
- Verifique se `VITE_WHATSAPP_API_URL` está correto
- Certifique-se de que o servidor WPP API está exposto (NGROK/Tunnel)
- Verifique CORS no `wpp-api-server`

### "QR code não carrega"
- Teste em localhost primeiro: http://localhost:3001/crm/
- Verifique firewall/antivírus bloqueando requisições

### "Firebase não salva dados"
- Revise as variáveis Firebase no Vercel
- Verifique Firestore Rules (deve aceitar requisições do Vercel)

### "Erro ao fazer build"
```bash
cd abravacom-main/crm
npm install --legacy-peer-deps
npm run build
```

## 📚 Recursos

- [Vercel Docs](https://vercel.com/docs)
- [Vite Guide](https://vitejs.dev/)
- [React 18](https://react.dev/)
- [Firebase Web SDK](https://firebase.google.com/docs/web)
- [NGROK Documentation](https://ngrok.com/docs)

---

**Nota**: O servidor `wpp-api-server` continua rodando na sua máquina. Apenas o CRM é deployado no Vercel.
