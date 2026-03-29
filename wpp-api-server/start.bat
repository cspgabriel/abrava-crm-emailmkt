@echo off
color 0A
title WPP API Server (Port: 8787)
setlocal enabledelayedexpansion

echo.
echo ════════════════════════════════════════════════════════════
echo ██  ██████   ██████   ██   ██  ██████  ██████  ███████ ██   
echo ██  ██   ██ ██       ██   ██ ██      ██    ██ ██      ██   
echo ██  ██████  ██       ███████ ██      ██    ██ █████   ██   
echo ██  ██      ██       ██   ██ ██      ██    ██ ██           
echo ██  ██       ██████  ██   ██  ██████  ██████  ███████ ██   
echo ════════════════════════════════════════════════════════════
echo.
echo 🚀 WPP API SERVER - Limpeza Agressiva e Inicialização
echo.

REM Kill any existing Node process on port 8787
echo [1/7] Procurando por processos na porta 8787...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr :8787 ^| findstr LISTENING') do (
    set PID=%%a
    if defined PID (
        echo       ⚠️  Processo Windows encontrado (PID: !PID!)
        taskkill /PID !PID! /F /T >nul 2>&1
        echo       ✓ Removido com sucesso
    )
)

REM Kill any orphaned chrome/chromium processes from Puppeteer (agressivo)
echo [2/7] Limpando TODOS os processos Chrome/Chromium órfãos...
taskkill /IM chrome.exe /F /T >nul 2>&1
taskkill /IM chromium.exe /F /T >nul 2>&1
taskkill /IM chromedriver.exe /F >nul 2>&1
echo       ✓ Concluído

REM Kill Node processes that might be holding locks
echo [3/7] Limpando processos Node órfãos...
taskkill /IM node.exe /F /T >nul 2>&1
echo       ✓ Concluído

REM Aguarda limpeza de processos
echo [4/7] Aguardando liberação de processos (3s)...
timeout /t 3 /nobreak >nul

REM Clear corrupted cache files - IMPORTANT!
echo [5/7] Limpando cache do Chrome corrompido...
if exist ".wwebjs_cache" (
    echo       Removendo .wwebjs_cache...
    rmdir /S /Q ".wwebjs_cache" >nul 2>&1
    echo       ✓ Cache removido
)

REM Check session
echo [6/7] Verificando sessão WhatsApp...
if exist ".wwebjs_auth\session-abravacon-wpp" (
    echo       ✓ Sessão encontrada - será restaurada ao iniciar
) else (
    echo       ⚠️  Nenhuma sessão - QR code será necessário
)

echo [7/7] Iniciando servidor...
echo.
echo ════════════════════════════════════════════════════════════
echo 📍 Acesse em: http://localhost:8787
echo 📍 Status em: http://localhost:8787/status
echo 📍 QR Code em: http://localhost:8787/qr
echo ════════════════════════════════════════════════════════════
echo.
echo 💡 Comandos úteis:
echo    npm run session:status   - Ver status de sessão
echo    npm run session:clear    - Limpar sessão (força QR novo)
echo    npm run session:backup   - Fazer backup
echo.
echo 🔧 Se o erro "erro de perfil" persistir:
echo    1. Feche este script (Ctrl+C)
echo    2. Execute: npm run session:clear
echo    3. Execute: npm run dev
echo.

REM Start the server
npm run dev

REM Mantém janela aberta para ver logs
echo.
echo ════════════════════════════════════════════════════════════
echo [!] Servidor foi encerrado. Pressione qualquer tecla para fechar...
echo ════════════════════════════════════════════════════════════
pause
