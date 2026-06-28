Write-Host "=== OLLAMA (16GB profile) ===" -ForegroundColor Cyan
Write-Host "Ne pas fermer cette fenetre." -ForegroundColor Yellow
$env:OLLAMA_HOST = "127.0.0.1:11434"
$env:OLLAMA_ORIGINS = "*"
$env:OLLAMA_KEEP_ALIVE = "24h"
$env:OLLAMA_KV_CACHE_TYPE = "q8_0"
$env:OLLAMA_MAX_LOADED_MODELS = "1"
ollama serve
