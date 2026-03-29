@echo off
echo Building CRM Cloud App...
cd abravacom-crm-cloud
npm install && npm run build
echo.
echo Build complete. Checking for installer...
if exist "dist\CRM Abravacom Setup 1.0.0.exe" (
  copy "dist\CRM Abravacom Setup 1.0.0.exe" "..\CRM Abravacom Nuvem.exe"
  echo.
  echo [SUCCESS] Installer is ready at: CRM Abravacom Nuvem.exe
) else (
  echo [ERROR] Build failed or output name changed. Check "abravacom-crm-cloud\dist" folder.
)
pause
