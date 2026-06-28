# Stop all non-essential agent background processes (Windows)
# Keeps: Ollama (ProducerHit generation), single Hermes after restart script

$ErrorActionPreference = "SilentlyContinue"

function Stop-ByPort($port, $label) {
    $lines = netstat -ano | Select-String ":$port\s.*LISTENING"
    foreach ($line in $lines) {
        $procId = ($line -split '\s+')[-1]
        if ($procId -match '^\d+$' -and $procId -ne '0') {
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            Write-Host "[STOP] $label (port $port, PID $procId)" -ForegroundColor Yellow
        }
    }
}

Write-Host "=== Stop agent noise ===" -ForegroundColor Cyan

# YouTube catch-up / daily local
Get-CimInstance Win32_Process -Filter "name='node.exe'" | Where-Object {
    $_.CommandLine -match 'youtube-daily-run'
} | ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force
    Write-Host "[STOP] youtube-daily PID $($_.ProcessId)" -ForegroundColor Yellow
}

# Hermes dashboard (port 9119 — separate from gateway)
Get-CimInstance Win32_Process -Filter "name='python.exe'" | Where-Object {
    $_.CommandLine -match 'hermes.*dashboard|web_server'
} | ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force
    Write-Host "[STOP] hermes dashboard PID $($_.ProcessId)" -ForegroundColor Yellow
}
Stop-ByPort 9119 "Hermes dashboard"

# Odysseus (crons paused — optional UI only)
Stop-ByPort 7000 "Odysseus"

# Odysseus launcher windows (crons paused — not needed)
Get-CimInstance Win32_Process -Filter "name='powershell.exe'" | Where-Object {
    $_.CommandLine -match 'odysseus|openclaw gateway'
} | ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force
    Write-Host "[STOP] agent shell PID $($_.ProcessId)" -ForegroundColor Yellow
}

# All Hermes gateways (clean restart next)
Get-Process -Name hermes -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.Id -Force
    Write-Host "[STOP] hermes PID $($_.Id)" -ForegroundColor Yellow
}
Get-CimInstance Win32_Process -Filter "name='python.exe'" | Where-Object {
    $_.CommandLine -match 'hermes.*gateway|hermes-agent'
} | ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force
    Write-Host "[STOP] hermes python PID $($_.ProcessId)" -ForegroundColor Yellow
}
Get-CimInstance Win32_Process -Filter "name='powershell.exe'" | Where-Object {
    $_.CommandLine -match 'hermes.*gateway run|hermes\.exe.*gateway'
} | ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force
    Write-Host "[STOP] hermes shell PID $($_.ProcessId)" -ForegroundColor Yellow
}

Start-Sleep -Seconds 2
Write-Host "[OK] Background agents stopped. Ollama left running for ProducerHit." -ForegroundColor Green
