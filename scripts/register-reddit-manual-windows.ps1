# Enregistre une tache Windows : rapport Reddit manuel 2x/jour (sans OAuth).
# Usage :
#   .\scripts\register-reddit-manual-windows.ps1
#   .\scripts\register-reddit-manual-windows.ps1 -Remove

param(
  [string]$TaskName = "ProducerHit-Reddit-Manual",
  [switch]$Remove
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$cmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $cmd) {
  Write-Error "Node.js introuvable."
}
$node = $cmd.Source

$action = New-ScheduledTaskAction -Execute $node -Argument "--use-system-ca scripts/reddit-engagement-agent.mjs --open" -WorkingDirectory $repoRoot

if ($Remove) {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
  Write-Host "Tache supprimee : $TaskName"
  exit 0
}

$triggerMorning = New-ScheduledTaskTrigger -Daily -At "09:30"
$triggerEvening = New-ScheduledTaskTrigger -Daily -At "18:30"
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger @($triggerMorning, $triggerEvening) -Settings $settings -Description "ProducerHit Reddit mode manuel (rapport + onglets navigateur, sans OAuth)" -Force | Out-Null

Write-Host "OK - $TaskName : 9h30 + 18h30 → npm run reddit:manual"
Write-Host "Retirer : .\scripts\register-reddit-manual-windows.ps1 -Remove"
