# Lance les 4 fenetres visibles pour agents 24/7 (PC allume + fenetres ouvertes)
$ErrorActionPreference = "SilentlyContinue"
$WinScripts = Join-Path $PSScriptRoot "windows"

function Start-AgentWindow($title, $scriptPath) {
    if (-not (Test-Path $scriptPath)) {
        Write-Host "Script manquant: $scriptPath" -ForegroundColor Red
        return
    }
    Start-Process powershell -ArgumentList @(
        '-NoExit', '-ExecutionPolicy', 'Bypass', '-File', $scriptPath
    )
    Write-Host "Fenetre: $title" -ForegroundColor Green
}

Start-AgentWindow "OLLAMA" (Join-Path $WinScripts "start-ollama.ps1")
Start-Sleep 2
Start-AgentWindow "OPENCLAW" (Join-Path $WinScripts "start-openclaw-gateway.ps1")
Start-Sleep 2
Start-AgentWindow "HERMES" (Join-Path $WinScripts "start-hermes-gateway.ps1")
Start-Sleep 2
Start-AgentWindow "ODYSSEUS" (Join-Path $WinScripts "start-odysseus.ps1")

Start-Sleep 3
Start-Process "http://127.0.0.1:7000"
try { Start-Process "http://127.0.0.1:18789" } catch {}

Write-Host ""
Write-Host "4 fenetres agents + navigateur lances." -ForegroundColor Green
Write-Host "Hermes seul: powershell -File scripts\windows\start-hermes-gateway.ps1" -ForegroundColor DarkGray
