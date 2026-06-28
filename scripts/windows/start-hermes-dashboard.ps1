$ErrorActionPreference = "Continue"
$HermesHome = Join-Path $env:LOCALAPPDATA "hermes"
$HermesExe = Join-Path $HermesHome "hermes-agent\.venv\Scripts\hermes.exe"
$RepoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$Fallback = Join-Path $RepoRoot "scripts\windows\hermes-dashboard-server.py"

Write-Host "=== HERMES DASHBOARD ===" -ForegroundColor Cyan
$env:HERMES_HOME = $HermesHome

# Try official dashboard first (needs web UI build)
if (Test-Path (Join-Path $HermesHome "hermes-agent\web\dist")) {
    Write-Host "Lancement dashboard officiel Hermes..." -ForegroundColor Green
    & $HermesExe dashboard --skip-build
    exit $LASTEXITCODE
}

Write-Host "UI web Hermes non compilee (npm/SSL). Dashboard local de secours sur :9119" -ForegroundColor Yellow
Start-Process "http://127.0.0.1:9119"
python $Fallback
