# Génération ACE — stratégies testables

## Défaut actuel

| Paramètre | Valeur | Effet |
|-----------|--------|--------|
| `VITE_ACE_DUAL_MODE` | *(non défini)* | **Parallel** en 1er essai (rapide) |
| Adaptatif | *(activé par défaut)* | Si timeout / 504 / surcharge → **repli séquentiel** sur les slots manquants |
| `VITE_ACE_KEY_STRATEGY` | *(non défini)* → `auto` | v1→clé 0, v2→clé 1 si ×2 |
| `VITE_ACE_V2_PARALLEL_STAGGER_MS` | `500` | Décalage avant v2 en parallel |

**Timeout client :** supprimé — on laisse ACE / l’Edge finir. Pas de double retry sur 504 (évite 2×150 s d’attente). Repli = file séquentielle, pas un 2e parallel.

### Rollback adaptatif

```env
VITE_ACE_DUAL_NO_FALLBACK=1
# ou comportement 100 % stable (plus lent) :
VITE_ACE_DUAL_MODE=sequential
```

---

## Modes ×2 (`VITE_ACE_DUAL_MODE`)

### `parallel` *(défaut — V4 OK)*

```
Prompt
├─ Génération A  (v1)
└─ Génération B  (v2)   ← démarre ~700 ms après v1
```

Les deux appels ACE / Edge tournent **en même temps**.  
Temps total ≈ **1 génération** (+ petit décalage).

### `sequential` *(fallback si 429 / timeouts)*

```env
VITE_ACE_DUAL_MODE=sequential
```

1. v1 terminée  
2. Pause (`VITE_ACE_V2_STAGGER_MS`, défaut 2,5 s)  
3. v2  

Temps total ≈ v1 + pause + v2 — plus lent, parfois plus stable.

### `batch` *(opt-in, 1 seul appel Edge)*

```env
VITE_ACE_DUAL_MODE=batch
```

Un seul appel Edge avec `dualBatch: true` — 2 audios dans une requête `chat/completions`.

---

## Rotation clés (`VITE_ACE_KEY_STRATEGY`)

| Valeur | Comportement |
|--------|----------------|
| `auto` *(défaut)* | Slot 1 → index 0, slot 2 → index 1 ; ×1 → rotation Edge |
| `slot` | Identique à `auto` pour ×2 |
| `rotate` | Nouvelle clé à **chaque** appel |

Clés : `VITE_ACE_STEP_API_KEYS` (client) — `ACE_STEP_API_KEYS` (Edge).

---

## Erreurs réseau / surcharge

Messages utilisateur dans `src/lib/generationErrors.ts` — pas de coupure artificielle côté client.  
Plan **free** : mention de la priorité **Pro** dans la file. Modal upsell `feature_priority` (1× par session).

---

## Comparaison V4 OK vs actuel

| | V4 OK | Actuel défaut |
|--|-------|----------------|
| ×2 | **parallel** + 700 ms | **parallel** + 700 ms |
| Timeout client | ❌ | ❌ |
| Edge chansons | `release_task` → fallback | `chat/completions` |

---

## Si ça coince encore

1. `VITE_ACE_DUAL_MODE=sequential` — plus lent, pas de parallel du tout  
2. `VITE_ACE_DUAL_NO_FALLBACK=1` — désactive le repli auto  
3. `VITE_ACE_DUAL_FAST_PATH=batch` — 1 requête Edge, 2 audios (peut dépasser 150 s sur chansons longues)  
4. `VITE_ACE_KEY_STRATEGY=rotate` — saturation clé  

Logs dev : `[generate] strategy`, `[generate] dual fallback → sequential`.

## Déploiement Edge

```bash
supabase functions deploy generate-loop-ace
```
