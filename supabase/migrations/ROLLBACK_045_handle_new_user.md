# Rollback migration 045

Si `045_handle_new_user_hardening.sql` pose problème, réappliquer la version 024 :

```sql
-- Copier le corps de handle_new_user + generate_referral_code depuis
-- supabase/migrations/024_profile_email_sync.sql (lignes 19–61)

drop function if exists public.repair_missing_profile();
```

Puis redéployer l’app (messages auth inchangés côté client).
