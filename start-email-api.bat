@echo off
title Email API Server
cd email-api-server
echo Instalando dependencias (se necessario)...
call npm install
echo Iniciando Servidor de Email na porta 8788...
npm start
pause
