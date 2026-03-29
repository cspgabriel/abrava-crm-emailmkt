@echo off
REM Script para preparar o repositório para push no GitHub

setlocal enabledelayedexpansion

echo.
echo ================================================================================
echo  🚀 Preparador de Deploy - CRM WhatsApp para Vercel
echo ================================================================================
echo.

REM Verificar se está no diretório correto
if not exist "abravacom-main" (
    echo ❌ Erro: Execute este script no diretório raiz (c:\Users\cspga\Downloads\abravacom-main)
    exit /b 1
)

echo ✓ Estrutura do projeto detectada

REM Verificar git
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Erro: Git não está instalado ou não está no PATH
    exit /b 1
)

echo ✓ Git detectado

REM Inicializar repositório se necessário
if not exist ".git" (
    echo ⏳ Inicializando repositório Git...
    git init
    echo ✓ Repositório Git inicializado
)

REM Adicionar remote se não existir
git remote | findstr /i "origin" >nul 2>&1
if errorlevel 1 (
    echo ⏳ Adicionando remote GitHub...
    git remote add origin https://github.com/cspgabriel/abrava-crm-emailmkt.git
    echo ✓ Remote adicionado: https://github.com/cspgabriel/abrava-crm-emailmkt.git
) else (
    echo ✓ Remote já existe
)

REM Criar .gitignore se não existir
if not exist ".gitignore" (
    echo ⏳ Criando .gitignore...
    (
        echo node_modules/
        echo dist/
        echo .env
        echo .env.local
        echo .env.*.local
        echo .DS_Store
        echo .wwebjs_auth/
        echo *.log
        echo build_err.txt
        echo check_err.txt
        echo git_diff.txt
        echo git_log.txt
        echo git_status.txt
        echo temp.html
        echo .vscode/
    ) > .gitignore
    echo ✓ .gitignore criado
) else (
    echo ✓ .gitignore já existe
)

REM Instalar dependências do CRM
echo.
echo ⏳ Instalando dependências do CRM (isto pode levar alguns minutos)...
cd abravacom-main\crm
call npm install --legacy-peer-deps
if errorlevel 1 (
    echo ❌ Erro ao instalar dependências do CRM
    cd ..\..
    exit /b 1
)
echo ✓ Dependências do CRM instaladas
cd ..\..

REM Testar build
echo.
echo ⏳ Testando build do CRM...
cd abravacom-main\crm
call npm run build
if errorlevel 1 (
    echo ❌ Erro ao fazer build do CRM
    cd ..\..
    exit /b 1
)
echo ✓ Build do CRM funcionando
cd ..\..

REM Resumo
echo.
echo ================================================================================
echo  ✅ Preparação Concluída!
echo ================================================================================
echo.
echo Próximos passos:
echo.
echo 1. Revise os arquivos a serem enviados (verificar .gitignore)
echo    git status
echo.
echo 2. Configure credenciais Git (se não estiver configurado):
echo    git config --global user.email "seu@email.com"
echo    git config --global user.name "Seu Nome"
echo.
echo 3. Faça commit e push:
echo    git add .
echo    git commit -m "Initial commit: CRM WhatsApp com Vite + React + Firebase"
echo    git push -u origin main
echo.
echo 4. No Vercel (https://vercel.com/new):
echo    - Conecte seu repositório
echo    - Configure variáveis de ambiente:
echo      * VITE_WPP_API_KEY
echo      * VITE_WHATSAPP_API_URL (seu NGROK ou tunnel)
echo      * Suas variáveis Firebase
echo.
echo 5. Deploy será automático!
echo.
echo 📖 Para mais detalhes, veja: DEPLOY-VERCEL.md
echo.

pause
