# Pinterest discovery (termes classés) — rollback

## Comportement

- **Termes classés** : `src/lib/pinterestDiscovery.ts` (preview console workspace).
- **Images Pinterest réelles (test landing)** : `src/lib/pinterestCoverFetch.ts` + Edge `fetch-pinterest-cover`
  - Uniquement les **2 cartes latérales** du générateur si `VITE_LANDING_PINTEREST_COVERS=1`
  - Recherche Pinterest avec `VITE_LANDING_PINTEREST_SEARCH_TAGS=streetwear,girl`
  - **Pas** de nouveau prompt Pollinations — fallback = cover d’origine si échec
  - Cache session 30 min → rechargement rapide

## Rollback immédiat (prod / dev)

1. `.env` / Vercel : retirer ou `VITE_PINTEREST_DISCOVERY_PREVIEW=0`
2. Redéployer / redémarrer `npm run dev`

## Rollback complet (supprimer la feature)

1. `VITE_PINTEREST_DISCOVERY_PREVIEW=0`
2. Supprimer :
   - `src/lib/pinterestDiscovery.ts`
   - `src/lib/pinterestDiscovery.test.ts`
   - `src/lib/PINTEREST_DISCOVERY_ROLLBACK.md`
3. Dans `src/lib/featureFlags.ts` : retirer `PINTEREST_DISCOVERY_PREVIEW`
4. Dans `src/stores/loopsStore.ts` : retirer l’import + appel `previewPinterestDiscoveryIfEnabled`
5. Dans `.env.example` : retirer la ligne du flag

Les cartes et `coverArt.ts` ne sont pas modifiés par ce test.

## Activer le test

**Images Pinterest — 2 cartes générateur landing** :

```env
VITE_LANDING_PINTEREST_COVERS=1
VITE_LANDING_PINTEREST_SEARCH_TAGS=streetwear,girl
supabase functions deploy fetch-pinterest-cover
```

**Console après génération workspace** :

```env
VITE_PINTEREST_DISCOVERY_PREVIEW=1
```

Génère un morceau → ouvre la console navigateur → groupe `[ProducerHit] Pinterest discovery`.

Console manuelle :

```js
__phDiscoverPinterest({ id: "test", genre: "Trap", mood: "Dark", prompt: "", name: "Demo", seed: 1 })
```
