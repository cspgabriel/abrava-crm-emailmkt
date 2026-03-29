@echo off
title Abravacom CRM - Inicio de Emergencia
echo 🚀 Iniciando Abravacom Hub em modo nativo...
echo.
cd launcher
call npm install
npx electron .
echo.
echo ✅ Hub aberto. Nao feche esta janela enquanto estiver usando o App.
pause
