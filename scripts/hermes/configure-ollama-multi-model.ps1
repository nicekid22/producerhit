# ProducerHit - Hermes + Ollama (16GB RAM / Intel Iris Xe profile)
# Single local model: qwen3-8b-64k (Hermes 64K context). Research -> Groq cloud.
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/hermes/configure-ollama-multi-model.ps1
#   powershell -ExecutionPolicy Bypass -File scripts/hermes/configure-ollama-multi-model.ps1 -DryRun

param(
    [string]$LocalModel = "qwen3-8b-64k",
    [string]$ResearchProvider = "groq",
    [string]$ResearchModel = "llama-3.3-70b-versatile",
    [string]$OllamaBaseUrl = "http://127.0.0.1:11434/v1",
    [switch]$SkipModelSetup,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$HermesHome = "$env:LOCALAPPDATA\hermes"
$HermesExe = "$HermesHome\hermes-agent\.venv\Scripts\hermes.exe"
$ConfigPath = "$HermesHome\config.yaml"
$EnvPath = "$HermesHome\.env"

if (-not (Test-Path $HermesExe)) {
    Write-Error "Hermes introuvable. Lance: iex (irm https://hermes-agent.nousresearch.com/install.ps1)"
}

$env:HERMES_HOME = $HermesHome

Write-Host "=== Hermes + Ollama (16GB / Iris Xe) ===" -ForegroundColor Cyan
Write-Host "Endpoint : $OllamaBaseUrl"
Write-Host "Local    : $LocalModel (CEO + workers + aux)"
Write-Host "Research : $ResearchProvider / $ResearchModel (cloud)"
Write-Host ""

if (-not $SkipModelSetup -and -not $DryRun) {
    & (Join-Path $PSScriptRoot "setup-ollama-models.ps1")
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

# 1. Ollama health
try {
    $tags = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -TimeoutSec 8
    $names = @($tags.models | ForEach-Object { $_.name })
    Write-Host "Ollama OK - $($names.Count) modele(s)" -ForegroundColor Green
    $hit = @($names | Where-Object { $_ -like "$LocalModel*" })
    if ($hit.Count -gt 0) { Write-Host "  [ok] $LocalModel -> $($hit[0])" -ForegroundColor DarkGreen }
    else { Write-Host "  [!!] $LocalModel absent - run setup-ollama-models.ps1" -ForegroundColor Yellow }
} catch {
    Write-Host "Ollama ne repond pas sur 127.0.0.1:11434" -ForegroundColor Red
    Write-Host "  ollama serve" -ForegroundColor Yellow
    exit 1
}

# 2. Env vars (bug classique modeles invisibles)
$envLines = @(
    "OLLAMA_HOST=127.0.0.1:11434",
    'OLLAMA_ORIGINS=*',
    "OLLAMA_KEEP_ALIVE=24h",
    "OLLAMA_KV_CACHE_TYPE=q8_0",
    "OLLAMA_MAX_LOADED_MODELS=1"
)
if (Test-Path $EnvPath) {
    $envContent = Get-Content $EnvPath -Raw
    foreach ($line in $envLines) {
        $key = ($line -split "=", 2)[0]
        if ($envContent -notmatch "(?m)^$key=") {
            if (-not $DryRun) { Add-Content -Path $EnvPath -Value $line }
            Write-Host "  + .env $key" -ForegroundColor Green
        }
    }
} else {
    if (-not $DryRun) { $envLines | Set-Content -Path $EnvPath }
    Write-Host "  cree $EnvPath" -ForegroundColor Green
}

if ($DryRun) {
    Write-Host "[DryRun] config non ecrite." -ForegroundColor Yellow
    exit 0
}

# 3. Patch config.yaml (merge propre via Python dans le venv Hermes)
$py = @"
import copy, sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("PyYAML manquant dans le venv Hermes", file=sys.stderr)
    sys.exit(2)

path = Path(r"$ConfigPath")
cfg = yaml.safe_load(path.read_text(encoding="utf-8")) or {}

ceo = "$LocalModel"
worker = "$LocalModel"
fast = "$LocalModel"
base = "$OllamaBaseUrl"
research_provider = "$ResearchProvider"
research_model = "$ResearchModel"

cfg["model"] = {
    "provider": "custom",
    "default": ceo,
    "base_url": base,
    "context_length": 64000,
    "max_tokens": 4096,
}

providers = [e for e in (cfg.get("custom_providers") or []) if isinstance(e, dict) and e.get("base_url", "").rstrip("/") != base.rstrip("/")]
providers.append({
    "name": "ollama",
    "base_url": base,
    "models": {
        ceo: {"context_length": 64000},
    },
})
cfg["custom_providers"] = providers

# Garde groq si deja present (research)
groq_url = "https://api.groq.com/openai/v1"
has_groq = any(isinstance(e, dict) and e.get("base_url", "").rstrip("/") == groq_url.rstrip("/") for e in cfg["custom_providers"])
if not has_groq:
    cfg["custom_providers"].append({"name": "groq", "base_url": groq_url, "key_env": "GROQ_API_KEY"})

deleg = cfg.get("delegation") or {}
deleg.update({
    "model": worker,
    "provider": "custom:ollama",
    "base_url": base,
    "max_concurrent_children": 1,
    "max_async_children": 1,
})
cfg["delegation"] = deleg

aux = cfg.get("auxiliary") or {}
for task in ("compression", "approval", "title_generation", "triage_specifier"):
    aux[task] = {
        "provider": "custom:ollama",
        "model": fast if task != "triage_specifier" else worker,
        "base_url": base,
    }
aux["web_extract"] = {"provider": research_provider, "model": research_model}
cfg["auxiliary"] = aux

cfg["fallback_providers"] = []

pt = cfg.get("platform_toolsets") or {}
pt["cron"] = ["file", "skills", "memory", "terminal", "web"]
cfg["platform_toolsets"] = pt

comp = cfg.get("compression") or {}
comp["enabled"] = False
cfg["compression"] = comp

cron_cfg = cfg.get("cron") or {}
cron_cfg["max_parallel_jobs"] = 1
cfg["cron"] = cron_cfg

path.write_text(yaml.dump(cfg, default_flow_style=False, allow_unicode=True, sort_keys=False), encoding="utf-8")
print("config.yaml OK")
"@

$py | & "$HermesHome\hermes-agent\.venv\Scripts\python.exe" -
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& (Join-Path $PSScriptRoot "unload-ollama-models.ps1")

$HermesExe = "$HermesHome\hermes-agent\.venv\Scripts\hermes.exe"
if (Test-Path $HermesExe) {
    Write-Host "Restart gateway (replace)..." -ForegroundColor Yellow
    Start-Process -FilePath $HermesExe -ArgumentList @("gateway", "run", "--replace", "--accept-hooks") -WindowStyle Minimized -WorkingDirectory $HermesHome | Out-Null
    Start-Sleep -Seconds 5
}

# Marker: block configure-cloud-apis from overwriting crons with OpenRouter/Groq
$marker = Join-Path $HermesHome ".ollama-local-mode"
@{
    profile = "16gb-iris-xe"
    local_model = $LocalModel
    configured_at = (Get-Date -Format "o")
} | ConvertTo-Json | Set-Content -Path $marker -Encoding UTF8
Write-Host "  marker .ollama-local-mode" -ForegroundColor Green

# Warm model (single model kept in RAM)
try {
    $warmBody = @{ model = $LocalModel; prompt = "ok"; stream = $false } | ConvertTo-Json
    Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/generate" -Method Post -Body $warmBody -ContentType "application/json" -TimeoutSec 180 | Out-Null
    Write-Host "  warmed $LocalModel" -ForegroundColor DarkGreen
} catch {
    Write-Host "  warm-up skip (model will load on first cron)" -ForegroundColor DarkYellow
}

Write-Host ""
Write-Host "Config appliquee." -ForegroundColor Green
Write-Host "Test:" -ForegroundColor Cyan
Write-Host "  hermes doctor"
Write-Host "  hermes chat --workdir `"$HermesHome\projects\producerhit`""
Write-Host "  puis: What model are you using?"
Write-Host ""
Write-Host "Routing:" -ForegroundColor Cyan
Write-Host "  CEO + workers + aux -> $LocalModel @ $OllamaBaseUrl"
Write-Host "  Research/extract     -> $ResearchProvider ($ResearchModel)"
