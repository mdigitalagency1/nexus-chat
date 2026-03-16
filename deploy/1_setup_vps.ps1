# ================================================================
#  NEXUS CHAT - Step 1: Install Everything
#  Server : 46.62.234.148 (Windows Server 2019)
#  Domain : zishanahamad.com
#  Run    : As Administrator in PowerShell
# ================================================================

$ErrorActionPreference = "Continue"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

function Write-Step($n, $msg) {
    Write-Host ""
    Write-Host "  [$n] $msg" -ForegroundColor Cyan
    Write-Host "  $("-" * 48)" -ForegroundColor DarkGray
}
function Write-OK($msg)   { Write-Host "      OK  $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "    WARN  $msg" -ForegroundColor Yellow }
function Write-Fail($msg) { Write-Host "    FAIL  $msg" -ForegroundColor Red }

Clear-Host
Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║     NEXUS CHAT - VPS SETUP                  ║" -ForegroundColor Cyan
Write-Host "  ║     46.62.234.148  |  zishanahamad.com      ║" -ForegroundColor Cyan
Write-Host "  ╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Installing: Node.js, MongoDB, Redis, nginx, PM2" -ForegroundColor Gray
Write-Host "  Estimated time: 10-15 minutes" -ForegroundColor Gray
Write-Host ""

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) { Write-Fail "Run as Administrator!"; exit 1 }
Write-OK "Running as Administrator"

Write-Step "1/8" "Chocolatey"
if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
    Set-ExecutionPolicy Bypass -Scope Process -Force
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
}
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
Write-OK "Chocolatey ready"

Write-Step "2/8" "Node.js 20 LTS"
choco install nodejs-lts --version=20.18.0 -y --no-progress 2>&1 | Out-Null
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
Write-OK "Node.js $(node --version 2>&1)"

Write-Step "3/8" "Git"
choco install git -y --no-progress 2>&1 | Out-Null
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
Write-OK "$(git --version 2>&1)"

Write-Step "4/8" "MongoDB 7"
choco install mongodb --version=7.0.5 -y --no-progress 2>&1 | Out-Null
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
New-Item -ItemType Directory -Force -Path "C:\data\db" | Out-Null
New-Item -ItemType Directory -Force -Path "C:\data\log" | Out-Null
$mongodExe = Get-ChildItem "C:\Program Files\MongoDB" -Recurse -Filter "mongod.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($mongodExe) {
    "systemLog:`n    destination: file`n    path: C:\data\log\mongod.log`n    logAppend: true`nstorage:`n    dbPath: C:\data\db`nnet:`n    bindIp: 127.0.0.1`n    port: 27017" | Out-File "C:\data\mongod.cfg" -Encoding ASCII
    & $mongodExe.FullName --config "C:\data\mongod.cfg" --install 2>&1 | Out-Null
    Start-Service MongoDB -ErrorAction SilentlyContinue
    Set-Service MongoDB -StartupType Automatic -ErrorAction SilentlyContinue
}
Write-OK "MongoDB installed"

Write-Step "5/8" "Redis"
choco install redis-64 -y --no-progress 2>&1 | Out-Null
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
Start-Service Redis -ErrorAction SilentlyContinue
Set-Service Redis -StartupType Automatic -ErrorAction SilentlyContinue
$pong = redis-cli ping 2>&1; if ($pong -eq "PONG") { Write-OK "Redis - PONG" } else { Write-Warn "Redis - run: redis-cli ping" }

Write-Step "6/8" "PM2"
npm install -g pm2 2>&1 | Out-Null
npm install -g pm2-windows-startup 2>&1 | Out-Null
pm2-startup install 2>&1 | Out-Null
Write-OK "PM2 $(pm2 --version 2>&1)"

Write-Step "7/8" "nginx"
choco install nginx -y --no-progress 2>&1 | Out-Null
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
Write-OK "nginx installed"

Write-Step "8/8" "Firewall rules"
@(@{Name="Nexus-HTTP ��rt=80},@{Name="Nexus-HTTPS";Port=443},@{Name="Nexus-API";Port=3001}) | ForEach-Object {
    netsh advfirewall firewall delete rule name=$($_.Name) 2>$null | Out-Null
    netsh advfirewall firewall add rule name=$($_.Name) dir=in action=allow protocol=TCP cynport=$($_.Port) | Out-Null; Write-OK "Port $($_.Port) opened"
}

Write-Host ""
Write-Host "  SETUP COMPLETE! Run .\2_deploy_nexus.ps1" -ForegroundColor Green
