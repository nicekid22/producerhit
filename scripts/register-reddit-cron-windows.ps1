# Enregistre une tache Windows : scout Reddit toutes les 20 min (quotas dans reddit-cron.mjs).
# Usage (PowerShell admin recommande) :
#   .\scripts\register-reddit-cron-windows.ps1
#   .\scripts\register-reddit-cron-windows.ps1 -Remove

param(
  [string]$TaskName = "ProducerHit-Reddit-Cron",
  [int]$IntervalMinutes = 20,
  [switch]$Remove
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$cmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $cmd) {
  Write-Error "Node.js introuvable - installe Node ou ajoute-le au PATH."
}
$node = $cmd.Source

$action = New-ScheduledTaskAction -Execute $node -Argument "--use-system-ca scripts/reddit-cron.mjs --run --post" -WorkingDirectory $repoRoot

if ($Remove) {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
  Write-Host "Tache supprimee : $TaskName"
  exit 0
}

$startAt = (Get-Date).AddMinutes(1)
$trigger = New-ScheduledTaskTrigger -Once -At $startAt -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes) -RepetitionDuration (New-TimeSpan -Days 3650)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -MultipleInstances IgnoreNew

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Description "ProducerHit Reddit scout + comment/post (quotas REDDIT_MAX_*)" -Force | Out-Null

Write-Host "OK - tache $TaskName toutes les $IntervalMinutes min."
Write-Host "Commande : node scripts/reddit-cron.mjs --run --post"
Write-Host "OAuth : REDDIT_* dans .env.local ou variables utilisateur Windows."
Write-Host "Quota : npm run reddit:cron:status"
Write-Host "Retirer : .\scripts\register-reddit-cron-windows.ps1 -Remove"
