# Register OpenClaw gateway as Windows logon task (optional 24/7)
# Run as Administrator once:
#   powershell -ExecutionPolicy Bypass -File scripts/openclaw/install-gateway-task.ps1

$ErrorActionPreference = "Stop"
$TaskName = "OpenClaw Gateway ProducerHit"
$GatewayCmd = "$env:USERPROFILE\.openclaw\gateway.cmd"

if (-not (Test-Path $GatewayCmd)) {
    Write-Error "Missing $GatewayCmd - run openclaw onboard first"
}

$action = New-ScheduledTaskAction -Execute $GatewayCmd -WorkingDirectory "$env:USERPROFILE\.openclaw"
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Description "OpenClaw gateway for ProducerHit marketing agents" -Force

Write-Host "Scheduled task '$TaskName' registered (runs at logon)." -ForegroundColor Green
Write-Host "Ensure Ollama also starts at logon or via separate task."
