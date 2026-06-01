# Rollback — persistance audio ACE (sans Storage)

## Comportement activé

- URLs HTTP ACE + `stems_url.ace.taskId` persistés en DB pour **toutes** les tracks à la création
- Edge Function : multi-base `release_task` avant fallback `chat/completions`
- Extraction `path` / `taskId` depuis les réponses `chat/completions`
- Badge UI expiration 7 jours (configurable)

## Rollback rapide (sans git)

| Variable | Effet |
|----------|--------|
| `VITE_LOOP_ACE_PERSIST=0` | Désactive la persistance ACE post-`createLoop` (comportement partiel ancien) |
| `VITE_LOOP_AUDIO_RETENTION_DAYS=0` | Masque les badges expiration |
| `VITE_SUPABASE_LOOP_AUDIO_UPLOAD=0` | Storage off (déjà le défaut) |

Redéployer le front Vercel après changement d'env.

## Rollback code (git)

```bash
git log -5 --oneline
git revert <sha-persistance-ace>
```

Puis redéployer :

1. Front Vercel
2. Edge Function : `npx supabase functions deploy generate-loop-ace --project-ref pmfnzenqemnonpglmjqx`

## Edge Function seule

Si seul le parsing chat/completions pose problème, revert uniquement :

- `supabase/functions/generate-loop-ace/index.ts`

## Vérification post-rollback

1. Générer une track → vérifier `loops.audio_url` (HTTP ou NULL)
2. Login autre navigateur → Play
3. Pas d'upload vers bucket `loop-audio`
