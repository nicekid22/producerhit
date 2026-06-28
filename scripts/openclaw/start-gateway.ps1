# Start OpenClaw gateway + Ollama check for ProducerHit marketing OS
$ErrorActionPreference = "Continue"

Write-Host "Checking Ollama..." -ForegroundColor Cyan
try {
    $tags = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -TimeoutSec 3
    $qwen = $tags.models | Where-Object { $_.name -like "qwen3.5*" }
    if ($qwen) {
        Write-Host "  qwen3.5 OK" -ForegroundColor Green
    } else {
        Write-Host "  qwen3.5 missing — run: ollama pull qwen3.5" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  Ollama not reachable — run: ollama serve" -ForegroundColor Red
}

Write-Host "Starting OpenClaw gateway (port 18789)..." -ForegroundColor Cyan
& openclaw gateway --force
