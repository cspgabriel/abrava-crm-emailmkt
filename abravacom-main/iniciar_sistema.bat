@echo off
color 0B
title AGENCIAR - Sistema Completo
echo.
echo ════════════════════════════════════════════════════════════
echo ██████  ███████ ███████ ███████ ███   ███  █████  ██████   
echo ██   ██ ██      ██      ██      ████ ████ ██   ██ ██   ██  
echo ███████ █████   ███████ ████    ██ ███ ██ ███████ ██████   
echo ██      ██            ██ ██      ██     ██ ██   ██ ██   ██  
echo ██      ███████ ███████ ███████ ██     ██ ██   ██ ██   ██  
echo ════════════════════════════════════════════════════════════
echo.
echo 🚀 STARTUP DO ECOSSISTEMA AGENCIAR v2
echo.

REM Display access information
echo 📊 TUDO ONLINE! ACESSE SEUS PAINÉIS:
echo.
echo   📌 PAINEL PRINCIPAL GESTOR:
echo      └─ http://localhost:4002/portal.html
echo.
echo   🔗 LINKS DIRETOS ALTERNATIVOS:
echo      ├─ 🌐 SITE AGENCIAR:       http://localhost:3007
echo      ├─ 🗺️  EXTRATOR GMAPS:      http://localhost:4004/admin?tab=gmaps
echo      ├─ 🤖 WHATSAPP BOT:        http://localhost:4002
echo      ├─ 💼 CRM WEB:             http://localhost:4003
echo      └─ 📱 CRM + WHATSAPP:      http://localhost:3001 (+ 8787 API)
echo.
echo ════════════════════════════════════════════════════════════
echo.

echo ⚙️  SERVIDORES INICIANDO:
echo    ├─ AGENCIAR CRM Bot
echo    ├─ CRM Web Principal
echo    ├─ AGENIAR Site/App
echo    └─ Extrator GMAPS
echo.

echo 💡 INFORMAÇÕES IMPORTANTES:
echo.
echo    ✓ Sessão WhatsApp será restaurada automaticamente
echo    ✓ Se precisar fazer login novamente, será pedido QR code
echo    ✓ Mantenha este terminal aberto enquanto usar o sistema
echo    ✓ Use Ctrl+C UMA VEZ para parar tudo (graceful shutdown)
echo.

echo ⏱️  Iniciando em 2 segundos...
timeout /t 2 /nobreak >nul

echo ════════════════════════════════════════════════════════════
echo.

REM Start all services with concurrently
concurrently -k -n "AGENCIAR,CRM-WEB,RAIOX-SITE,EXTRATOR-GMAPS" -c "bgBlue.bold,bgGreen.bold,bgMagenta.bold,bgYellow.bold" "cd /d %~dp0whatsapp-web.js-main && node meu-bot.js" "cd /d %~dp0crm && npm run dev" "cd /d %~dp0agenciar-site-main && npm run dev" "cd /d %~dp0agenciar-site-main && npx vite --port 4004"

echo.
echo ════════════════════════════════════════════════════════════
echo ✅ Sistema encerrado. Pressione qualquer tecla para fechar...
echo ════════════════════════════════════════════════════════════
pause

