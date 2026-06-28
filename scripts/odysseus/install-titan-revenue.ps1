# TITAN Revenue Command — Odysseus install + seed

$ErrorActionPreference = "Stop"
$OdysseusHome = if ($env:ODYSSEUS_HOME) { $env:ODYSSEUS_HOME } else { "C:\Users\dylar\odysseus" }
$SeedScript = Join-Path $PSScriptRoot "seed-titan-team.py"
$VenvPy = Join-Path $OdysseusHome "venv\Scripts\python.exe"

Write-Host "=== TITAN Revenue Command (Odysseus Team 4) ===" -ForegroundColor Cyan
Write-Host "Odysseus home: $OdysseusHome"

if (-not (Test-Path $OdysseusHome)) {
    Write-Host "Cloning Odysseus..." -ForegroundColor Yellow
    git -c http.sslVerify=false clone --depth 1 https://github.com/pewdiepie-archdaemon/odysseus.git $OdysseusHome
}

Set-Location $OdysseusHome
$env:ODYSSEUS_ADMIN_USER = "admin"
$env:ODYSSEUS_ADMIN_PASSWORD = "TitanRev2026!"
$env:ODYSSEUS_SKIP_ADMIN_PROMPT = "1"

if (-not (Test-Path $VenvPy)) {
    Write-Host "Creating venv..." -ForegroundColor Yellow
    $pyExe = $null
    $pyArgs = @()
    if (Get-Command py -ErrorAction SilentlyContinue) {
        foreach ($v in @("-3.12", "-3.11")) {
            $out = & py $v -c "import sys; print(sys.version_info[:2] >= (3,11))" 2>$null
            if ($out -eq "True") { $pyExe = (Get-Command py).Source; $pyArgs = @($v); break }
        }
    }
    if (-not $pyExe) { $pyExe = (Get-Command python).Source }
    & $pyExe @pyArgs -m venv venv
}

$depsOk = & $VenvPy -c "import fastapi, httpx, bcrypt" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing deps (5-15 min)..." -ForegroundColor Yellow
    & $VenvPy -m pip install --upgrade pip -q --trusted-host pypi.org --trusted-host files.pythonhosted.org
    & $VenvPy -m pip install -r requirements.txt --trusted-host pypi.org --trusted-host files.pythonhosted.org
    if ($LASTEXITCODE -ne 0) { throw "pip install failed" }
}

Write-Host "Running setup.py..." -ForegroundColor Yellow
& $VenvPy setup.py
if ($LASTEXITCODE -ne 0) { throw "setup.py failed" }

$env:ODYSSEUS_HOME = $OdysseusHome
Write-Host "Seeding TITAN team..." -ForegroundColor Yellow
& $VenvPy $SeedScript
if ($LASTEXITCODE -ne 0) { throw "seed failed" }

Write-Host ""
Write-Host "=== Start Odysseus ===" -ForegroundColor Green
Write-Host "  cd $OdysseusHome"
Write-Host "  powershell -ExecutionPolicy Bypass -File .\launch-windows.ps1"
Write-Host ""
Write-Host "Login: admin / TitanRev2026!" -ForegroundColor Yellow
Write-Host "UI: http://127.0.0.1:7000" -ForegroundColor Green
