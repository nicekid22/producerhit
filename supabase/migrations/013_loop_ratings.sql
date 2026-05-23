create table if not exists public.loop_ratings (
  id uuid primary key default gen_random_uuid(),
  loop_id uuid not null references public.loops (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (loop_id, user_id)
);

create index if not exists loop_ratings_loop_id_idx on public.loop_ratings (loop_id);
create index if not exists loop_ratings_user_id_idx on public.loop_ratings (user_id);

alter table public.loop_ratings enable row level security;

create or replace function public.set_loop_ratings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_loop_ratings_updated_at on public.loop_ratings;
create trigger set_loop_ratings_updated_at
  before update on public.loop_ratings
  for each row execute procedure public.set_loop_ratings_updated_at();

drop policy if exists "loop_ratings_select_all" on public.loop_ratings;
create policy "loop_ratings_select_all" on public.loop_ratings
  for select
  using (true);

drop policy if exists "loop_ratings_insert_own" on public.loop_ratings;
create policy "loop_ratings_insert_own" on public.loop_ratings
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "loop_ratings_update_own" on public.loop_ratings;
create policy "loop_ratings_update_own" on public.loop_ratings
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "loop_ratings_delete_own" on public.loop_ratings;
create policy "loop_ratings_delete_own" on public.loop_ratings
  for delete
  using (auth.uid() = user_id);
