# NEXUS CHAT - Update Script
# Run after pushing new code to GitHub
$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User')
Write-Host 'Updating Nexus Chat...' -ForegroundColor Cyan
Set-Location C:\nexus-chat
git pull origin main
Set-Location C:\nexus-chat\backend
npm install --omit=dev 2>&1 | Out-Null
pm2 reload nexus-chat
pm2 save
Start-Sleep -Seconds 4
try { $r = Invoke-WebRequest -Uri 'http://localhost:3001/health' -UseBasicParsing; Write-Host 'Health:' $r.Content -ForegroundColor Green } catch { Write-Host 'Check: pm2 logs nexus-chat' -ForegroundColor Yellow }
pm2 status
Write-Host 'Done! https://api.zishanahamad.com/health' -ForegroundColor Green
