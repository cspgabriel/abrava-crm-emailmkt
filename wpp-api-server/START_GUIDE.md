# Iniciando o WPP API Server com Cleanup Automático

## 🚀 Forma Rápida (Recomendado)

### Do diretório raiz do projeto:
```bash
start-wpp-api.bat
```

Ou execute a partir de `wpp-api-server/`:
```bash
start.bat
```

## O que o .bat faz?

1. **Encontra processos na porta 8787** - Usa `netstat` para localizar qualquer Node.js rodando naquela porta
2. **Mata os processos antigos** - Força encerramento com `taskkill /F /T`
3. **Limpa processos Chrome órfãos** - Encerra qualquer instância de chrome.exe/chromium.exe deixada pelo Puppeteer
4. **Aguarda 2 segundos** - Tempo para o sistema liberar o socket da porta
5. **Inicia o servidor** - Executa `npm run dev` (ou `node server.js`)

## ❌ Se Still Getting "Already Running" Error

Você pode debugar manualmente:

```powershell
# Verificar qual processo está na porta 8787
netstat -ano | findstr :8787

# Matar processo específico (substitua XXXX pelo PID)
taskkill /PID XXXX /F /T

# Matar todos os chrome
taskkill /IM chrome.exe /F
taskkill /IM chromium.exe /F

# Listar processos Node
wmic process list brief /format:list | findstr node.exe
```

## 💡 Dica: Faça um Atalho no Desktop

1. Crie um atalho para `start-wpp-api.bat`
2. Clique direito > Propriedades
3. No campo "Iniciar em", coloque: `C:\Users\cspga\Downloads\abravacom-main`
4. Clique OK

Agora você pode dar duplo-clique no atalho do desktop para iniciar tudo automaticamente!

## 🔧 Para DevOps: Startup Automático

Se quiser que o WPP API inicie automaticamente na inicialização do Windows:

1. Pressione `Win + R` e digite: `shell:startup`
2. Crie um atalho para `start-wpp-api.bat` naquela pasta
3. Pronto! Será iniciado automaticamente quando Windows carregar

## 📝 Logs

Se algo der errado, o terminal mostrará os logs em tempo real. Você verá:
- Quando encontra processos antigos
- Quando mata processos
- Quando inicia o servidor
- Erros de inicialização (se houver)
