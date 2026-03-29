@echo off
echo 🚀 STARTING CLEAN HUB BUILD...
taskkill /f /im "abravacom-launcher.exe" /t
taskkill /f /im "abravacom-hub.exe" /t
taskkill /f /im "Electron.exe" /t
taskkill /f /im "node.exe" /t
timeout /t 3 /nobreak
cd launcher
call npm run build
cd ..
echo ✅ Build complete in /launcher/dist-new/win-unpacked/
pause
