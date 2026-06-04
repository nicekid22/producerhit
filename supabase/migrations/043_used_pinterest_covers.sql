-- Covers Pinterest persistées : dédup par utilisateur (évite la même pinimg deux fois).
-- Nettoyage : purge-loop-audio supprime les fichiers loop-covers ; les lignes ici peuvent rester pour historique court.

create table if not exists public.used_pinterest_covers (
  user_id uuid not null references auth.users (id) on delete cascade,
  url_hash text not null,
  source_url text not null,
  loop_id uuid references public.loops (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (user_id, url_hash)
);

create index if not exists used_pinterest_covers_user_created_idx
  on public.used_pinterest_covers (user_id, created_at desc);

comment on table public.used_pinterest_covers is
  'URLs Pinterest source déjà assignées à une cover (dédup 7j côté Edge).';

alter table public.used_pinterest_covers enable row level security;

-- Aucune policy client : lecture/écriture via service role (Edge Functions) uniquement.

create or replace function public.prune_used_pinterest_covers(p_retention_days int default 7)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count int;
begin
  delete from public.used_pinterest_covers
  where created_at < now() - make_interval(days => greatest(1, p_retention_days));
  get diagnostics deleted_count = ROW_COUNT;
  return deleted_count;
end;
$$;

comment on function public.prune_used_pinterest_covers(int) is
  'Supprime les entrées de dédup Pinterest plus anciennes que p_retention_days.';
