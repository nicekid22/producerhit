# Register ProducerHit Hermes cron jobs (Ollama-local, idempotent)

# Requires: Hermes installed; gateway should run for scheduler tick



$ErrorActionPreference = "Continue"

$HermesHome = "$env:LOCALAPPDATA\hermes"

$HermesExe = "$HermesHome\hermes-agent\.venv\Scripts\hermes.exe"

$env:HERMES_HOME = $HermesHome



if (-not (Test-Path $HermesExe)) {

    Write-Error "Hermes not found at $HermesExe"

}



Write-Host "Registering ProducerHit Hermes crons (Ollama-local)..." -ForegroundColor Cyan



$direct = Join-Path $PSScriptRoot "register-cron-jobs-direct.py"

if (-not (Test-Path $direct)) {

    Write-Error "Missing $direct"

}



python $direct

if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }



Write-Host ""

Write-Host "Cron list:" -ForegroundColor Cyan

& $HermesExe cron list 2>&1

