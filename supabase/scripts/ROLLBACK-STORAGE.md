# Rollback — maintenance Supabase ProducerKit

## 1. Purge Storage (`loop-audio`)

**Règle appliquée :** on ne supprime **jamais** un fichier référencé par `loops.audio_url` ni un fichier dont la loop existe encore.

### Avant purge
```bash
node supabase/scripts/audit-and-purge-storage.mjs --dry-run --orphans-only
```
Génère `supabase/scripts/.storage-purge-manifest.json` (liste des chemins).

### Rollback purge (fichiers supprimés par erreur)
- Supabase Dashboard → **Storage → loop-audio → Enable versioning** (si activé) → restaurer objet
- Sinon : **pas de rollback automatique** — d’où le mode `--orphans-only` par défaut
- Si une loop perd son audio : re-générer via ACE (`stems_url.taskId`) ou ré-uploader avec  
  `VITE_SUPABASE_LOOP_AUDIO_UPLOAD=1` temporairement

### Réactiver upload Storage (ancien comportement)
```env
VITE_SUPABASE_LOOP_AUDIO_UPLOAD=1
```
Redéployer le front. **Rollback code :** retirer la variable ou la mettre à `0`.

---

## 2. Code client (egress / auth)

| Changement | Rollback |
|------------|----------|
| Upload Storage off par défaut | `VITE_SUPABASE_LOOP_AUDIO_UPLOAD=1` |
| Analytics batch (flush 60s) | `git checkout` sur `supabaseClient.ts` + `GrowthBootstrap.tsx` |
| `loadMyLoops` sans `prompt` | revert `loopsStore.ts` fetchMyLoopsRows |
| Auth defer profile sync | revert `authStore.ts` |

Commits locaux non poussés : `git log -5` puis `git revert <sha>`.

---

## 3. Migrations SQL

| Migration | Rollback |
|-----------|----------|
| `028_usage_optimization.sql` | `drop index loops_user_created_idx; drop index loops_public_created_idx; drop function purge_old_analytics_events;` |
| `022–027` profil | Ne pas rollback sans backup — utiliser snapshot Supabase (Pro : **Point-in-time recovery**) |

**Backup Pro :** Dashboard → Database → Backups → restore sur branche dev avant gros changement.

---

## 4. Purge `client_events` (optionnel)

```sql
-- Avant : select count(*) from client_events;
delete from client_events where created_at < now() - interval '90 days';
```
Rollback : impossible sans backup DB.

---

## 5. Vérification post-intervention

1. Login Google + email → plan **studio** sur `info.producermarket@gmail.com`
2. Dashboard → lecture d’une ancienne génération (URL Storage)
3. Dashboard → nouvelle génération (URL ACE)
4. Settings → profil chargé sans toast erreur

SQL rapide :
```sql
select id, plan, email from profiles where email ilike '%producermarket%';
select count(*) filter (where audio_url like '%loop-audio%') from loops;
```
