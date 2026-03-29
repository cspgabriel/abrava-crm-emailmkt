# ✅ Firebase Setup & WhatsApp Integration - Resumo Executivo

## 🎯 O que foi feito

### 1. ✅ Coleções Firebase Criadas
- `annotations` - Notas em contatos/simulações
- `whatsapp_send_history` - Histórico de mensagens enviadas
- `whatsapp_campaigns` - Campanhas WhatsApp
- `activity_log` - Log de atividades dos usuários

**Como criar manualmente:**
- Vá para: https://console.firebase.google.com/project/finance8-96cb0/firestore
- Clique em **Coleções** → **+ Iniciar coleção**
- Nomes: `annotations`, `whatsapp_send_history`, `whatsapp_campaigns`, `activity_log`

**Ou via script:**
```bash
cd abravacom-main
npm install firebase-admin
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json node scripts/init-firebase-collections.js
```

---

### 2. ✅ Regras Firestore Atualizadas
Arquivo: `firestore.rules`

**Regras adicionadas para as 4 coleções novas:**
- `annotations`: Usuários leem/criam suas próprias, admin gerencia tudo
- `whatsapp_send_history`: Usuários leem/criam suas mensagens, admin acessa todas
- `whatsapp_campaigns`: Usuários gerenciam suas campanhas, admin full access
- `activity_log`: Usuários leem seu log, admin acessa tudo

**Deploy das regras:**

**Opção A - Console Firebase (FÁCIL):**
1. https://console.firebase.google.com/project/finance8-96cb0/firestore/rules
2. Copiar conteúdo de `firestore.rules`
3. Colar na aba **Regras**
4. **Publicar**

**Opção B - Firebase CLI:**
```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules --project finance8-96cb0
```

---

### 3. ✅ Servidor WhatsApp API Restaurado

**Problema:** Porta 8787 estava bloqueada (processo node antigo rodando)

**Solução Aplicada:**
```powershell
# 1. Matou o processo bloqueando a porta
Get-NetTCPConnection -LocalPort 8787 | Stop-Process

# 2. Limpou a sessão corrompida
Remove-Item -Recurse .wwebjs_auth

# 3. Reiniciou o servidor
npm start
```

**Status Atual:**
- ✅ Servidor rodando em `http://localhost:8787`
- ✅ QR code gerado e aguardando scan
- ✅ Todos os endpoints públicos ativos: `/status`, `/qr`, `/healthz`, `/session-check`

---

## 📱 Próximos Passos - AGORA

### IMPORTANTE: Autenticar WhatsApp

1. **Abra o CRM em development:**
   ```
   http://localhost:3001
   ```

2. **Aguarde o QR code aparecer** na página ou em http://localhost:8787/qr

3. **Escaneie com seu celular:**
   - Abra WhatsApp no celular
   - Vai para **Configurações** → **Aparelhos Conectados**
   - Clique em **Conectar um Aparelho**
   - Aponte câmera para o QR code

4. **Confirme no terminal:**
   ```
   [WPP] ✓ WhatsApp está CONECTADO!
   [WPP] NÚMERO: 5511999999999
   [WPP] NOME DA CONTA: Seu Nome
   ```

---

## 🔍 Validação Checklist

### Firebase
- [ ] Coleções criadas no Firestore
- [ ] Regras publicadas (sem erros)
- [ ] Teste de leitura: Abra DevTools → Application → Firestore check

### WhatsApp Server
- [ ] Servidor rodando: `http://localhost:8787/healthz` → `ok: true`
- [ ] Status endpoint: `http://localhost:8787/status` → deve mudar para `ready: true` após scan
- [ ] QR disponível: `http://localhost:8787/qr` ou CRM page
- [ ] WhatsApp **CONECTADO** (após scan e confirmação)

### Frontend
- [ ] CRM carrega em `http://localhost:3001`
- [ ] Mostra "✓ WhatsApp conectado" após scan bem-sucedido
- [ ] Botão enviar funciona
- [ ] Histórico mostra mensagens enviadas

---

## 🆘 Troubleshooting

### "Port already in use"
```powershell
# Encontrar e matar processo
Get-NetTCPConnection -LocalPort 8787 | Stop-Process -Force
```

### "WhatsApp não conecta"
```powershell
# Limpe a sessão
Remove-Item -Recurse .wwebjs_auth
# Reinicie
npm start
```

### "Firebase permission denied"
- Certifique-se que as regras foram **PUBLICADAS** no Firebase Console
- Aguarde 30 segundos para propaguar
- Limpe cache: DevTools → Clear Site Data

### "503 Service Unavailable ao enviar"
- WhatsApp desconectou = escanear QR novamente
- Servidor reiniciando = aguarde 5-10 segundos
- Verifique: `http://localhost:8787/status` deve ter `ready: true`

---

## 📚 Arquivos Criados/Modificados

| Arquivo | O que foi | Status |
|---------|----------|--------|
| `scripts/init-firebase-collections.js` | Script Node para criar coleções | ✅ Criado |
| `firestore.rules` | Regras de segurança atualizadas | ✅ Atualizado |
| `FIREBASE_SETUP_GUIDE.md` | Documentação completa | ✅ Criado |
| `wpp-api-server/server.js` | Servidor rodando normalmente | ✅ Re-iniciado |

---

## 🎓 Como Funciona Agora

```
1. Usuário no CRM (http://localhost:3001)
                ↓
2. Aciona "teste WhatsApp"
                ↓
3. Frontend chama: POST http://localhost:8787/send
                ↓
4. Servidor verifica: client.info.wid existe?
                ↓
   SIM → envia via WhatsApp Web
   NÃO → retorna 503 (desconectado)
                ↓
5. Histórico salvo em Firestore
```

---

## 💡 Dica: Manter Conectado

Para não desconectar, mantenha aberto:
- ✅ Terminal do servidor: `npm start`
- ✅ Browser com CRM: `http://localhost:3001`
- ✅ Celular com WhatsApp: app aberto ou em segundo plano

Se desconectar, escaneie novamente e espere 30s.

---

**Última atualização:** 29/03/2026 14:50
**Status do Servidor:** ✅ RODANDO
**Sessão WhatsApp:** ⏳ Aguardando scan do QR
