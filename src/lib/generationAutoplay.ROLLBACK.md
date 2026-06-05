# Rollback — autoplay centralisé (2026-06-05)

## Fichiers ajoutés

- `src/lib/workspacePlaybackQueue.ts`
- `src/lib/generationAutoplay.ts`
- `src/lib/generationAutoplay.ROLLBACK.md` (ce fichier)

## Fichiers modifiés

- `src/stores/playerStore.ts` — `userPlaybackLocked`, `armGenerationAutoplay`, `lockUserPlayback`
- `src/lib/resetClientSession.ts`
- `src/components/AudioPlayer.tsx` — verrou pause
- `src/components/LoopCardItem.tsx` — verrou pause / lecture manuelle
- `src/pages/Dashboard.tsx` — module `generationAutoplay` à la place de la logique inline

## Rollback rapide (git)

Si le comportement pose problème en prod :

```bash
git checkout HEAD -- src/stores/playerStore.ts src/lib/resetClientSession.ts src/components/AudioPlayer.tsx src/components/LoopCardItem.tsx src/pages/Dashboard.tsx
git rm -f src/lib/workspacePlaybackQueue.ts src/lib/generationAutoplay.ts src/lib/generationAutoplay.ROLLBACK.md
```

Puis rebuild / redeploy.

## Rollback partiel (désactiver seulement le verrou utilisateur)

Dans `src/lib/generationAutoplay.ts`, remplacer :

```typescript
function canRunGenerationAutoplay() {
  return !usePlayerStore.getState().userPlaybackLocked;
}
```

par :

```typescript
function canRunGenerationAutoplay() {
  return true;
}
```

Cela restaure l’ancien comportement « autoplay force la reprise » sans retirer la file workspace complète.

## Comportement avant / après

| Scénario | Avant | Après |
|----------|-------|-------|
| Génération terminée | File `[v1, v2]` seulement | File dashboard complète (`displayedLoops`) |
| Fin de piste | Next dans file (2 morceaux max) | Next dans toute la bibliothèque visible |
| Pause utilisateur | v2 pouvait relancer via `!isPlaying` | Verrou — pas de reprise auto |
| Lecture manuelle carte | `queueSource: workspace` | Idem + verrou anti-hijack |

## Tests manuels recommandés

1. Génération ×1 → autoplay immédiat
2. Génération ×2 → v1 puis v2 puis morceau suivant dans la liste
3. Pause pendant v1 → v2 prêt ne relance pas
4. Play manuel sur autre carte pendant génération → pas d’interruption
5. Dashboard mobile v2 + desktop v1
6. Remix / vibe recreate → autoplay avec file complète
