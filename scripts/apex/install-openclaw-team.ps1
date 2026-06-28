# Apex Revenue OS - OpenClaw install

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$Templates = Join-Path $PSScriptRoot "templates\workspace"
$OpenClawDir = "$env:USERPROFILE\.openclaw"
$Workspace = "$OpenClawDir\workspace-apex"
$cronScript = Join-Path $RepoRoot "scripts\apex\register-cron-jobs.ps1"

Write-Host "=== Apex Revenue OS - OpenClaw install ===" -ForegroundColor Cyan
Write-Host "Workspace: $Workspace"

if (-not (Test-Path $Templates)) {
    Write-Error "Templates missing: $Templates"
}

New-Item -ItemType Directory -Path $Workspace -Force | Out-Null
robocopy $Templates $Workspace /E /XO /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
if ($LASTEXITCODE -ge 8) { Write-Error "robocopy failed: $LASTEXITCODE" }

@("reports\daily", "reports\weekly") | ForEach-Object {
    $p = Join-Path $Workspace $_
    if (-not (Test-Path $p)) { New-Item -ItemType Directory -Path $p -Force | Out-Null }
}

& openclaw config set agents.defaults.model.primary "ollama/qwen3.5" 2>$null

$toolDeny = @("exec", "process", "browser", "gateway", "cron", "sessions_spawn", "sessions_send", "apply_patch")

$agents = @(
    @{ id = "apex-ceo";          model = "ollama/qwen3.5"; name = "Apex CEO" },
    @{ id = "apex-scout";        model = "ollama/qwen3.5"; name = "Apex Scout" },
    @{ id = "apex-validator";    model = "ollama/qwen3.5"; name = "Apex Validator" },
    @{ id = "apex-sales";        model = "ollama/qwen3.5"; name = "Apex Sales" },
    @{ id = "apex-growth";       model = "ollama/qwen3.5"; name = "Apex Growth" },
    @{ id = "apex-distribution"; model = "ollama/qwen3.5"; name = "Apex Distribution" },
    @{ id = "apex-analyst";      model = "ollama/qwen3.5"; name = "Apex Analyst" },
    @{ id = "apex-automation";   model = "ollama/qwen3.5"; name = "Apex Automation" }
)

foreach ($a in $agents) {
    Write-Host "Agent: $($a.id)" -ForegroundColor Yellow
    $json = & openclaw agents list --json 2>$null
    $found = $false
    if ($json) {
        try {
            $list = $json | ConvertFrom-Json
            foreach ($item in $list) { if ($item.id -eq $a.id) { $found = $true; break } }
        } catch {}
    }
    if ($found) {
        Write-Host "  already registered" -ForegroundColor DarkGray
        continue
    }
    & openclaw agents add $a.id --workspace $Workspace --model $a.model --non-interactive
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "  openclaw agents add failed - add manually to openclaw.json"
    }
    & openclaw agents set-identity --agent $a.id --name $a.name --emoji ":chart_with_upwards_trend:" 2>$null
}

Write-Host ""
Write-Host "Patch openclaw.json for apex agents..." -ForegroundColor DarkGray
$configPath = "$OpenClawDir\openclaw.json"
if (Test-Path $configPath) {
    $cfg = Get-Content $configPath -Raw | ConvertFrom-Json
    $changed = $false
    foreach ($agent in $cfg.agents.list) {
        if ($agent.id -like "apex-*") {
            if (-not $agent.sandbox) { $agent | Add-Member -NotePropertyName sandbox -NotePropertyValue (@{}) }
            $agent.sandbox.mode = "off"
            $agent.sandbox.scope = "agent"
            $agent.sandbox.workspaceAccess = "rw"
            if (-not $agent.tools) { $agent | Add-Member -NotePropertyName tools -NotePropertyValue (@{}) }
            $agent.tools.deny = $toolDeny
            $agent.tools.elevated = @{ enabled = $false }
            $changed = $true
        }
    }
    if ($changed) {
        $cfg | ConvertTo-Json -Depth 20 | Set-Content $configPath -Encoding UTF8
        Write-Host "  openclaw.json updated" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Done. Next:" -ForegroundColor Green
Write-Host "  1. openclaw gateway --force"
Write-Host "  2. powershell -File $cronScript"
