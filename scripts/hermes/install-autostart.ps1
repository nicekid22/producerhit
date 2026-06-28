# Windows autostart — Ollama + Hermes gateway at user logon
# Usage: powershell -ExecutionPolicy Bypass -File scripts/hermes/install-autostart.ps1

$ErrorActionPreference = "Continue"
$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$HermesHome = "$env:LOCALAPPDATA\hermes"
$HermesExe = "$HermesHome\hermes-agent\.venv\Scripts\hermes.exe"
$env:HERMES_HOME = $HermesHome

$ollamaScript = Join-Path $RepoRoot "scripts\windows\start-ollama.ps1"
if (-not (Test-Path $ollamaScript)) { Write-Error "Missing $ollamaScript" }

function Register-LogonTask($Name, $ScriptPath) {
  $action = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Minimized -File `"$ScriptPath`"" `
    -WorkingDirectory $RepoRoot
  $trigger = New-ScheduledTaskTrigger -AtLogOn
  $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
  Register-ScheduledTask -TaskName $Name -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null
  Write-Host "  task: $Name" -ForegroundColor Green
}

Write-Host "Registering autostart..." -ForegroundColor Cyan
Register-LogonTask "ProducerHit-Ollama" $ollamaScript

if (Test-Path $HermesExe) {
  & (Join-Path $PSScriptRoot "install-gateway.ps1")
} else {
  Write-Host "  skip gateway (Hermes missing)" -ForegroundColor DarkYellow
}

Write-Host "Done. Reconnecte Windows ou lance: hermes gateway run" -ForegroundColor Green
