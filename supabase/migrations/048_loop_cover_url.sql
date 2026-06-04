-- Cover Pinterest / Storage : colonne dédiée (ACE ne l’écrase pas via stems_url).
alter table public.loops
  add column if not exists cover_url text;

comment on column public.loops.cover_url is
  'URL publique de la cover (Supabase loop-covers). Source de vérité pour l’affichage.';

-- Backfill depuis stems_url.ace.coverUrl (idempotent).
update public.loops l
set cover_url = trim(both from (l.stems_url->'ace'->>'coverUrl'))
where coalesce(l.cover_url, '') = ''
  and coalesce(l.stems_url->'ace'->>'coverUrl', '') ~ '^https?://';
