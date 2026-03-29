Get-WmiObject Win32_Process -Filter "name='chrome.exe'" | Where-Object {$_.CommandLine -match '\.whatsapp_profile|whatsapp_extract'} | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Get-Process chromedriver -ErrorAction SilentlyContinue | Stop-Process -Force
