# WhatsApp Web.js - Troubleshooting & Melhores Práticas

## Problema: "Execution context was destroyed"

Este é o erro mais comum ao usar `whatsapp-web.js`. Ocorre quando a página de autenticação do WhatsApp Web navega ou recarrega durante o processo de login.

### ✅ Melhorias Implementadas no server.js v2

1. **Timeouts Aumentados**
   - Puppeteer timeout: 60s (antes: 30s padrão)
   - Permite que a autenticação tenha mais tempo para completar

2. **Opções de Navegador Otimizadas**
   - `--disable-gpu-compositing`: Evita problemas de renderização
   - `--disable-hang-monitor`: Previne timeouts prematuros
   - `--enable-features=NetworkService`: Melhora de rede
   - Mais estável em ambientes restritos

3. **Retry Logic Aprimorado**
   - 8 tentativas (antes: infinito sem limite)
   - Backoff exponencial: 2s → 4s → 6s → ...
   - Melhor limpeza de estado entre tentativas

4. **Logging Melhorado**
   - Identifica tipo de erro
   - Mostra progresso de inicialização
   - Detecção de problemas específicos

---

## Como Usar os Novos Endpoints

### 1. Verificar Status da Sessão
```bash
curl http://localhost:8787/status
```
**Resposta:**
```json
{
  "ok": true,
  "ready": false,
  "info": null,
  "sessionPersisted": false,
  "hadPreviousSession": false
}
```

### 2. Verificar Existência de Sessão Persistida
```bash
curl http://localhost:8787/session-check
```
**Resposta:**
```json
{
  "ok": true,
  "sessionExists": true,
  "fileCount": 5,
  "initializing": false
}
```

### 3. Reconectar Manualmente
```bash
curl -X POST http://localhost:8787/reconnect
```
Use para forçar uma reconexão sem perder a sessão salva.

### 4. Logout Completo
```bash
curl -X POST http://localhost:8787/logout
```
Limpa TUDO e força um novo QR scan na próxima inicialização.

---

## Soluções Passo-a-Passo

### Cenário 1: Primeira Inicialização
```
WPP API server listening on port 8787
[WPP] Iniciando WhatsApp client (tentativa 1/8)...
[WPP] Aguardando inicializacao (pode levar até 60s)...
[WPP] QR RECEIVED
```

**O que fazer:**
1. Abra um navegador em `http://localhost:8787/qr`
2. Escaneie o código QR com seu phone
3. Aguarde até 60 segundos para completar a autenticação
4. Após sucesso, verá: `[WPP] ✓ Cliente inicializado com sucesso!`

### Cenário 2: Erro "Execution context was destroyed"
```
[WPP] ✗ Erro de navegação detectado. Limpando estado do navegador...
[WPP] Tentando novamente em 2s...
```

**Isso é NORMAL!** O server vai:
- Fechar o navegador completamente
- Esperar 2-4 segundos
- Tentar novamente com fresh state
- Continuar até 8 tentativas

**Se continuar falhando após 8 tentativas:**
1. ✅ Verifique sua conexão de internet
2. ✅ Tente `POST /reconnect`
3. ✅ Verifique se a sessão do WhatsApp Web está ativa no seu phone
4. ✅ Teste mudando para `WPP_HEADLESS=false` para debug visual

### Cenário 3: Sessão Desconectada
```
WhatsApp disconnected: Not connected!
[WPP] Reconexao agendada em 5s. Motivo: desconhecido
```

**O que fazer:**
1. **Tente reconectar:**
   ```bash
   curl -X POST http://localhost:8787/reconnect
   ```

2. **Verifique a sessão persistida:**
   ```bash
   curl http://localhost:8787/session-check
   ```

3. **Se `sessionExists: false`**, a sessão foi perdida. Logout e rescaneie:
   ```bash
   curl -X POST http://localhost:8787/logout
   ```

---

## Configurações de Ambiente

### `.env` Recomendado
```bash
PORT=8787
X_API_KEY=sua_chave_secreta_aqui
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,https://abravacom.com.br
WPP_HEADLESS=true
```

### Para Debug Visual (vê o navegador)
```bash
WPP_HEADLESS=false
```

---

## Cookies & Persistência de Sessão

### Localização dos Cookies
 **Linux/Mac:** `~/.wwebjs_auth/abravacom-wpp/`
 **Windows:** `C:\Users\<USER>\Downloads\abravacom-main\wpp-api-server\.wwebjs_auth\abravacom-wpp\`

### Arquivos Importantes
- `IndexedDB/` - Armazena estado da sessão
- `Local Storage/` - Cookies e tokens

### Problema: Cookies Expirados
Se a sessão for antiga (> 2 meses), o WhatsApp pode invalidá-la.

**Solução:**
```bash
curl -X POST http://localhost:8787/logout
```
Rescaneie o QR code.

---

## Ferramentas de Monitoramento

### Health Check Script
```bash
#!/bin/bash
while true; do
  STATUS=$(curl -s http://localhost:8787/status)
  READY=$(echo $STATUS | jq -r '.ready')
  if [ "$READY" = "true" ]; then
    echo "✓ WhatsApp conectado"
  else
    echo "✗ WhatsApp desconectado"
  fi
  sleep 30
done
```

### Test Send
```bash
curl -X POST http://localhost:8787/send \
  -H "X-API-Key: sua_chave" \
  -H "Content-Type: application/json" \
  -d '{"phone":"5511999999999","message":"teste"}'
```

---

## Performance & Recursos

### Requisitos Mínimos
- **RAM:** 512MB (recomendado 1GB+)
- **CPU:** 1 core mínimo
- **Storage:** 200MB para Chromium + session cache

### Flags Importantes no server.js
- `--disable-dev-shm-usage` - Evita problemas de memória em Docker
- `--no-sandbox` - Necessário em ambientes restritos
- `timeout: 60000` - 60 segundos para autenticação

---

## Próximas Etapas

1. **Inicie o servidor:**
   ```bash
   npm run dev
   ```

2. **Monitore os logs** procurando por:
   - `✓ Cliente inicializado com sucesso!`
   - `[WPP] Conta conectada:`

3. **Teste sua primeira mensagem:**
   ```bash
   curl -X POST http://localhost:8787/send \
     -H "X-API-Key: test123" \
     -H "Content-Type: application/json" \
     -d '{"phone":"5511999999999","message":"Teste WhatsApp Web.js"}'
   ```

---

## Referências

- [whatsapp-web.js Official](https://wwebjs.dev/)
- [Puppeteer Docs](https://pptr.dev/)
- [WhatsApp Web Automation Issues](https://github.com/pedroslopez/whatsapp-web.js/issues)

---

**Última Atualização:** 2026-03-29  
**Versão:** 2.0 (com melhorias de estabilidade)
