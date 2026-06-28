# Apply Option A - light agent architecture
# Usage: npm run agents:light

$ErrorActionPreference = "Continue"
$Repo = $PSScriptRoot | Split-Path -Parent

Write-Host "=== ProducerHit - Light Agent Architecture ===" -ForegroundColor Cyan
Write-Host "Pauses OpenClaw + Odysseus crons, keeps 8 Hermes jobs/day, stops local YouTube catch-up." -ForegroundColor DarkGray
Write-Host ""

python (Join-Path $Repo "scripts\apply-light-agent-architecture.py")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$userPath = [Environment]::GetEnvironmentVariable("OLLAMA_NUM_PARALLEL", "User")
if (-not $userPath) {
    [Environment]::SetEnvironmentVariable("OLLAMA_NUM_PARALLEL", "1", "User")
    Write-Host "[OK] OLLAMA_NUM_PARALLEL=1 (User env) - restart Ollama to apply" -ForegroundColor Green
}

Write-Host ""
Write-Host "Run stack (2 windows only):" -ForegroundColor Yellow
Write-Host "  1. ollama serve"
Write-Host "  2. hermes gateway run"
Write-Host ""
Write-Host "Cloud (GitHub Actions): YouTube daily, viral, social publish" -ForegroundColor DarkGray
