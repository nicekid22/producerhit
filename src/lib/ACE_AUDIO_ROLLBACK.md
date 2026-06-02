# Rollback — audio ACE + Supabase Storage (7 jours)

## Comportement (2026)

1. **Génération** → ACE `/v1/chat/completions` (navigateur direct si `VITE_ACE_STEP_API_KEY`, sinon Edge)
2. **`release_task`** → désactivé par défaut (404 ACE)
3. Réponse chat → MP3 base64 (`data:audio/mpeg;...`)
4. **Persist** → upload **bucket `loop-audio`** (`{userId}/{loopId}.mp3`) si `VITE_SUPABASE_LOOP_AUDIO_UPLOAD` ≠ `0` (défaut **activé**)
5. **DB** → `audio_url` = URL Storage publique ; `provider_audio_inline` = **null** (pas de Mo en Postgres)
6. **Fallback** → si upload échoue : `stream_public` + `provider_audio_inline` (legacy)
7. **Rétention** → purge automatique après **7 jours** (Edge `purge-loop-audio` + cron)
8. **Communauté** → lecture `<audio>` directe sur URL Storage (pas Edge blob)

## Variables

| Variable | Où | Effet |
|----------|-----|--------|
| `VITE_SUPABASE_LOOP_AUDIO_UPLOAD=0` | Front | Pas d’upload Storage → fallback inline |
| `VITE_PUBLIC_ACE_STREAM=0` | Front | Pas de stream_public ni inline |
| `VITE_LOOP_AUDIO_RETENTION_DAYS=7` | Front | Badges + filtres communauté (0 = masquer) |
| `LOOP_AUDIO_RETENTION_DAYS` | Secret Edge purge | Idem côté purge |
| `CRON_SECRET` | Secret Edge purge | Header `x-cron-secret` pour cron Supabase |
| `VITE_LOOP_ACE_PERSIST=0` | Front | Skip persist post-insert |

## Ops

```bash
# Migration 041 (list_expired + policy delete)
npm run db:migrate:039

# Migrer inline Postgres → Storage
npm run storage:migrate-inline

# Purge manuelle (> 7j)
npm run storage:purge

# Déploiement
supabase functions deploy purge-loop-audio --project-ref pmfnzenqemnonpglmjqx
```

**Cron Supabase** (Dashboard → Edge Functions → purge-loop-audio) : `0 4 * * *`  
Headers : `x-cron-secret: <CRON_SECRET>`

## Rollback rapide

1. `VITE_SUPABASE_LOOP_AUDIO_UPLOAD=0` + redeploy Vercel  
2. Réactiver inline si besoin (`VITE_PUBLIC_ACE_STREAM` laissé à 1)

## Vérification

1. Générer une track → `loops.audio_url` contient `/loop-audio/`  
2. `provider_audio_inline` vide en DB  
3. Dashboard : bandeau info 7 jours visible  
4. Communauté : play OK via URL Storage  
5. Après purge : badge « Audio expiré », plus de play
