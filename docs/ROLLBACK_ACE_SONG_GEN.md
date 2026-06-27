# Rollback — génération chanson ACE (2026-06-27)

Tag Git de secours : **`rollback/pre-ace-song-gen-2026-06-27`** → commit `0479a0f` (état `origin/main` avant ce déploiement).

Deploy tag : **`deploy/ace-song-gen-2026-06-27`** → commit `46a2e4c`.

Edge Supabase `generate-loop-ace` : déployé le 2026-06-27 (CLI `--use-api`, project `pmfnzenqemnonpglmjqx`).

**Push Git en attente** (SSL Windows) — à lancer en local :
```powershell
git push origin main
git push origin rollback/pre-ace-song-gen-2026-06-27 deploy/ace-song-gen-2026-06-27
```
Commits non poussés : `3dba120`, `46a2e4c`.

## Symptômes qui justifient un rollback

- Chansons qui ressortent en pop/ballade alors que le Style demande Drill/Trapsoul
- Paroles squelette `[Intro - Synth Arpeggio]` au lieu de vrais vers
- Idée vide + genre catalogue ne compose plus (régression sample_mode)
- Edge `generate-loop-ace` en 500 après deploy

## 1. Revenir au code (front + shared)

```powershell
cd "C:\Users\dylar\Documents\ProducerKit AI - Cursor 2"
git fetch origin
git checkout rollback/pre-ace-song-gen-2026-06-27 -- packages/shared apps/mobile supabase/functions src/pages/Dashboard.tsx src/lib/audioApi.ts
git commit -m "revert: rollback ACE song generation pipeline to pre-2026-06-27"
git push origin main
```

Ou revert du commit entier (remplacer `COMMIT_SHA` par le hash du commit déployé) :

```powershell
git revert COMMIT_SHA --no-edit
git push origin main
```

Vercel redéploie automatiquement sur push `main`.

## 2. Revenir l’edge function Supabase

Après checkout du tag ou revert :

```powershell
npx supabase functions deploy generate-loop-ace --project-ref pmfnzenqemnonpglmjqx
```

## 3. Vérification post-rollback

1. Idée vide + Melodic Trap → génération OK, pas de structure instrumental en paroles
2. Dé banque + Style Trapsoul → genre cohérent (comportement d’avant le fix)
3. Logs Supabase : `get_logs` edge `generate-loop-ace`, pas d’erreurs ACE 4xx

## Fichiers touchés par le déploiement

- `packages/shared/src/generation/*`, `packages/shared/src/prompt/*`
- `supabase/functions/generate-loop-ace/`, `supabase/functions/_shared/ace*`
- `src/pages/Dashboard.tsx`, `src/lib/audioApi.ts`
- `apps/mobile/app/(tabs)/create.tsx`, `apps/mobile/lib/loopsApi.ts`
