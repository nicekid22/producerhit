# Architecture agents ProducerHit — Option A (light)

> Appliquée via `npm run agents:light` — réversible avec `npm run agents:restore`

## Problème résolu

3 orchestrateurs (OpenClaw + Hermes + Odysseus) + YouTube local + Ollama unique = surcharge garantie.

## Règle actuelle

| Rôle | Où | Quoi |
|------|-----|------|
| **LLM marketing** | Hermes seul (8 jobs/jour) | Scout, acquisition, hooks… |
| **Publish lourd** | GitHub Actions | YouTube, viral, social |
| **OpenClaw** | Crons OFF | Réactivable depuis backup |
| **Odysseus** | Crons OFF | UI manuelle (email, etc.) |
| **Ollama local** | ProducerHit app + Hermes (si pas Groq) | `OLLAMA_NUM_PARALLEL=1` |

## Grille Hermes (1 job / heure max)

| Heure | Job |
|-------|-----|
| 06:00 | INFLU Scout |
| 07:00 | PH Acquisition |
| 08:00 | APEX Scout |
| 09:00 | PH Competitor |
| 10:00 | VIRAL Hooks |
| 12:00 | APEX Sales |
| 15:00 | APEX Growth |
| 18:00 | INFLU Enrich |

VIRAL Render/Publish → **GitHub Actions** (`viral-content-cron.yml`), pas Hermes.

## Stack locale (2 fenêtres)

```powershell
ollama serve
$env:HERMES_HOME = "$env:LOCALAPPDATA\hermes"
& "$env:LOCALAPPDATA\hermes\hermes-agent\.venv\Scripts\hermes.exe" gateway run
```

Ne pas lancer `openclaw gateway` ni catch-up YouTube local.

## Passer Hermes sur API cloud (recommandé)

Ajouter dans `%LOCALAPPDATA%\hermes\.env` :

```
GROQ_API_KEY=gsk_...
```

Puis :

```powershell
npm run agents:light
```

Redémarrer le gateway Hermes. Ollama reste libre pour ProducerHit.

Alternative : `OPENROUTER_API_KEY` (modèles free).

## Cloud publish

Workflows déjà dans `.github/workflows/` :

- `youtube-daily-cron.yml` — catch-up / publish
- `viral-content-cron.yml` — shorts
- `social-publish-cron.yml` — queue social

Secrets requis : `VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SOCIAL_PUBLISH_CRON_SECRET`.

## Commandes

```powershell
npm run agents:light      # appliquer architecture légère
npm run agents:restore    # restaurer backup
npm run agents:verify     # santé Hermes / services
npm run automation:report # rapport Discord/ fichier
```

## Backups

`%LOCALAPPDATA%\producerhit-agent-backups\<timestamp>\`

- `openclaw-jobs.json`
- `hermes-jobs.json`
- `odysseus-app.db`

## Évolution (quand MRR le justifie)

1. VPS ~5€/mo (Hetzner) — Hermes + Ollama dédié agents
2. Groq/OpenRouter — zero LLM local pour agents
3. Réactiver OpenClaw **uniquement** pour des crons sans doublon Hermes
