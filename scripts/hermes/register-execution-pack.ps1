# Register ProducerHit Execution Pack — metrics sync + extended Hermes crons
# Usage: powershell -ExecutionPolicy Bypass -File scripts/hermes/register-execution-pack.ps1

$ErrorActionPreference = "Continue"
$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

Write-Host "=== ProducerHit Execution Pack ===" -ForegroundColor Cyan

# 1. Install/sync skills + CEO bundle
$install = Join-Path $PSScriptRoot "install-ceo-stack.ps1"
if (Test-Path $install) {
  & $install -LeanOnly
}

# 2. Ollama multi-model
$configure = Join-Path $PSScriptRoot "configure-ollama-multi-model.ps1"
if (Test-Path $configure) {
  & $configure
}

# 3. Hermes project dirs + bootstrap
$bootstrap = Join-Path $PSScriptRoot "bootstrap-producerhit-project.ps1"
if (Test-Path $bootstrap) {
  & $bootstrap
}
$ProjectDir = "$env:LOCALAPPDATA\hermes\projects\producerhit"
$dirs = @(
  "$ProjectDir\metrics",
  "$ProjectDir\reports\daily",
  "$ProjectDir\memory"
)
foreach ($d in $dirs) {
  New-Item -ItemType Directory -Force -Path $d | Out-Null
  Write-Host "  dir $d" -ForegroundColor DarkGray
}

# 4. Metrics sync (needs .env + migration 077)
Write-Host ""
Write-Host "Syncing metrics..." -ForegroundColor Yellow
Push-Location $RepoRoot
try {
  npm run hermes:metrics:sync 2>&1
} catch {
  Write-Host "  metrics sync failed (apply migration 077 first)" -ForegroundColor DarkYellow
}
Pop-Location

# 5. Windows scheduled task — daily metrics 06:55
$taskName = "ProducerHit-Hermes-MetricsSync"
$npmCmd = Get-Command npm -ErrorAction SilentlyContinue
if ($npmCmd) {
  $npmPath = $npmCmd.Source
  $action = New-ScheduledTaskAction -Execute $npmPath -Argument "run hermes:metrics:sync" -WorkingDirectory $RepoRoot
  $trigger = New-ScheduledTaskTrigger -Daily -At "06:55"
  $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
  Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null
  Write-Host "  Scheduled task: $taskName (06:55 daily)" -ForegroundColor Green
} else {
  Write-Host "  npm not found — skip scheduled task" -ForegroundColor DarkYellow
}

# 6. Hermes crons (extended, Ollama-local)
$register = Join-Path $PSScriptRoot "register-cron-jobs.ps1"
if (Test-Path $register) {
  & $register
}
python (Join-Path $PSScriptRoot "pause-non-ph-crons.py") 2>&1

# 7. Gateway Windows task (cron scheduler 24/7)
$gateway = Join-Path $PSScriptRoot "install-gateway.ps1"
if (Test-Path $gateway) {
  & $gateway
}

Write-Host ""
Write-Host "Done. Read: scripts/hermes/EXECUTION-PACK.md" -ForegroundColor Green
Write-Host "CEO: hermes chat --workdir `"$ProjectDir`" → /producerhit-ceo"
