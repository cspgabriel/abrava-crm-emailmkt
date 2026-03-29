@echo off
color 0A
title WPP API Server Standalone (Port: 8787) 
setlocal enabledelayedexpansion

echo.
echo ════════════════════════════════════════════════════════════
echo 🚀 WPP API SERVER - INICIALIZAÇÃO STANDALONE
echo ════════════════════════════════════════════════════════════
echo.

REM Encontra e mata qualquer processo Node já rodando na porta 8787
echo [1/4] Procurando por processos na porta 8787...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr :8787 ^| findstr LISTENING') do (
    set PID=%%a
    if defined PID (
        echo       ⚠️  Processo encontrado (PID: !PID!)
        taskkill /PID !PID! /F /T >nul 2>&1
        if !errorlevel! equ 0 (
            echo       ✓ Removido com sucesso
        ) else (
            echo       ⚠️  Não respondeu - continuando...
        )
    )
)

REM Aguarda limpeza do socket
echo [2/4] Aguardando limpeza de socket...
timeout /t 2 /nobreak >nul

REM Limpa arquivo de schedules antigo se existir
cd /d "%~dp0wpp-api-server"
if exist "schedules.json" (
    echo [3/4] Limpando schedules antigos...
    del schedules.json >nul 2>&1
    echo       ✓ Concluído
) else (
    echo [3/4] Verificando configuração...
    echo       ✓ Tudo pronto
)

REM Inicia o WPP API Server
echo [4/4] Iniciando servidor...
echo.
echo ════════════════════════════════════════════════════════════
echo 📱 WhatsApp API Server
echo 📍 URL:     http://localhost:8787
echo 📍 Status:  http://localhost:8787/status
echo 📍 QR Code: http://localhost:8787/qr
echo ════════════════════════════════════════════════════════════
echo.
echo ℹ️  INFORMAÇÕES IMPORTANTES:
echo.
echo ✓ Primeira vez: Escaneie o QR code com seu WhatsApp
echo ✓ Próximas vezes: Sessão será restaurada automaticamente
echo ✓ Não feche este terminal enquanto estiver usando
echo ✓ CRM acessa a API automaticamente via http://localhost:3001
echo.
echo 💡 Para gerenciar a sessão abra outro terminal em wpp-api-server/:
echo    npm run session:status   - Ver status
echo    npm run session:clear    - Limpar (força QR)
echo    npm run session:backup   - Fazer backup
echo    npm run session:restore  - Restaurar backup
echo.
echo ════════════════════════════════════════════════════════════
echo.

REM Tenta com npm run dev se estiver configurado
if exist "package.json" (
    npm run dev
) else (
    node server.js
)

REM Mantém janela aberta para ver logs
echo.
echo ════════════════════════════════════════════════════════════
echo [!] Servidor foi encerrado. Pressione qualquer tecla para fechar...
echo ════════════════════════════════════════════════════════════
pause
pause
