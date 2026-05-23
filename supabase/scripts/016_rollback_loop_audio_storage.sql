-- Rollback manuel pour 016_loop_audio_storage.sql
-- À exécuter dans le SQL Editor Supabase si tu veux annuler la migration 016.
-- Ne touche PAS à la table loops ni aux policies publiques (015).

drop policy if exists "loop_audio_public_read" on storage.objects;
drop policy if exists "loop_audio_auth_insert" on storage.objects;
drop policy if exists "loop_audio_auth_update" on storage.objects;

-- Supprime le bucket seulement s'il est vide (sinon Supabase refusera).
-- Si des fichiers existent : Storage → loop-audio → vider d'abord, puis relancer cette ligne.
delete from storage.buckets where id = 'loop-audio';
