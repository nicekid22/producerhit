$ErrorActionPreference = "Continue"
$HermesHome = Join-Path $env:LOCALAPPDATA "hermes"
$HermesExe = Join-Path $HermesHome "hermes-agent\.venv\Scripts\hermes.exe"

Write-Host "=== HERMES GATEWAY ===" -ForegroundColor Cyan
Write-Host "HERMES_HOME: $HermesHome" -ForegroundColor DarkGray
Write-Host "Jobs PH, APEX, INFLU. Ne pas fermer." -ForegroundColor Yellow

if (-not (Test-Path $HermesExe)) {
    Write-Host "Hermes introuvable: $HermesExe" -ForegroundColor Red
    Write-Host "Installe: scripts\hermes\setup-producerhit.ps1"
    Read-Host "Appuyez sur Entree"
    exit 1
}

$env:HERMES_HOME = $HermesHome
& $HermesExe gateway run --replace
