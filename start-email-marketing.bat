@echo off
color 0B
title Abrir Email Marketing - CRM

echo Abrindo a página de Email Marketing (CRM) no navegador...

REM URL do CRM - ajuste porta se necessário
set CRM_URL=http://localhost:3001/crm

REM Aguarda um breve instante para permitir que o frontend suba
timeout /t 1 /nobreak >nul

start "🔔 Abrir CRM - Email Marketing" "%CRM_URL%"

echo Página aberta: %CRM_URL%
pause
