# Génération async + Realtime

## Architecture

1. **start_job** — Edge crée une ligne `generation_jobs`, lance **run_job** en arrière-plan, répond en <2s avec `{ jobId }`.
2. **run_job** — Tente `release_task` ACE (poll côté client) ; sinon `chat/completions` (jusqu’à 150s).
3. **poll_job** — Client toutes les **3s** ; si `ace_task_id`, avance le poll ACE et complète le job.
4. **Realtime** — `postgres_changes` sur `generation_jobs` → MP3 prêt sans attendre le poll.

## Variables

| Variable | Où | Défaut | Effet |
|----------|-----|--------|--------|
| `VITE_ACE_ASYNC_JOBS` | Client | `0` (mettre `1` après deploy SQL+Edge) | Jobs async + Realtime |
| `VITE_ACE_JOB_POLL_MS` | Client | `3000` | Intervalle poll |
| `VITE_ACE_JOB_TIMEOUT_MS` | Client | *(off)* | Plafond attente job — défaut **aucun** (comme local) |
| `VITE_ACE_POLL_TIMEOUT_MS` | Client | *(off)* | Plafond poll ACE navigateur — défaut **aucun** |
| `ACE_ASYNC_JOBS` | Edge secret | `1` | `start_job` / `poll_job` |
| `ACE_ASYNC_TRY_RELEASE_TASK` | Edge | `1` | `release_task` + poll (pas de mur 150s visible) |
| `ACE_INTERNAL_JOB_SECRET` | Edge | *(requis)* | Sécurise `run_job` |
| `VITE_ACE_DUAL_BATCH_PROD` | Client | `0` | ×2 en 1 appel Edge (`batch`) |
| `VITE_ACE_DUAL_FAST_PATH` | Client | `parallel` | Override chemin rapide |

## Déploiement

```bash
# SQL
supabase db push   # migration 046_generation_jobs.sql

# Secrets Edge
supabase secrets set ACE_INTERNAL_JOB_SECRET=<random-32-chars>
supabase secrets set ACE_ASYNC_JOBS=1
supabase secrets set ACE_ASYNC_TRY_RELEASE_TASK=1

supabase functions deploy generate-loop-ace

# Vercel (exemple)
# VITE_ACE_ASYNC_JOBS=1
# VITE_ACE_DUAL_BATCH_PROD=0   # activer après tests chansons longues
```

## Plan free — Versions ×1

Sans `producerhit_versions` en localStorage, le Dashboard force **1 version** pour `plan === free``.

## Rollback

```env
VITE_ACE_ASYNC_JOBS=0
ACE_ASYNC_JOBS=0
```

Le client repasse sur l’appel Edge synchrone classique.
