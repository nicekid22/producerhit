# Register INFLU Hermes cron jobs

$ErrorActionPreference = "Continue"
$HermesHome = "$env:LOCALAPPDATA\hermes"
$HermesExe = "$HermesHome\hermes-agent\.venv\Scripts\hermes.exe"
$Workdir = "$HermesHome\projects\influencer-marketing"
$env:HERMES_HOME = $HermesHome

if (-not (Test-Path $HermesExe)) { Write-Error "Hermes not found" }

Write-Host "INFLU Hermes crons..." -ForegroundColor Cyan

$jobs = @(
    @{ Name = "INFLU Scout";     Schedule = "every 120m"; Skill = "influ-scout";     Prompt = "Find producer influencers. Update prospects.md." },
    @{ Name = "INFLU Enrich";    Schedule = "every 240m"; Skill = "influ-enrich";    Prompt = "Find emails. Update CRM." },
    @{ Name = "INFLU Pitch";      Schedule = "0 8 * * *";  Skill = "influ-pitch";     Prompt = "Draft partnership pitches. OFFER.md." },
    @{ Name = "INFLU Outreach";   Schedule = "0 10 * * 1-5"; Skill = "influ-outreach"; Prompt = "Send partnership emails autonomously." },
    @{ Name = "INFLU Followup";  Schedule = "0 11 * * *";  Skill = "influ-followup";  Prompt = "Follow up contacted prospects." },
    @{ Name = "INFLU Learn";      Schedule = "0 9 * * 0";   Skill = "influ-learn";     Prompt = "Evolve offer strategy from results." },
    @{ Name = "INFLU CEO";        Schedule = "0 19 * * *";  Skill = "influ-ceo";       Prompt = "Execute influ-ceo skill fully. Synthesize INFLU pipeline. Top 3 partnership actions. Update memory/learnings.md." }
)

foreach ($j in $jobs) {
    Write-Host "  $($j.Name)" -ForegroundColor Yellow
    & $HermesExe cron create $j.Schedule $j.Prompt `
        --name $j.Name `
        --skill $j.Skill `
        --workdir $Workdir 2>&1
}

& $HermesExe cron list 2>&1 | Select-String "INFLU"
