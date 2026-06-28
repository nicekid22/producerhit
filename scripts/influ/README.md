# INFLU — Influencer Marketing Command (Team 5)

Mission: partner with beatmakers, singers, micro-influencers -> ProducerHit conversions.

## Install

```powershell
powershell -ExecutionPolicy Bypass -File "scripts\influ\install-influ-marketing.ps1"
```

## 7 agents

Scout, Enrich, Pitch, Outreach, Followup, Learn, CEO

## Stacks

| Platform | Workspace |
|----------|-----------|
| OpenClaw | `%USERPROFILE%\.openclaw\workspace-influ` |
| Hermes | `%LOCALAPPDATA%\hermes\projects\influencer-marketing` |
| Odysseus | Documents `influencer-marketing/` |

## Offers (autonomous)

See workspace `OFFER.md` — Pro/Studio comp, referral links, audience bonuses. No cash budget.

## Email (required for auto-send)

Odysseus -> Email -> Add account (IMAP/SMTP). Agents send partnerships autonomously.

## Crons

OpenClaw: 7 jobs INFLU * | Hermes: 7 jobs | Odysseus: 5 scheduled tasks
