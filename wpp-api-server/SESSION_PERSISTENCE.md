# 🔐 WhatsApp Session Persistence Guide

## ❌ Problema: "Por que preciso do QR code toda vez?"

### Causa Raiz

A sessão do WhatsApp **NÃO estava sendo persistida corretamente** entre reinicializações do servidor. Mesmo que os arquivos estivessem salvos em `.wwebjs_auth`, o código não estava:

1. **Detectando** se havia sessão prévia
2. **Tentando restaurar** a sessão antes de pedir QR novo
3. **Preservando** os arquivos de sessão durante o restart

### Solução Implementada

✅ **Melhorias no servidor (`server.js`)**:
- Detecta sessão existente antes de inicializar
- Tenta restaurar sessão na primeira tentativa
- Preserva arquivos de sessão automaticamente

✅ **Script de Gerenciamento** (`manage-session.js`):
- Visualizar status da sessão
- Limpar sessão manualmente
- Fazer backup/restore de sessões

---

## ✅ Como Funciona Agora

### Primeira Vez (Normal)
```
1. npm start
   ↓
2. Gera QR code
   ↓
3. Escaneie com WhatsApp
   ↓
4. ✅ Conectado!
   ↓
5. Sessão SALVA em: .wwebjs_auth/abravacon-wpp/
```

### Próximas Vezes (AUTOMÁTICO - Sem QR!)
```
1. npm start
   ↓
2. Detecta sessão anterior
   ↓
3. Restaura sessão (rápido!)
   ↓
4. ✅ Conectado!
   → NÃO precisa QR code! 🎉
```

---

## 🛠️ Comandos Práticos

### Status da Sessão
```bash
npm run session:status

# Output exemplo:
# 📊 Session Status:
# ✓ Auth directory exists: ✅ YES
# ✓ Session directory exists: ✅ YES
#   Session files: 47
#   Total size: 1234.56 KB
# 💡 Session Status: ✅ SESSION ACTIVE
```

### Limpar Sessão (Forçar QR novo)
```bash
npm run session:clear

# Próximo restart pedirá QR code
```

### Fazer Backup da Sessão
```bash
npm run session:backup

# Salva em: .wwebjs_backups/backup-2026-03-29T14-30-45-123Z/
```

### Restaurar de Backup
```bash
npm run session:restore

# Restaura do backup mais recente
```

---

## 📋 Checklist para Sucesso

- [ ] **Servidor iniciado**: `npm start` em `wpp-api-server/`
- [ ] **Primeira vez**: Escaneie QR quando aparecer
- [ ] **Confirmação**: Vê "✅ WhatsApp está CONECTADO!" no terminal
- [ ] **Próximas vezes**: Sessioné restaurada automaticamente (sem QR!)
- [ ] **Browser aberto**: `http://localhost:3001`
- [ ] **Celular com WhatsApp**: Aberto ou em segundo plano

---

## 🆘 Se Ainda Não Funcionar

### Sintoma: "Precisa QR toda vez"

**Testá a sessão:**
```bash
npm run session:status
```

**Se reportar "NO SESSION":**
```bash
# 1. Escaneie QR novamente
npm start

# 2. Aguarde até ver:
# ✅ WhatsApp está CONECTADO!

# 3. Verifique a sessão foi salva:
npm run session:status
# Deve mostrar: ✅ SESSION ACTIVE
```

### Sintoma: "Sessão fica vazia"

**Possíveis causas:**
1. Falta de permissões de escrita na pasta
2. Antivírus deletando arquivos
3. Disco cheio

**Solução:**
```bash
# Cheque espaço em disco
Get-Volume  # Windows
df -h       # Linux/Mac

# Faça backup e limpe
npm run session:backup
npm run session:clear
npm start  # Escaneie QR de novo
```

### Sintoma: "503 Service Unavailable ainda"

**Isso é diferente de precisar QR!** Significa:
- Sessão está conectada ✅
- Mas não consegue enviar mensagem ❌

**Soluções:**
```bash
# 1. Verifique conexão WhatsApp no celular
# Abra WhatsApp → Configurações → Aparelhos Conectados
# Deve mostrar "Este aparelho"

# 2. Se desconectou, reconecte:
npm run session:clear
npm start  # Escaneie QR novamente

# 3. Aguarde WhatsApp sincronizar (30-60s)
```

---

## 📁 Estrutura de Arquivos

```
wpp-api-server/
├── server.js                   # Servidor principal (corrigido)
├── manage-session.js           # Gerenciador de sessão (novo)
├── .wwebjs_auth/              # ← SESSÃO SALVA AQUI
│   └── abravacon-wpp/
│       └── Default/
│           └── Session Storage/  ← Cookies, dados da sessão
├── .wwebjs_backups/           # Backups de sessão (novo)
│   └── backup-2026-03-29T.../ 
├── .env.example               # Documentação atualizada
├── package.json               # Scripts adicionados
└── ...
```

---

## 🚀 Resumo da Melhoria

| Antes | Depois |
|-------|--------|
| ❌ Pedia QR toda vez | ✅ QR só primeira vez |
| ❌ Sessão perdia | ✅ Sessão persiste |
| ❌ Sem controle manual | ✅ Controle total (`manage-session.js`) |
| ❌ Sem backup | ✅ Backup automático |

---

## 💡 Dica: Monitorar Sessão

Mantém terminal aberto para ver logs:
```bash
npm start

# Procura por mensagens assim:
# ✅ WhatsApp está CONECTADO!        = Sessão restaurada
# [WPP] QR RECEIVED                  = Esperando scan
# Tipo de sessão: ✓ RESTAURADA       = Excelente!
```

---

## 📞 Suporte

Se continuar com problemas:

1. **Logs**: Cole os logs do terminal (`npm start`)
2. **Status**: Envie output de `npm run session:status`
3. **Console do Browser**: DevTools → Console (F12)
4. **WhatsApp**: Confirme "Aparelhos Conectados" no celular

---

**Última atualização:** 29/03/2026
**Status:** ✅ Sessão Persistence Implementado
