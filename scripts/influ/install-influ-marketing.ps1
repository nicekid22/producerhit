# INFLU Influencer Marketing — full install (Team 5)

$ErrorActionPreference = "Continue"
$RepoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent

Write-Host ""
Write-Host "INFLU INFLUENCER MARKETING - Team 5" -ForegroundColor Cyan
Write-Host "Mission: influencer partnerships -> paid conversions"
Write-Host ""

& powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "install-openclaw-team.ps1")
& powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "setup-hermes.ps1")

if (Test-Path "C:\Users\dylar\odysseus\venv\Scripts\python.exe") {
    Write-Host "Seeding Odysseus INFLU crew..." -ForegroundColor Yellow
    $env:ODYSSEUS_HOME = "C:\Users\dylar\odysseus"
    & "C:\Users\dylar\odysseus\venv\Scripts\python.exe" (Join-Path $PSScriptRoot "seed-influ-odysseus.py")
}

Write-Host ""
Write-Host "=== Register crons ===" -ForegroundColor Green
python (Join-Path $PSScriptRoot "register-cron-jobs-direct.py")
& powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "register-hermes-crons.ps1")

Write-Host ""
Write-Host "Done. Email: configure in Odysseus UI for autonomous sends." -ForegroundColor Green
