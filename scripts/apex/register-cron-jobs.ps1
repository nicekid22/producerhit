# Register Apex Revenue OS OpenClaw crons (aggressive schedule)

$ErrorActionPreference = "Continue"
$Workspace = "$env:USERPROFILE\.openclaw\workspace-apex"

Write-Host "Apex Revenue OS - register crons" -ForegroundColor Cyan

$portOk = $false
try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $iar = $tcp.BeginConnect("127.0.0.1", 18789, $null, $null)
    $portOk = $iar.AsyncWaitHandle.WaitOne(3000, $false)
    if ($portOk) { $tcp.EndConnect($iar) }
    $tcp.Close()
} catch { $portOk = $false }

if (-not $portOk) {
    Write-Host "Gateway not reachable on :18789. Start: openclaw gateway --force" -ForegroundColor Red
    exit 1
}
Write-Host "Gateway port 18789 OK" -ForegroundColor Green

# CLI openclaw cron hangs on this machine — edit jobs.json directly
$direct = Join-Path $PSScriptRoot "register-cron-jobs-direct.py"
if (Test-Path $direct) {
    python $direct
    if ($LASTEXITCODE -eq 0) {
        Write-Host "APEX crons registered via jobs.json" -ForegroundColor Green
        exit 0
    }
}

function Remove-ApexCrons {
    $json = & openclaw cron list --json 2>$null
    if (-not $json) { return }
    try { $list = $json | ConvertFrom-Json } catch { return }
    foreach ($job in $list) {
        if ($job.name -like "APEX *") {
            Write-Host "Removing: $($job.name)" -ForegroundColor DarkGray
            & openclaw cron remove $job.id 2>$null
        }
    }
}

Remove-ApexCrons

$jobs = @(
    @{ Name = "APEX Scout";       Cron = "0,30 * * * *"; Agent = "apex-scout";        Message = "Execute tasks/scout-30m.md. Follow agents/scout.md." },
    @{ Name = "APEX Validator";   Cron = "0 */2 * * *";  Agent = "apex-validator";    Message = "Execute tasks/validator-2h.md. Follow agents/validator.md." },
    @{ Name = "APEX Sales";       Cron = "0 * * * *";    Agent = "apex-sales";        Message = "Execute tasks/sales-hourly.md. Follow agents/sales.md." },
    @{ Name = "APEX Growth";      Cron = "0 */4 * * *";  Agent = "apex-growth";       Message = "Execute tasks/growth-4h.md. Follow agents/growth.md." },
    @{ Name = "APEX Distribution"; Cron = "0 7 * * *";   Agent = "apex-distribution"; Message = "Execute tasks/distribution-daily.md."; Tz = "Europe/Paris" },
    @{ Name = "APEX Analyst";     Cron = "0 */6 * * *";  Agent = "apex-analyst";      Message = "Execute tasks/analyst-6h.md. Follow agents/analyst.md." },
    @{ Name = "APEX Automation";  Cron = "0 3 * * *";    Agent = "apex-automation";   Message = "Execute tasks/automation-daily.md." },
    @{ Name = "APEX CEO Daily";   Cron = "30 8 * * *";   Agent = "apex-ceo";          Message = "Execute tasks/ceo-daily.md. Synthesize all apex reports."; Tz = "Europe/Paris" },
    @{ Name = "APEX CEO Weekly";  Cron = "0 10 * * 0";   Agent = "apex-ceo";          Message = "Execute tasks/ceo-weekly.md."; Tz = "Europe/Paris" }
)

foreach ($j in $jobs) {
    Write-Host "Creating: $($j.Name)" -ForegroundColor Yellow
    $ocArgs = @(
        "cron", "add",
        "--name", $j.Name,
        "--cron", $j.Cron,
        "--session", "isolated",
        "--message", $j.Message,
        "--agent", $j.Agent,
        "--model", "ollama/qwen3.5",
        "--light-context",
        "--no-deliver"
    )
    if ($j.Tz) { $ocArgs += @("--tz", $j.Tz) }
    & openclaw @ocArgs
}

Write-Host ""
& openclaw cron list
