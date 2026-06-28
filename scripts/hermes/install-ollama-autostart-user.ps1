# User-level autostart for Ollama (no admin required)
# Creates a Startup shortcut that launches scripts\windows\start-ollama.ps1 minimized.
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/hermes/install-ollama-autostart-user.ps1

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$OllamaScript = Join-Path $RepoRoot "scripts\\windows\\start-ollama.ps1"
if (-not (Test-Path $OllamaScript)) { throw "Missing: $OllamaScript" }

$StartupDir = [Environment]::GetFolderPath("Startup")
$ShortcutPath = Join-Path $StartupDir "ProducerHit - Ollama.lnk"

$Shell = New-Object -ComObject WScript.Shell
$Shortcut = $Shell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Minimized -File `"$OllamaScript`""
$Shortcut.WorkingDirectory = $RepoRoot
$Shortcut.WindowStyle = 7
$Shortcut.Save()

Write-Host "OK: Startup shortcut created:" -ForegroundColor Green
Write-Host "  $ShortcutPath"
