$OdysseusHome = "C:\Users\dylar\odysseus"
Set-Location $OdysseusHome
Write-Host "=== ODYSSEUS (TITAN + INFLU) ===" -ForegroundColor Cyan
Write-Host "Ne pas fermer. UI: http://127.0.0.1:7000" -ForegroundColor Yellow
& (Join-Path $OdysseusHome "venv\Scripts\python.exe") -m uvicorn app:app --host 127.0.0.1 --port 7000
