# Post an OpenClaw report excerpt to Discord via webhook
# Usage: .\post-discord-report.ps1 -ReportPath "C:\...\executive-2026-06-05.md"

param(
    [Parameter(Mandatory = $true)]
    [string]$ReportPath,
    [int]$MaxChars = 1800
)

$webhook = $env:OPENCLAW_REPORT_WEBHOOK
if (-not $webhook) {
    Write-Warning "OPENCLAW_REPORT_WEBHOOK not set — skip Discord post"
    exit 0
}

if (-not (Test-Path $ReportPath)) {
    Write-Error "Report not found: $ReportPath"
    exit 1
}

$text = Get-Content $ReportPath -Raw -Encoding UTF8
if ($text.Length -gt $MaxChars) {
    $text = $text.Substring(0, $MaxChars) + "`n`n… _(truncated — full report on disk)_"
}

$payload = @{
    username = "ProducerHit CEO"
    content  = "**OpenClaw report**`n```markdown`n$text`n```"
} | ConvertTo-Json -Depth 5 -Compress

try {
    Invoke-RestMethod -Uri $webhook -Method Post -ContentType "application/json; charset=utf-8" -Body $payload
    Write-Host "Posted to Discord." -ForegroundColor Green
} catch {
    Write-Warning "Discord webhook failed: $_"
    exit 1
}
