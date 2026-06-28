# ProducerHit OpenClaw Marketing OS

Équipe marketing semi-autonome 24/7 pour ProducerHit via [OpenClaw](https://docs.openclaw.ai).

## Prérequis

- OpenClaw 2026.4.x (`openclaw --version`)
- Ollama + `qwen3.5` (`ollama pull qwen3.5`)
- Gateway OpenClaw sur `127.0.0.1:18789`

## Installation

```powershell
cd "C:\Users\dylar\Documents\ProducerKit AI - Cursor 2"
powershell -ExecutionPolicy Bypass -File scripts/openclaw/install-producerhit-team.ps1
```

Workspace : `%USERPROFILE%\.openclaw\workspace-producerhit`

## Démarrer

```powershell
# Terminal 1 — Ollama (si pas déjà lancé)
ollama serve

# Terminal 2 — Gateway (laisser ouvert)
powershell -ExecutionPolicy Bypass -File scripts/openclaw/start-gateway.ps1

# Approuver le CLI une fois (si "pairing required" sur cron)
openclaw dashboard
# Accepter la demande device / scope operator.admin

# Terminal 3 — Crons
$env:OPENCLAW_REPORT_WEBHOOK = "https://discord.com/api/webhooks/..."  # optionnel
powershell -ExecutionPolicy Bypass -File scripts/openclaw/register-cron-jobs.ps1
```

## 24/7 (Windows)

En admin, une fois :

```powershell
powershell -ExecutionPolicy Bypass -File scripts/openclaw/install-gateway-task.ps1
```

## Agents

| ID | Rôle | Cron |
|----|------|------|
| ph-ceo | Executive daily | 08:30 Paris |
| ph-research | Intel horaire | every hour |
| ph-social | Pack social | 09:00 Paris |
| ph-seo | Brief SEO | 02:00 |
| ph-growth | Scan growth | every 6h |
| ph-dev | Audit code | Lundi 08:00 |

## Test manuel

```powershell
openclaw agent --agent ph-research --message "Execute tasks/research-hourly.md"
openclaw agent --agent ph-ceo --message "Execute tasks/ceo-daily.md"
openclaw cron list
```

## Rapports

- `%USERPROFILE%\.openclaw\workspace-producerhit\reports\daily\`
- `%USERPROFILE%\.openclaw\workspace-producerhit\reports\weekly\`

## Garde-fous (V1)

Voir `workspace-producerhit/POLICY.md` — pas de posts publics, pas de git push sans validation.

## Discord

Définir `OPENCLAW_REPORT_WEBHOOK` pour envoyer le rapport CEO quotidien.
