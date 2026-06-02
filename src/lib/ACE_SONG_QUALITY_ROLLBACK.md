# Rollback — qualité mode Chanson (ACE v2)

## Comportement activé (v2)

- **Chanson** tente d’abord `/release_task` + `/query_result` avec les mêmes leviers qualité que les beats :
  - `thinking: true`, `use_format: true` (sauf mode sample / paroles IA auto)
  - `shift: 3`, `inference_steps: 8` dans `param_obj`
  - modèle `acestep-v15-xl-turbo`, durée par défaut ~90 s
- Si `release_task` échoue → **fallback** `/v1/chat/completions` enrichi (même modèle + flags qualité)
- **Beat** : inchangé (release_task, fallback chat uniquement sur 404)

## Rollback rapide (sans git)

| Variable | Où | Effet |
|----------|-----|--------|
| `VITE_ACE_SONG_QUALITY_V2=0` | Front Vercel / `.env` | Chanson repasse en **chat/completions only** (comportement avant v2) |
| `ACE_SONG_QUALITY_V2=0` | Supabase Edge secrets | Idem côté `generate-loop-ace` |

Redéployer front + edge function après changement.

## Rollback code (git)

```bash
git log -5 --oneline -- src/lib/aceQuality.ts supabase/functions/generate-loop-ace/index.ts src/lib/audioApi.ts src/pages/Dashboard.tsx
git revert <sha-song-quality-v2>
```

Puis :

```bash
npx supabase functions deploy generate-loop-ace --project-ref pmfnzenqemnonpglmjqx
```

## Vérification post-rollback

1. Mode **Chanson** → générer → logs edge : `Song mode — chat/completions only (legacy)`
2. Pas d’appel `release_task` pour les chansons (instrumental=false)
3. Beats toujours OK via release_task
