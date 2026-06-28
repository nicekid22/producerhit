# Clean ProducerHit agent stack — Hermes + OpenCode (OpenRouter free + Groq fallback)
# Usage: npm run agents:stack-restart

$ErrorActionPreference = "Continue"
$Repo = $PSScriptRoot | Split-Path -Parent | Split-Path -Parent
$HermesExe = "$env:LOCALAPPDATA\hermes\hermes-agent\.venv\Scripts\hermes.exe"

Write-Host "=== Clean stack restart ===" -ForegroundColor Cyan

# 1) Stop noise
& (Join-Path $Repo "scripts\windows\stop-agent-noise.ps1")

# 2) Configure APIs + light architecture (includes Supabase Gemini sync)
Set-Location $Repo
python (Join-Path $Repo "scripts\configure-cloud-apis.py")
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERR] configure-cloud-apis failed (exit $LASTEXITCODE)" -ForegroundColor Red
    exit $LASTEXITCODE
}

# 3) Single Hermes gateway
if (-not (Test-Path $HermesExe)) {
    Write-Error "Hermes not found at $HermesExe"
}
$env:HERMES_HOME = "$env:LOCALAPPDATA\hermes"
Start-Process powershell -ArgumentList @(
    '-NoExit', '-ExecutionPolicy', 'Bypass', '-Command',
    "`$env:HERMES_HOME='$env:LOCALAPPDATA\hermes'; & '$HermesExe' gateway run --replace"
)
Start-Sleep -Seconds 5

# 4) Hermes web dashboard (http://127.0.0.1:9119 — separate from gateway)
$Dist = "$env:LOCALAPPDATA\hermes\hermes-agent\hermes_cli\web_dist\index.html"
if (-not (Test-Path $Dist)) {
    Write-Host "[..] Building Hermes dashboard (first time)..." -ForegroundColor Yellow
    & (Join-Path $Repo "scripts\windows\build-hermes-dashboard.ps1")
}
Start-Process powershell -ArgumentList @(
    '-NoExit', '-ExecutionPolicy', 'Bypass', '-Command',
    "`$env:HERMES_HOME='$env:LOCALAPPDATA\hermes'; & '$HermesExe' dashboard --skip-build --no-open"
)
Start-Sleep -Seconds 4

# 5) Verify
python (Join-Path $Repo "scripts\verify-agents-health.py")

Write-Host ""
Write-Host "Stack active:" -ForegroundColor Green
Write-Host "  Hermes gateway (8 crons/jour, OpenRouter free + Groq fallback)"
Write-Host "  Hermes dashboard -> http://127.0.0.1:9119"
Write-Host "  OpenCode CLI -> opencode (OpenRouter free models)"
Write-Host "  Supabase Edge (YouTube publish, Voice Studio Gemini)"
Write-Host "  GitHub Actions (youtube-daily, viral, social)"
Write-Host ""
Write-Host "Stopped / not running:" -ForegroundColor DarkGray
Write-Host "  OpenClaw, Odysseus, catch-up YouTube local"
