# Unload all models from Ollama VRAM/RAM (critical on 16GB — only one model at a time)
param([int]$WaitSeconds = 3)

$ErrorActionPreference = "Continue"

function Get-LoadedOllamaModels {
    try {
        $raw = ollama ps 2>&1 | Out-String
        if ($raw -match "NAME") {
            $lines = $raw -split "`n" | Where-Object { $_ -match "\S" -and $_ -notmatch "^NAME" -and $_ -notmatch "^\s*$" }
            return @($lines | ForEach-Object { ($_ -split "\s+")[0] } | Where-Object { $_ -and $_ -ne "NAME" })
        }
    } catch {}
    return @()
}

$models = Get-LoadedOllamaModels
if ($models.Count -eq 0) {
    Write-Host "Ollama: no loaded models" -ForegroundColor DarkGray
    exit 0
}

Write-Host "Unload $($models.Count) model(s) from Ollama..." -ForegroundColor Yellow
foreach ($m in $models) {
    if ($m -eq "NAME") { continue }
    Write-Host "  stop $m" -ForegroundColor DarkGray
    ollama stop $m 2>&1 | Out-Null
}

Start-Sleep -Seconds $WaitSeconds
$left = Get-LoadedOllamaModels
if ($left.Count -gt 0) {
    Write-Host "WARN: still loaded: $($left -join ', ')" -ForegroundColor Yellow
} else {
    Write-Host "Ollama RAM cleared" -ForegroundColor Green
}
