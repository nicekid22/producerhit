# Ensure Ollama qwen2.5-64k for Hermes (65536 context)
$ErrorActionPreference = "Continue"
$HermesHome = Join-Path $env:LOCALAPPDATA "hermes"
$Modelfile = Join-Path $HermesHome "Modelfile.qwen2.5-64k"

$content = @"
FROM qwen2.5
PARAMETER num_ctx 65536
"@

if (-not (Test-Path $HermesHome)) { New-Item -ItemType Directory -Path $HermesHome -Force | Out-Null }
Set-Content -Path $Modelfile -Value $content -Encoding UTF8

Write-Host "Creating ollama model qwen2.5-64k..." -ForegroundColor Cyan
ollama create qwen2.5-64k -f $Modelfile 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "If base qwen2.5 missing: ollama pull qwen2.5" -ForegroundColor Yellow
}

# Patch Hermes config if present
$cfg = Join-Path $HermesHome "config.yaml"
if (Test-Path $cfg) {
    $yaml = Get-Content $cfg -Raw
    if ($yaml -notmatch "qwen2\.5-64k") {
        $yaml = $yaml -replace "default:\s*qwen[^\r\n]+", "default: qwen2.5-64k"
        Set-Content $cfg $yaml -Encoding UTF8
        Write-Host "Updated config.yaml -> qwen2.5-64k" -ForegroundColor Green
    }
}

Write-Host "Restart Hermes gateway after this." -ForegroundColor Yellow
