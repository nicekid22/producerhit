# Rapport vérification Supabase — ProducerKit

**Date :** 2026-05-28  
**Projet :** ProducerKit (`pmfnzenqemnonpglmjqx`) — **ACTIVE_HEALTHY** (Pro)

## État projet

| Check | Résultat |
|-------|----------|
| API accessible | ✅ (plus de restriction quota) |
| Profil principal | ✅ `info.producermarket@gmail.com` → **plan studio** |
| RPC profil | ✅ `load_session_profile`, `reconcile_profile_by_email`, `ensure_profile`, `sync_profile_plan_from_billing` |
| Migration 028 (indexes + purge fn) | ✅ `purge_old_analytics_events` présente |

## Loops & audio

| Métrique | Valeur |
|----------|--------|
| Total loops | **1820** |
| `audio_url` → bucket Storage | **324** ← **à conserver** |
| `audio_url` → URL externe (ACE) | **23** |
| Reste (vide / résolution ACE via stems) | ~1473 |

## Bucket `loop-audio`

| Métrique | Valeur |
|----------|--------|
| Fichiers | **326** |
| Taille totale | **~8,5 GB** |

**Conclusion :** la quasi-totalité du bucket sert encore des loops actives (324 URLs Storage).  
**Purge agressive = casse l’audio utilisateur.**

### Purge exécutée (2026-05-28)

| Catégorie | Nombre |
|-----------|--------|
| Orphelins (fichier sans loop) | **0** |
| Redondants (loop URL externe + fichier bucket) | **0** |
| Fichiers gardés (loop existe, URL vide) | **2** |
| **Fichiers supprimés** | **0** |

Aucune suppression : tout le bucket est encore utile ou lié à une loop.

## Migrations enregistrées (historique)

Dashboard liste jusqu’à `017` + `999` — les fonctions **022–028** existent en DB (appliquées hors historique ou manuellement). Pas de re-application automatique pour éviter conflits.

## Recommandations

1. **Ne pas vider le bucket** — les anciennes générations en dépendent  
2. **Nouvelles générations** : URLs ACE only (code déjà en place, upload off)  
3. **Egress** : baissera surtout si les users écoutent via cache local + moins de re-fetch (optimisations code)  
4. **DB 182 MB loops** : option future = trim `stems_url` lyrics (migration dédiée, avec backup)  
5. **Sécurité** (warnings linter) : RPC `SECURITY DEFINER` exposées à `anon` — à durcir plus tard, pas urgent pour prod solo

## Commandes utiles

```bash
# Audit sans rien supprimer
node supabase/scripts/audit-and-purge-storage.mjs --dry-run --orphans-only

# Purge orphelins seulement (+ manifeste JSON)
node supabase/scripts/audit-and-purge-storage.mjs --orphans-only
```

Voir `ROLLBACK-STORAGE.md` pour retour arrière.
