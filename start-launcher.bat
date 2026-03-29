@echo off
color 0B
title Launcher - Frontend + WPP API Server
SETLOCAL enabledelayedexpansion

echo.
echo ════════════════════════════════════════════════════════════
echo 🚀 INICIADOR DUAL - CRM + WhatsApp API
echo ════════════════════════════════════════════════════════════
echo.

echo ⚙️  LIMPEZA DE PORTAS E PROCESSOS:
echo.

REM Kill any existing Node processes
echo [1/4] Encerrando processos Node antigos...
taskkill /IM node.exe /F >nul 2>&1
if !errorlevel! equ 0 (
    echo       ✓ Processos Node encerrados
) else (
    echo       ℹ️  Nenhum processo Node ativo
)

REM Kill any orphaned Chrome/Chromium processes
echo [2/4] Encerrando Chrome/Chromium órfão (Puppeteer)...
taskkill /IM chrome.exe /F >nul 2>&1
taskkill /IM chromium.exe /F >nul 2>&1
echo       ✓ Concluído

REM Kill by port 3001 (Frontend)
echo [3/4] Liberando porta 3001 (Frontend)...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr :3001 ^| findstr LISTENING') do (
    set PID=%%a
    if defined PID (
        echo       Processo encontrado (PID: !PID!)
        taskkill /PID !PID! /F /T >nul 2>&1
        echo       ✓ Removido
    )
)

REM Kill by port 8787 (WPP API)
echo [4/4] Liberando porta 8787 (WPP API)...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr :8787 ^| findstr LISTENING') do (
    set PID=%%a
    if defined PID (
        echo       Processo encontrado (PID: !PID!)
        taskkill /PID !PID! /F /T >nul 2>&1
        echo       ✓ Removido
    )
)

REM Wait for ports to be freed
echo.
echo ⏳ Aguardando liberação de portas (3 segundos)...
timeout /t 3 /nobreak >nul

echo.
echo ✓ Iniciando dois servidores em paralelo...
echo.
echo   1️⃣  Frontend (Vite) ................ http://localhost:3001
echo       └─ CRM com WhatsApp Sender
echo   2️⃣  WPP API (WhatsApp) ............ http://localhost:8787
echo       └─ Backend para envio de mensagens
echo.
echo ════════════════════════════════════════════════════════════
echo.

REM Start frontend (Vite) in new PowerShell window
echo 📂 Abrindo Terminal 1: Frontend...
start "🌐 Frontend CRM (3001)" powershell -NoExit -Command "Set-Location '%~dp0\abravacom-main'; Write-Host ''; Write-Host '════════════════════════════════════════════════════════════' -ForegroundColor Cyan; Write-Host '🌐 FRONTEND - CRM ABRAVACOM' -ForegroundColor Cyan; Write-Host '════════════════════════════════════════════════════════════' -ForegroundColor Cyan; Write-Host ''; Write-Host '📍 Acesso: http://localhost:3001' -ForegroundColor Green; Write-Host ''; if (Test-Path node_modules) { npm run dev } else { npm install; npm run dev }"

REM Start wpp-api-server in new PowerShell window
echo 📂 Abrindo Terminal 2: WPP API Server...
start "📱 WPP API Server (8787)" powershell -NoExit -Command "Set-Location '%~dp0\wpp-api-server'; Write-Host ''; Write-Host '════════════════════════════════════════════════════════════' -ForegroundColor Yellow; Write-Host '📱 WPP API SERVER - WhatsApp Integration' -ForegroundColor Yellow; Write-Host '════════════════════════════════════════════════════════════' -ForegroundColor Yellow; Write-Host ''; Write-Host '📍 Acesso: http://localhost:8787' -ForegroundColor Green; Write-Host '📍 Status: http://localhost:8787/status' -ForegroundColor Green; Write-Host '📍 QR Code: http://localhost:8787/qr' -ForegroundColor Green; Write-Host ''; Write-Host 'ℹ️  Use commands: npm run session:status, npm run session:clear, etc' -ForegroundColor Cyan; Write-Host ''; if (Test-Path node_modules) { npm run dev } else { npm install; npm run dev }"

echo.
echo ════════════════════════════════════════════════════════════
echo ✅ Dois servidores foram iniciados!
echo.
echo 📂 Abra dois novos terminais PowerShell:
echo    - Terminal 1: Frontend (Vite) - http://localhost:3001
echo    - Terminal 2: WPP API - http://localhost:8787
echo.
echo ⚠️  PRÓXIMOS PASSOS:
echo.
echo    1. Acesse http://localhost:3001 no navegador
echo    2. Se for primeira vez, escaneie QR code quando aparecer
echo    3. WPP API automaticamente conecta ao WhatsApp
echo    4. Comece a usar o CRM!
echo.
echo 💡 DICAS:
echo    - Não feche nenhuma das duas janelas
echo    - Se desconectar, a sessão será restaurada automaticamente
echo    - Para limpar sessão: npm run session:clear (no terminal WPP)
echo.
echo ════════════════════════════════════════════════════════════
echo.
echo ℹ️  Pressione qualquer tecla para finalizar este prompt...
pause

ENDLOCAL
