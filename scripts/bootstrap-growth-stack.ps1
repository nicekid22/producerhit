# Bootstrap ProducerHit growth stack (OpenClaw + Hermes)
# Usage: powershell -ExecutionPolicy Bypass -File scripts/bootstrap-growth-stack.ps1

$ErrorActionPreference = "Continue"
$Repo = "C:\Users\dylar\Documents\ProducerKit AI - Cursor 2"
$HermesExe = "$env:LOCALAPPDATA\hermes\hermes-agent\.venv\Scripts\hermes.exe"
$env:HERMES_HOME = "$env:LOCALAPPDATA\hermes"

Write-Host "=== ProducerHit Growth Stack Bootstrap ===" -ForegroundColor Cyan

# Ollama check
try {
    $null = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -TimeoutSec 5
    Write-Host "[OK] Ollama running" -ForegroundColor Green
} catch {
    Write-Host "[!!] Start Ollama: ollama serve" -ForegroundColor Yellow
}

# OpenClaw crons
Write-Host "`n--- OpenClaw crons ---" -ForegroundColor Yellow
& powershell -ExecutionPolicy Bypass -File "$Repo\scripts\openclaw\register-cron-jobs.ps1"

# Hermes setup + crons
if (Test-Path $HermesExe) {
    Write-Host "`n--- Hermes ---" -ForegroundColor Yellow
    & $HermesExe doctor 2>&1 | Select-Object -Last 8
    & powershell -ExecutionPolicy Bypass -File "$Repo\scripts\hermes\register-cron-jobs.ps1"
} else {
    Write-Host "[!!] Hermes not installed" -ForegroundColor Red
}

# Apex Revenue OS (Team 3)
Write-Host "`n--- Apex Revenue OS ---" -ForegroundColor Yellow
& powershell -ExecutionPolicy Bypass -File "$Repo\scripts\apex\install-apex-revenue-os.ps1"

Write-Host "`n=== Done ===" -ForegroundColor Green
