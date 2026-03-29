@echo off
REM 🧪 Test Frontend-API Integration (Windows)

title Frontend-API Integration Tester

echo.
echo ========================================
echo  Frontend ^<-^> API Integration Tests
echo ========================================
echo.

echo [1] Testando API em localhost:8787
timeout /t 1 /nobreak

curl -v http://localhost:8787/status 2>&1 | findstr /E "^HTTP|^Access-Control|^{" | head -5

echo.
echo [2] Resultado esperado:
echo    - HTTP/1.1 200 OK (ou similar)
echo    - Access-Control-Allow-Origin header presente
echo    - JSON response com { "ready": true/false, "connectionState": ... }

echo.
echo [3] Se falhou, tente:
echo    a) Reiniciar o servidor: node wpp-api-server\server.js
echo    b) Limpar cache: Ctrl+Shift+Delete no navegador
echo    c) Modo incognito: Ctrl+Shift+N

pause
