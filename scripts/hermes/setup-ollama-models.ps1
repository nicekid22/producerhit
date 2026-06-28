# ProducerHit - Ollama models for 16GB RAM / Intel Iris Xe
# Pulls qwen3:8b and creates qwen3-8b-64k (Hermes requires 64K context for tools)
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/hermes/setup-ollama-models.ps1
#   powershell -ExecutionPolicy Bypass -File scripts/hermes/setup-ollama-models.ps1 -SkipPull

param(
    [string]$BaseModel = "qwen3:8b",
    [string]$CustomModel = "qwen3-8b-64k",
    [int]$ContextLength = 65536,
    [switch]$SkipPull
)

$ErrorActionPreference = "Stop"

Write-Host "=== Ollama models (16GB / Iris Xe profile) ===" -ForegroundColor Cyan
Write-Host "Base   : $BaseModel"
Write-Host "Custom : $CustomModel (num_ctx $ContextLength)"
Write-Host ""

try {
    $null = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -TimeoutSec 8
} catch {
    Write-Host "Ollama ne repond pas. Lance: ollama serve" -ForegroundColor Red
    exit 1
}

if (-not $SkipPull) {
    Write-Host "Pull $BaseModel ..." -ForegroundColor Yellow
    ollama pull $BaseModel
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

$modelfile = @"
FROM $BaseModel
PARAMETER num_ctx $ContextLength
PARAMETER temperature 0.7
"@

$tmp = Join-Path $env:TEMP "ollama-modelfile-qwen3-8b-64k.txt"
$modelfile | Set-Content -Path $tmp -Encoding UTF8

Write-Host "Create $CustomModel ..." -ForegroundColor Yellow
ollama create $CustomModel -f $tmp
$code = $LASTEXITCODE
Remove-Item $tmp -Force -ErrorAction SilentlyContinue
if ($code -ne 0) { exit $code }

$tags = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -TimeoutSec 8
$hit = @($tags.models | Where-Object { $_.name -like "$CustomModel*" })
if ($hit.Count -gt 0) {
    Write-Host "OK: $($hit[0].name) ($([math]::Round($hit[0].size / 1GB, 2)) GB)" -ForegroundColor Green
} else {
    Write-Host "WARN: $CustomModel not found after create" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Single-model profile: CEO + workers -> $CustomModel" -ForegroundColor DarkGray
