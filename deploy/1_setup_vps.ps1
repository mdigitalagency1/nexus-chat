# ================================================================
#  NEXUS CHAT - Step 1: Install Everything
#  Windows Server 2019 | Run as Administrator in PowerShell
# ================================================================
#  HOW TO RUN:
#  1. RDP into VPS, open PowerShell as Administrator
#  2. Set-ExecutionPolicy RemoteSigned -Force
#  3. .\1_setup_vps.ps1
# ================================================================

$ErrorActionPreference = 'Continue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

function Write-Step($n, $msg) { Write-Host "" ; Write-Host "[$n] $msg" -ForegroundColor Cyan }
function Write-OK($msg)   { Write-Host "    OK: $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "  WARN: $msg" -ForegroundColor Yellow }

# Check Admin
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) { Write-Host 'Run as Administrator!' -ForegroundColor Red; exit 1 }
Write-OK 'Running as Administrator'

# 1. Chocolatey
Write-Step '1/8' 'Installing Chocolatey'
if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
    Set-ExecutionPolicy Bypass -Scope Process -Force
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
}
$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User')
Write-OK 'Chocolatey ready'

# 2. Node.js
Write-Step '2/8' 'Installing Node.js 20 LTS'
choco install nodejs-lts --version=20.18.0 -y --no-progress 2>&1 | Out-Null
$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User')
Write-OK "Node $(node --version) | npm $(npm --version)"

# 3. Git
Write-Step '3/8' 'Installing Git'
choco install git -y --no-progress 2>&1 | Out-Null
$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User')
Write-OK 'Git installed'

# 4. MongoDB
Write-Step '4/8' 'Installing MongoDB 7'
choco install mongodb --version=7.0.5 -y --no-progress 2>&1 | Out-Null
New-Item -ItemType Directory -Force -Path 'C:\data\db' | Out-Null
New-Item -ItemType Directory -Force -Path 'C:\data\log' | Out-Null
$mongodExe = Get-ChildItem 'C:\Program Files\MongoDB' -Recurse -Filter 'mongod.exe' -ErrorAction SilentlyContinue | Select-Object -First 1
if ($mongodExe) {
    "systemLog:
  destination: file
  path: C:\data\log\mongod.log
storage:
  dbPath: C:\data\db
net:
  bindIp: 127.0.0.1
  port: 27017" | Out-File 'C:\data\mongod.cfg' -Encoding ASCII
    & $mongodExe.FullName --config 'C:\data\mongod.cfg' --install 2>&1 | Out-Null
    Start-Service MongoDB -ErrorAction SilentlyContinue
    Set-Service MongoDB -StartupType Automatic -ErrorAction SilentlyContinue
}
Write-OK 'MongoDB installed'

# 5. Redis
Write-Step '5/8' 'Installing Redis'
choco install redis-64 -y --no-progress 2>&1 | Out-Null
$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User')
Start-Service Redis -ErrorAction SilentlyContinue
Set-Service Redis -StartupType Automatic -ErrorAction SilentlyContinue
Write-OK 'Redis installed'

# 6. PM2
Write-Step '6/8' 'Installing PM2'
npm install -g pm2 2>&1 | Out-Null
npm install -g pm2-windows-startup 2>&1 | Out-Null
pm2-startup install 2>&1 | Out-Null
Write-OK 'PM2 installed'

# 7. nginx
Write-Step '7/8' 'Installing nginx'
choco install nginx -y --no-progress 2>&1 | Out-Null
Write-OK 'nginx installed'

# 8. Firewall
Write-Step '8/8' 'Opening firewall ports'
@(80,443,3001) | ForEach-Object {
    netsh advfirewall firewall add rule name="Nexus-$_" dir=in action=allow protocol=TCP localport=$_ | Out-Null
    Write-OK "Port $_ opened"
}

Write-Host '' ; Write-Host '  SETUP COMPLETE! Run 2_deploy_nexus.ps1 next' -ForegroundColor Green
