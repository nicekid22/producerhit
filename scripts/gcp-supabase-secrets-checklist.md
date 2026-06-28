# Checklist secrets — Google Cloud VPS + Supabase

Projet Supabase : **pmfnzenqemnonpglmjqx**

## Où mettre quoi

| Secret | VPS `.env` | Supabase Edge | GitHub Actions |
|--------|:----------:|:-------------:|:--------------:|
| `VITE_SUPABASE_URL` | oui | — | oui |
| `VITE_SUPABASE_ANON_KEY` | oui | — | oui |
| `SUPABASE_SERVICE_ROLE_KEY` | oui | auto | oui |
| `SOCIAL_PUBLISH_CRON_SECRET` | oui | **oui** | **oui** |
| `YOUTUBE_*` (tous comptes) | si scripts | **oui** | oui (workflows) |
| `PEXELS_API_KEY` | optionnel | **oui** | oui |
| `GROQ_API_KEY` | **oui** (`~/.hermes/.env`) | non | non |
| `AUTOMATION_REPORT_WEBHOOK` | optionnel | non | oui |
| `STRIPE_*` | non | déjà Edge | non |

## Remplir Supabase (Dashboard → Edge Functions → Secrets)

Minimum pour publish YouTube + social :

```
VITE_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SOCIAL_PUBLISH_CRON_SECRET
SOCIAL_PUBLISH_PLATFORMS
YOUTUBE_ACCOUNTS
YOUTUBE_CLIENT_ID
YOUTUBE_CLIENT_SECRET
YOUTUBE_REFRESH_TOKEN
YOUTUBE_CHANNEL_URL
(+ tous YOUTUBE_<COMPTE>_* déjà dans .env.gcp-vps.example)
YOUTUBE_PREVIEW_SEC
YOUTUBE_MIN_INTERVAL_SEC
YOUTUBE_GLOBAL_MIN_INTERVAL_SEC
YOUTUBE_MAX_DAILY_PER_ACCOUNT
YOUTUBE_RENDER_URL
PEXELS_API_KEY
```

Depuis ton PC (avec `.env` rempli) :

```powershell
npm run youtube:sync-secrets
```

## Remplir GitHub (repo → Settings → Secrets)

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SOCIAL_PUBLISH_CRON_SECRET
AUTOMATION_REPORT_WEBHOOK
PEXELS_API_KEY
OPENAI_API_KEY          # auto-blog workflow
INDEXNOW_KEY            # auto-growth
```

Les workflows YouTube/viral lisent surtout `VITE_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` + publish flags inline.

## VPS Google Cloud — stack recommandée

1. VM **e2-small** (Debian/Ubuntu 22.04)
2. Clone repo + `npm ci`
3. Hermes install + `GROQ_API_KEY` dans `~/.hermes/.env`
4. `npm run agents:light` (grille 8 jobs/jour)
5. **Ne pas** lancer YouTube catch-up sur VPS si GitHub Actions tourne

Systemd (Hermes gateway) :

```bash
# /etc/systemd/system/hermes-gateway.service
[Service]
Environment=HERMES_HOME=/home/USER/.hermes
EnvironmentFile=/home/USER/.hermes/.env
ExecStart=/home/USER/.hermes/hermes-agent/.venv/bin/hermes gateway run
Restart=always
```

## Google Cloud Console — ordre

1. **APIs** → activer YouTube Data API v3
2. **OAuth consent** → app name ProducerHit → scopes `youtube.upload`, `youtube.force-ssl`
3. **Credentials** → OAuth client (Desktop) → `npm run youtube:oauth` sur VPS
4. Copier Client ID + Secret dans `.env` pour chaque compte (ou réutiliser le même client OAuth pour tous les comptes)
5. **Compute** → VM → clé SSH → firewall 22/tcp

## Valeurs déjà connues (ne pas regénérer si tu les as)

- `VITE_SUPABASE_URL` / anon key : Supabase Dashboard → Settings → API
- `SUPABASE_SERVICE_ROLE_KEY` : même page (⚠ jamais dans le frontend)
- `SOCIAL_PUBLISH_CRON_SECRET` : garde la même valeur que prod si déjà en place
