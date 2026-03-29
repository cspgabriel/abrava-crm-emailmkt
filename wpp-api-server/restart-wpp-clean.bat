@echo off
REM ========================================
REM  🚀 WPP API - Quick Restart with Cleanup
REM ========================================
REM  Este script mata o Chrome, limpa locks
REM  e reinicia o servidor WPP API
REM ========================================

echo.
echo ========================================
echo   Limpando processos Chrome...
echo ========================================
echo.

taskkill /F /IM chrome.exe /T 2>nul
taskkill /F /IM chromium.exe /T 2>nul

echo ✅ Processos mortos

echo.
echo Aguardando 2 segundos...
timeout /t 2 /nobreak

echo.
echo ========================================
echo   Iniciando WPP API Server...
echo ========================================
echo.

cd /d "%~dp0"
node server.js

pause
