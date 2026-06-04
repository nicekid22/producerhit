-- Index pour dédup globale des covers Pinterest (url_hash sur fenêtre 7j, toutes users).
create index if not exists used_pinterest_covers_hash_created_idx
  on public.used_pinterest_covers (url_hash, created_at desc);

comment on index public.used_pinterest_covers_hash_created_idx is
  'Accélère loadGlobalUsedUrlHashes (Edge persist/fetch-pinterest-cover).';
