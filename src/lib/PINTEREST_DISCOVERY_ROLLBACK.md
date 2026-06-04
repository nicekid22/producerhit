# Pinterest covers — rollback

## Comportement (2026)

### Workspace (recommandé) — Pinterest persist **actif par défaut**

À chaque **création de loop** (`assignLoopCoverOnce` — une seule promesse in-flight par `loopId`) :

1. `discoverPinterestCoverTerms` → requête de recherche
2. **Un seul** appel Edge `persist-pinterest-cover` :
   - 1 recherche Pinterest (~24 images, **une** page API)
   - Tirage **aléatoire déterministe** (seed = loopId + query), pas « toujours la 1ère »
   - Exclusion **globale** (`used_pinterest_covers.url_hash`, 7 jours, tous utilisateurs)
   - Pinimg legacy en DB → **même** image uploadée en Storage (pas de nouvelle recherche)
   - Fallback `fetch-pinterest-cover` : opt-in `VITE_PINTEREST_PINIMG_FALLBACK=1` uniquement
   - Session client : `pinterestCoverDedup.ts` (évite doublons avant écriture)
   - Backfill au load workspace : **désactivé** par défaut (`VITE_PINTEREST_BACKFILL=1` pour anciens morceaux)
   - Hash normalisé pinimg (ignore `/236x/` vs `/736x/` — même visuel)
   - Téléchargement **serveur** → upload `loop-covers/{userId}/covers/{loopId}.jpg`
   - `stems_url.ace.coverUrl` = URL Supabase publique
3. Affichage partout via `resolveLoopDisplayCoverUrl` — **même URL** (Storage ou Pollinations stable) sur workspace, community, landing, détail, player
4. **Plus de lazy** `fetch-pinterest-cover` quand `PINTEREST_PERSIST_COVERS` / `UNIFIED_STORED_COVERS` est actif

**Egress réduit** : plus d’appel Edge à chaque scroll / panneau détails.

Purge 7j : `purge-loop-audio` supprime aussi les fichiers `loop-covers/.../covers/{loopId}.*`.

### Legacy (test uniquement si persist désactivé)

- **Lazy Pinterest** : `VITE_LANDING_PINTEREST_COVERS=1` ou `VITE_COMMUNITY_PINTEREST_FOREGROUND=1` **sans** persist
- **Preview termes** : `VITE_PINTEREST_DISCOVERY_PREVIEW=1`

## Rollback persist

```env
VITE_PINTEREST_PERSIST_COVERS=0
VITE_COMMUNITY_PINTEREST_FOREGROUND=0
```

Redémarrer le dev server. Les cartes repassent sur Pollinations / lazy si les autres flags sont actifs.

## Déploiement

```bash
supabase db push   # migration 043_used_pinterest_covers
supabase functions deploy persist-pinterest-cover
supabase functions deploy purge-loop-audio
```

## Activer / désactiver

Par défaut **aucune variable** : Pinterest persist ON, Pollinations OFF.

```env
# Désactiver tout le flux Pinterest Storage :
VITE_PINTEREST_PERSIST_COVERS=0

# Réactiver Pollinations (debug uniquement) :
(Pollinations covers retirés — Pinterest Storage uniquement)
```

Au chargement du workspace, les **anciens morceaux** sans cover Storage sont backfillés en arrière-plan (max ~40 / session).
