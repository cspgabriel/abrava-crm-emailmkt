@echo off
setlocal enabledelayedexpansion

echo.
echo ════════════════════════════════════════════════════════════
echo 🚀 DEPLOY PARA GITHUB - AbravaCom CRM + Site
echo ════════════════════════════════════════════════════════════
echo.

set REPO_URL=https://github.com/cspgabriel/abrava-crm-emailmkt.git
set GITHUB_TOKEN=%GITHUB_TOKEN%

if "%GITHUB_TOKEN%"=="" (
    echo ⚠️  VARIÁVEL GITHUB_TOKEN não configurada!
    echo    Execute primeiro: set GITHUB_TOKEN=seu_token_aqui
    echo.
    echo Continuando com deploy HTTPS (pode pedir senha)...
    echo.
)

cd /d "%~dp0abravacom-main"

echo [1/5] Limpando build anterior...
if exist "dist" rmdir /s /q "dist" >nul 2>&1
if exist ".vite_cache" rmdir /s /q ".vite_cache" >nul 2>&1
echo       ✓ Concluído

echo [2/5] Instalando dependências...
call npm install --legacy-peer-deps
if errorlevel 1 (
    echo       ❌ Erro ao instalar dependências
    exit /b 1
)
echo       ✓ Concluído

echo [3/5] Compilando aplicação (Build de Produção)...
call npm run build
if errorlevel 1 (
    echo       ❌ Erro ao compilar
    exit /b 1
)
echo       ✓ Concluído

echo [4/5] Configurando repositório Git...

REM Check if repo is already initialized
if not exist ".git" (
    git init
    git config user.email "deploy@actions"
    git config user.name "GitHub Actions Deploy"
    git branch -M main
)

REM Setup remote
git remote remove origin >nul 2>&1
git remote add origin %REPO_URL%

echo       ✓ Repositório configurado

echo [5/5] Fazendo push para GitHub...
git add -A
git commit -m "🚀 Deploy automático: Build de produção com site + CRM"
if errorlevel 1 (
    echo       ⚠️  Nenhuma mudança para commit ou erro ao fazer commit
)

git push -u origin main --force
if errorlevel 1 (
    echo       ❌ Erro ao fazer push
    echo       Verifique:
    echo       1. Token GitHub válido
    echo       2. Permissões no repositório
    echo       3. Conexão de internet
    exit /b 1
)

echo       ✓ Push realizado com sucesso!

echo.
echo ════════════════════════════════════════════════════════════
echo ✅ DEPLOY CONCLUÍDO COM SUCESSO!
echo ════════════════════════════════════════════════════════════
echo.
echo 📍 Repositório: %REPO_URL%
echo 📂 Branch: main
echo 🌐 URL: https://github.com/cspgabriel/abrava-crm-emailmkt
echo.
echo Próximas etapas:
echo  1. Verificar no GitHub: https://github.com/cspgabriel/abrava-crm-emailmkt
echo  2. Configurar GitHub Pages (Settings → Pages → Deploy from branch)
echo  3. Ou usar CI/CD (GitHub Actions) para deploy em produção
echo.
pause
