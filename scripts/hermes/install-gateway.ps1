# Install Hermes gateway as Windows Scheduled Task (auto-start on login)
# Usage: powershell -ExecutionPolicy Bypass -File scripts/hermes/install-gateway.ps1

$ErrorActionPreference = "Continue"
$HermesHome = "$env:LOCALAPPDATA\hermes"
$HermesExe = "$HermesHome\hermes-agent\.venv\Scripts\hermes.exe"
$env:HERMES_HOME = $HermesHome

if (-not (Test-Path $HermesExe)) {
  Write-Error "Hermes not found. Run: npm run hermes:setup"
}

Write-Host "Installing Hermes gateway autostart..." -ForegroundColor Cyan
$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$gatewayScript = Join-Path $RepoRoot "scripts\windows\start-hermes-gateway.ps1"

if (-not (Test-Path $gatewayScript)) {
  Write-Error "Missing $gatewayScript"
}

# Prefer native Hermes task when UAC allows; else user-level Windows task (no admin)
$nativeOk = $false
try {
  "n`nY`ny" | & $HermesExe gateway install --force 2>&1 | Out-Host
  $status = (& $HermesExe gateway status 2>&1 | Out-String).ToLower()
  if ($status -match "scheduled task" -or $status -match "installed") {
    $nativeOk = $true
    Write-Host "  Hermes native scheduled task OK" -ForegroundColor Green
  }
} catch {
  Write-Host "  native install skipped" -ForegroundColor DarkYellow
}

if (-not $nativeOk) {
  $action = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Minimized -File `"$gatewayScript`"" `
    -WorkingDirectory $RepoRoot
  $trigger = New-ScheduledTaskTrigger -AtLogOn
  $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
  Register-ScheduledTask -TaskName "ProducerHit-Hermes-Gateway" -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null
  Write-Host "  fallback task: ProducerHit-Hermes-Gateway (logon)" -ForegroundColor Green
}

Write-Host ""
& $HermesExe gateway status 2>&1
