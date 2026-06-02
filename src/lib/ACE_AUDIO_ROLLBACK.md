# Rollback — audio ACE simplifié (~7 jours, sans Storage)

## Comportement (2026 — sans bucket loop-audio)

1. **Génération** → ACE `/v1/chat/completions` (navigateur direct si `VITE_ACE_STEP_API_KEY`, sinon Edge)
2. **`release_task` / `query_result`** → **404** sur `api.acemusic.ai` — **désactivé par défaut**
3. Réponse chat → audio **base64 MP3** (`data:audio/mpeg;...`) — pas d’URL HTTP ACE
4. **Tracks publiques** → `createLoop` attend l’écriture `stream_public` + `provider_audio_inline` (migration 039)
5. **Communauté** → `audio_url` = flux Edge `?action=stream_public&loopId=...` (lecture `<audio>` native, pas blob 25 Mo)
6. **Pas d’upload bucket `loop-audio`** — économise Storage (100 Go) ; inline en Postgres (~3–8 Mo/track MP3)

## Multi-clés ACE

- `.env` : **`ACE_STEP_API_KEYS=key1,key2,...`** (une ligne)
- Supabase secrets : `ACE_STEP_API_KEYS`
- Rotation Edge uniquement (front direct = une clé `VITE_ACE_STEP_API_KEY`)

## Stream communauté (migration 039)

- `provider_audio_inline` : data URL MP3 — lu par `GET generate-loop-ace?action=stream_public&loopId=...`
- `audio_url` en DB = URL de ce flux (pas le base64 dans les listings publics)

## Rollback rapide (sans git)

| Variable | Où | Effet |
|----------|-----|--------|
| `VITE_ACE_RELEASE_TASK=1` | Front `.env` | Réactive `release_task` + polling (legacy, 404 probable) |
| `ACE_RELEASE_TASK=1` | Supabase secret Edge | Idem côté `generate-loop-ace` (beats) |
| `VITE_PUBLIC_ACE_STREAM=0` | Front | Pas de `stream_public` ni `provider_audio_inline` |
| `VITE_LOOP_ACE_PERSIST=0` | Front | Skip tout update post-insert |
| `VITE_SUPABASE_LOOP_AUDIO_UPLOAD=0` | Front | Pas d’upload client Storage (défaut) |
| `VITE_AUDIO_BLOB_PLAYBACK=0` | Front | Pas de conversion blob |
| `VITE_AUDIO_SKIP_WEB_AUDIO=1` | Front | Sortie `<audio>` sans visualizer |

Redéployer le front Vercel + Edge `generate-loop-ace` après changement d’env secrets.

## Rollback code (git)

Fichiers sensibles :

- `src/lib/aceQuality.ts` — `isAceReleaseTaskEnabled()`
- `src/lib/audioApi.ts` — chemin chat vs release_task
- `src/stores/loopsStore.ts` — `createLoop` (persist public synchrone)
- `src/lib/publicLoops.ts` — `persistLoopAceAudioRecord`
- `src/lib/publicAcePlayback.ts` — `isPublicAceStreamEnabled`
- `src/lib/loopWorkspaceUtils.ts` — dédoublonnage previews Dashboard
- `src/pages/Dashboard.tsx` — MP3 par défaut, nettoyage preview post-save
- `supabase/functions/generate-loop-ace/index.ts` — chat-only beats, `stream_public` GET

## Vérification

1. Générer une track publique → **une seule** carte dans le Dashboard (pas de doublon preview + sauvegardée)
2. Écoute OK dans le Dashboard
3. Supabase `loops` : `is_public=true`, `audio_url` contient `stream_public`, `provider_audio_inline` commence par `data:audio/mpeg`
4. Explore / Landing → track visible avec `playableOnly: true`
5. Aucun nouveau fichier dans bucket `loop-audio`
