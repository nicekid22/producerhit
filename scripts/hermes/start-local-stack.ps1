# ProducerHit Hermes - local Ollama stack (install + configure + crons)
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/hermes/start-local-stack.ps1
#   powershell -ExecutionPolicy Bypass -File scripts/hermes/start-local-stack.ps1 -InstallAutostart

param(
  [switch]$InstallAutostart,
  [switch]$SkipMetrics
)

$ErrorActionPreference = "Continue"
$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$HermesHome = "$env:LOCALAPPDATA\hermes"
$HermesExe = "$HermesHome\hermes-agent\.venv\Scripts\hermes.exe"

Write-Host "=== ProducerHit Hermes local stack ===" -ForegroundColor Cyan

if (-not (Test-Path $HermesExe)) {
  Write-Host "Hermes absent. Install:" -ForegroundColor Red
  Write-Host '  iex (irm https://hermes-agent.nousresearch.com/install.ps1)'
  exit 1
}

try {
  $null = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -TimeoutSec 5
  Write-Host "Ollama OK" -ForegroundColor Green
} catch {
  Write-Host "Demarre Ollama dans un terminal separe:" -ForegroundColor Yellow
  Write-Host "  ollama serve"
  Write-Host "Ou: powershell -File scripts\windows\start-ollama.ps1"
  exit 1
}

& (Join-Path $PSScriptRoot "setup-ollama-models.ps1")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& (Join-Path $PSScriptRoot "bootstrap-producerhit-project.ps1")
& (Join-Path $PSScriptRoot "install-ceo-stack.ps1") -LeanOnly
& (Join-Path $PSScriptRoot "configure-ollama-multi-model.ps1") -SkipModelSetup

if (-not $SkipMetrics) {
  Push-Location $RepoRoot
  try { npm run hermes:metrics:sync 2>&1 } catch { Write-Host "metrics sync skip" -ForegroundColor DarkYellow }
  Pop-Location
}

& (Join-Path $PSScriptRoot "register-cron-jobs.ps1")
python (Join-Path $PSScriptRoot "pause-non-ph-crons.py")

if ($InstallAutostart) {
  & (Join-Path $PSScriptRoot "install-autostart.ps1")
} else {
  & (Join-Path $PSScriptRoot "install-gateway.ps1")
}

$workdir = Join-Path $HermesHome "projects\producerhit"
Write-Host ""
Write-Host "Gateway (laisser ouvert):" -ForegroundColor Green
Write-Host "  powershell -File scripts\windows\start-hermes-gateway.ps1"
Write-Host ""
Write-Host "CEO chat:" -ForegroundColor Green
Write-Host ('  hermes chat --workdir "' + $workdir + '"')
Write-Host "  /producerhit-ceo"
Write-Host ""
Write-Host "Health:" -ForegroundColor Cyan
Write-Host "  hermes doctor"
Write-Host "  hermes cron status"
Write-Host "  npm run hermes:verify"
