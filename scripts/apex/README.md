# Apex Revenue OS — Team 3 (most aggressive)

Elite autonomous organization focused on **maximum legal revenue** as fast as possible.

## Architecture

| Layer | Platform | Workspace |
|-------|----------|-----------|
| Execution crons | OpenClaw | `~/.openclaw/workspace-apex` |
| 24/7 gateway | Hermes | `%LOCALAPPDATA%\hermes\projects\apex-revenue` |

## Agents (8)

`apex-ceo`, `apex-scout`, `apex-validator`, `apex-sales`, `apex-growth`, `apex-distribution`, `apex-analyst`, `apex-automation`

## Install

```powershell
powershell -ExecutionPolicy Bypass -File scripts\apex\install-apex-revenue-os.ps1
openclaw gateway --force
# new terminal:
$env:HERMES_HOME = "$env:LOCALAPPDATA\hermes"
hermes gateway run
# register crons:
powershell -File scripts\apex\register-cron-jobs.ps1
powershell -File scripts\apex\register-hermes-crons.ps1
```

## vs Team 1 (OpenClaw ph-*) / Team 2 (Hermes ph-*)

- **Broader mandate** — not limited to ProducerHit marketing
- **Faster cadence** — scout every 30 min, sales hourly
- **ROI discipline** — validator kills weak ideas
- **North Star** — weekly net revenue growth, not vanity

## Your message was cut at "voici le site ou tu peux" — add URL to `public-context/` if needed.
