# Register Apex Hermes cron jobs

$ErrorActionPreference = "Continue"
$HermesHome = "$env:LOCALAPPDATA\hermes"
$HermesExe = "$HermesHome\hermes-agent\.venv\Scripts\hermes.exe"
$Workdir = "$HermesHome\projects\apex-revenue"
$env:HERMES_HOME = $HermesHome

if (-not (Test-Path $HermesExe)) { Write-Error "Hermes not found" }

Write-Host "Apex Hermes crons..." -ForegroundColor Cyan

$jobs = @(
    @{ Name = "APEX Scout";       Schedule = "every 30m"; Skill = "apex-scout";        Prompt = "Run scout scan. Hunt ROI opportunities. Update memory." },
    @{ Name = "APEX Validator";   Schedule = "every 2h";  Skill = "apex-validator";    Prompt = "Validate top opportunities. GO/KILL." },
    @{ Name = "APEX Sales";       Schedule = "every 1h";  Skill = "apex-sales";        Prompt = "Hot leads + outreach drafts." },
    @{ Name = "APEX Growth";      Schedule = "every 4h";  Skill = "apex-growth";       Prompt = "Design revenue experiments." },
    @{ Name = "APEX Distribution"; Schedule = "0 7 * * *"; Skill = "apex-distribution"; Prompt = "SEO/content/partnership drafts." },
    @{ Name = "APEX Analyst";     Schedule = "every 6h";  Skill = "apex-analyst";      Prompt = "Update metrics.md. ROI ranking." },
    @{ Name = "APEX Automation";  Schedule = "0 3 * * *"; Skill = "apex-automation";   Prompt = "Automation proposals + kill list." },
    @{ Name = "APEX CEO";         Schedule = "30 9 * * *"; Skill = "apex-ceo";          Prompt = "Execute apex-ceo skill fully. Synthesize APEX reports (48h). Top 3 licensing/B2B deals + directives. Update roadmap.md." }
)

foreach ($j in $jobs) {
    Write-Host "  $($j.Name)" -ForegroundColor Yellow
    & $HermesExe cron create $j.Schedule $j.Prompt `
        --name $j.Name `
        --skill $j.Skill `
        --workdir $Workdir 2>&1
}

& $HermesExe cron list 2>&1
