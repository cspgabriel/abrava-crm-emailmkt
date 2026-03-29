@echo off
echo ════════════════════════════════════════════════════════════
echo 🚀 CONSTRUINDO ABRAVACOM LAUNCHER v2.0
echo ════════════════════════════════════════════════════════════
echo.
echo 📦 1/3 Instalando dependências do Launcher...
cd launcher
call npm install
echo.
echo 🛠️  2/3 Criando o executável (.exe)...
call npm run build
echo.
echo ✅ 3/3 Build concluído! 
echo.
echo 📂 Verifique a pasta: /launcher/dist/Abravacom Launcher.exe
echo ════════════════════════════════════════════════════════════
pause
