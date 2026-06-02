-- Index pour réduire charge CPU/IO sur listings loops (à appliquer quand Postgres est stable).

create index if not exists loops_user_id_created_at_idx
  on public.loops (user_id, created_at desc);

create index if not exists loops_public_created_at_idx
  on public.loops (created_at desc)
  where is_public = true and audio_url is not null;
