# Setup ProducerHit Hermes growth machine (full local pipeline)

# Usage: powershell -ExecutionPolicy Bypass -File scripts/hermes/setup-producerhit.ps1



$ErrorActionPreference = "Stop"

$HermesHome = "$env:LOCALAPPDATA\hermes"

$HermesExe = "$HermesHome\hermes-agent\.venv\Scripts\hermes.exe"

$ProjectDir = "$HermesHome\projects\producerhit"



Write-Host "ProducerHit Hermes setup" -ForegroundColor Cyan

Write-Host "HERMES_HOME: $HermesHome"



if (-not (Test-Path $HermesExe)) {

    Write-Host "Hermes not installed. Run:" -ForegroundColor Red

    Write-Host '  iex (irm https://hermes-agent.nousresearch.com/install.ps1)'

    exit 1

}



$venvScripts = "$HermesHome\hermes-agent\.venv\Scripts"

$userPath = [Environment]::GetEnvironmentVariable("Path", "User")

if ($userPath -notlike "*$venvScripts*") {

    [Environment]::SetEnvironmentVariable("Path", "$userPath;$venvScripts", "User")

    Write-Host "Added Hermes to user PATH (new terminal required)" -ForegroundColor Green

}



$env:HERMES_HOME = $HermesHome



& (Join-Path $PSScriptRoot "start-local-stack.ps1")



Write-Host ""

& $HermesExe doctor 2>&1 | Select-Object -Last 12



Write-Host ""

Write-Host "Project: $ProjectDir" -ForegroundColor Cyan

Write-Host "Mode: Ollama local (.ollama-local-mode)" -ForegroundColor Green

Write-Host "NE PAS lancer npm run agents:setup (ecrase Ollama avec cloud)" -ForegroundColor Yellow

