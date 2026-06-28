# Register ProducerHit OpenClaw cron jobs (requires gateway running)
# Usage: powershell -ExecutionPolicy Bypass -File scripts/openclaw/register-cron-jobs.ps1

$ErrorActionPreference = "Continue"

$Workspace = "$env:USERPROFILE\.openclaw\workspace-producerhit"

Write-Host "ProducerHit - register cron jobs" -ForegroundColor Cyan

$health = & openclaw health 2>&1 | Out-String
if ($health -match "gateway closed|Failed to start|timeout") {
    Write-Host "Gateway not reachable. Start: openclaw gateway --force" -ForegroundColor Red
    exit 1
}

function Remove-PhCronJobs {
    $json = & openclaw cron list --json 2>$null
    if (-not $json) { return }
    try {
        $list = $json | ConvertFrom-Json
    } catch { return }
    foreach ($job in $list) {
        if ($job.name -like "PH *") {
            Write-Host "Removing old job: $($job.name)" -ForegroundColor DarkGray
            & openclaw cron remove $job.id 2>$null
        }
    }
}

Remove-PhCronJobs

$jobs = @(
    @{
        Name    = "PH Research Intel"
        Cron    = "0 * * * *"
        Agent   = "ph-research"
        Model   = "ollama/qwen3.5"
        Message = "Execute tasks/research-hourly.md. Follow agents/research.md. Write report to reports/daily/. End NO_REPLY when done."
    },
    @{
        Name    = "PH Social Pack"
        Cron    = "0 9 * * *"
        Agent   = "ph-social"
        Model   = "ollama/qwen3.5"
        Message = "Execute tasks/social-daily.md. Follow agents/social.md. DRAFT only."
        Tz      = "Europe/Paris"
    },
    @{
        Name    = "PH SEO Brief"
        Cron    = "0 2 * * *"
        Agent   = "ph-seo"
        Model   = "ollama/qwen3.5"
        Message = "Execute tasks/seo-nightly.md. Follow agents/seo.md."
    },
    @{
        Name    = "PH Growth Scan"
        Cron    = "0 */6 * * *"
        Agent   = "ph-growth"
        Model   = "ollama/qwen3.5"
        Message = "Execute tasks/growth-6h.md. Follow agents/growth.md."
    },
    @{
        Name    = "PH CEO Daily"
        Cron    = "30 8 * * *"
        Agent   = "ph-ceo"
        Model   = "ollama/qwen3.5"
        Message = "Execute tasks/ceo-daily.md. Synthesize daily reports into executive report."
        Tz      = "Europe/Paris"
    },
    @{
        Name    = "PH Dev Audit"
        Cron    = "0 8 * * 1"
        Agent   = "ph-dev"
        Model   = "ollama/qwen2.5-coder"
        Message = "Execute tasks/dev-weekly.md. Read-only audit via public-context only."
    }
)

foreach ($j in $jobs) {
    Write-Host "Creating: $($j.Name)" -ForegroundColor Yellow
    $args = @(
        "cron", "add",
        "--name", $j.Name,
        "--cron", $j.Cron,
        "--session", "isolated",
        "--message", $j.Message,
        "--agent", $j.Agent,
        "--model", $j.Model,
        "--light-context",
        "--no-deliver"
    )
    if ($j.Tz) { $args += @("--tz", $j.Tz) }
    & openclaw @args
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Failed to create $($j.Name) (exit $LASTEXITCODE)"
    }
}

Write-Host ""
Write-Host "Cron jobs:" -ForegroundColor Green
& openclaw cron list

Write-Host ""
Write-Host "Force-run research job now:" -ForegroundColor Cyan
Write-Host "  openclaw cron list --json"
Write-Host "  openclaw cron run <job-id>"
