# Power-shell script to aggressively clean Chrome profile errors
# Run this if you keep getting "Ocorreu um erro de perfil"

Write-Host "🔥 LIMPEZA AGRESSIVA - Resolvendo 'Erro de Perfil'" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# 1. Kill all Chrome/Node processes
Write-Host "[1/5] Matando todos os processos Chrome e Node..." -ForegroundColor Yellow
Get-Process chrome -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process chromium -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "      ✓ Concluído" -ForegroundColor Green

# 2. Clear cached data
Write-Host "[2/5] Limpando cache do Puppeteer..." -ForegroundColor Yellow
if (Test-Path ".wwebjs_cache") {
    Remove-Item -Path ".wwebjs_cache" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "      ✓ .wwebjs_cache removido" -ForegroundColor Green
}

# 3. Clear temporary directories
Write-Host "[3/5] Limpando diretórios temporários..." -ForegroundColor Yellow
$tempDirs = @(
    "$env:TEMP\puppeteer*",
    "$env:TEMP\chrome*",
    "$env:TEMP\.*wwebjs*"
)
foreach ($dir in $tempDirs) {
    Get-Item $dir -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
}
Write-Host "      ✓ Concluído" -ForegroundColor Green

# 4. Clear session (optional - uncomment to reset WhatsApp session)
Write-Host "[4/5] Opções de sessão:" -ForegroundColor Yellow
Write-Host "      • Sessão atual será mantida" -ForegroundColor Cyan
Write-Host "      • Se o erro persistir, execute: npm run session:clear" -ForegroundColor Cyan

# 5. Wait for cleanup
Write-Host "[5/5] Aguardando (2s)..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "✅ LIMPEZA CONCLUÍDA!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Cyan
Write-Host "  1. Execute: npm run dev" -ForegroundColor White
Write-Host "  2. Se o erro continuar:"  -ForegroundColor White
Write-Host "     npm run session:clear" -ForegroundColor White
Write-Host "     npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Se ainda tiver problemas, reinicie seu computador." -ForegroundColor Yellow
