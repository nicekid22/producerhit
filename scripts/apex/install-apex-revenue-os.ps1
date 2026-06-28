# Apex Revenue OS - full install (Team 3)

$ErrorActionPreference = "Continue"
$RepoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent

Write-Host ""
Write-Host "APEX REVENUE OS - Team 3" -ForegroundColor Cyan
Write-Host "North Star: Weekly Net Revenue Growth"
Write-Host "Target: 100k MRR -> 1M MRR"
Write-Host ""

& powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "install-openclaw-team.ps1")
& powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "setup-hermes.ps1")

Write-Host ""
Write-Host "=== Start services ===" -ForegroundColor Green
Write-Host "  ollama serve"
Write-Host "  openclaw gateway --force"
Write-Host "  hermes gateway run"
Write-Host ""
Write-Host "=== Register crons ===" -ForegroundColor Green
Write-Host "  scripts\apex\register-cron-jobs.ps1"
Write-Host "  scripts\apex\register-hermes-crons.ps1"
