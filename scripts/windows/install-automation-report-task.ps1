# Installe une tache planifiee Windows - rapport automation toutes les 6 h + a la connexion
param(
    [int]$IntervalHours = 6
)

$ErrorActionPreference = "Stop"
$Repo = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$TaskName = "ProducerHit-Automation-Report"
$Node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $Node) { throw "node introuvable dans PATH" }

$Action = New-ScheduledTaskAction -Execute $Node -Argument "scripts/automation-report.mjs" -WorkingDirectory $Repo
$TriggerBoot = New-ScheduledTaskTrigger -AtLogOn
$TriggerRepeat = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(2) -RepetitionInterval (New-TimeSpan -Hours $IntervalHours) -RepetitionDuration (New-TimeSpan -Days 3650)
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 1)

Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger @($TriggerBoot, $TriggerRepeat) -Settings $Settings -Description "Rapport ProducerHit YouTube cron queue agents" | Out-Null

Write-Host "Tache $TaskName installee - toutes les ${IntervalHours}h + a la connexion." -ForegroundColor Green
Write-Host "Webhook: AUTOMATION_REPORT_WEBHOOK ou OPENCLAW_REPORT_WEBHOOK dans .env" -ForegroundColor Yellow
