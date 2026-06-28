# Correctifs prioritaires agents + YouTube backlog
# Usage (admin pour tache planifiee): powershell -ExecutionPolicy Bypass -File scripts/fix-agents-priority.ps1

$ErrorActionPreference = "Continue"
$Repo = $PSScriptRoot | Split-Path -Parent
$OpenClawCfg = Join-Path $env:USERPROFILE ".openclaw\openclaw.json"
$HermesProjects = Join-Path $env:LOCALAPPDATA "hermes\projects"

Write-Host "=== Fix agents priority ===" -ForegroundColor Cyan

# 0) Ollama qwen2.5-64k + Hermes config
& (Join-Path $Repo "scripts\viral\ensure-ollama-64k.ps1")

# 1) OpenClaw timeout + model
python (Join-Path $Repo "scripts\patch-openclaw-agents.py")
if (Test-Path $OpenClawCfg) {
    $oc = Get-Content $OpenClawCfg -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($oc.agents.defaults.timeoutSeconds -lt 600) {
        $oc.agents.defaults | Add-Member -NotePropertyName timeoutSeconds -NotePropertyValue 1200 -Force
        $oc | ConvertTo-Json -Depth 20 | Set-Content $OpenClawCfg -Encoding UTF8
        Write-Host "[OK] OpenClaw timeoutSeconds=1200" -ForegroundColor Green
    } else {
        Write-Host "[OK] OpenClaw timeout $($oc.agents.defaults.timeoutSeconds)s" -ForegroundColor DarkGray
    }
} else {
    Write-Host "[SKIP] openclaw.json not found" -ForegroundColor Yellow
}

# 2) Hermes projects — lien scripts vers repo (viral, producerhit, apex, influ)
$linkTargets = @("viral-content", "producerhit", "apex-revenue", "influencer-marketing")
foreach ($proj in $linkTargets) {
    $base = Join-Path $HermesProjects $proj
    if (-not (Test-Path $base)) { continue }
    $link = Join-Path $base "scripts"
    $viralRunner = Join-Path $link "viral\viral-agent-run.mjs"
    if ((Test-Path $link) -and -not (Test-Path $viralRunner)) {
        Remove-Item -Recurse -Force $link -ErrorAction SilentlyContinue
    }
    if (Test-Path $link) {
        if (Test-Path $viralRunner) {
            Write-Host "[OK] $proj/scripts linked" -ForegroundColor DarkGray
        } else {
            Write-Host "[WARN] $proj/scripts incomplete" -ForegroundColor Yellow
        }
        continue
    }
    cmd /c mklink /J "`"$link`"" "`"$Repo\scripts`"" 2>$null
    if (Test-Path $link) {
        Write-Host "[OK] Junction $proj/scripts -> repo" -ForegroundColor Green
    } else {
        Write-Host "[WARN] Could not link $proj/scripts (run as admin?)" -ForegroundColor Yellow
    }
}

# 3) Hermes SSL OpenRouter (optional metadata) — prefer Ollama local
$hermesEnv = Join-Path $env:LOCALAPPDATA "hermes\.env"
if (Test-Path $hermesEnv) {
    $txt = Get-Content $hermesEnv -Raw
    if ($txt -notmatch "GATEWAY_ALLOW_ALL_USERS") {
        Add-Content $hermesEnv "`nGATEWAY_ALLOW_ALL_USERS=true"
        Write-Host "[OK] Hermes GATEWAY_ALLOW_ALL_USERS=true" -ForegroundColor Green
    }
}

# 4) Odysseus — models, prompts, search
$OdyFix = Join-Path $Repo "scripts\odysseus\apply-titan-fixes.py"
if (Test-Path $OdyFix) {
    & "C:\Users\dylar\odysseus\venv\Scripts\python.exe" $OdyFix
}

Write-Host ""
Write-Host "Relance gateways si OpenClaw etait deja up:" -ForegroundColor Yellow
Write-Host "  openclaw gateway --force"
Write-Host ""
Write-Host "YouTube catch-up:" -ForegroundColor Yellow
Write-Host "  cd `"$Repo`""
Write-Host "  node --use-system-ca scripts/youtube-daily-run.mjs repair"
Write-Host "  `$env:YOUTUBE_DAILY_AUTO_PUBLISH='1'; node --use-system-ca scripts/youtube-daily-run.mjs catch-up"
