create table if not exists public.client_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  props jsonb,
  path text,
  client_ts timestamptz,
  created_at timestamptz not null default now()
);

alter table public.client_events enable row level security;

create policy "client_events_insert_own" on public.client_events
  for insert
  with check (auth.uid() = user_id);

create policy "client_events_select_own" on public.client_events
  for select
  using (auth.uid() = user_id);

create index if not exists client_events_user_created_idx on public.client_events (user_id, created_at desc);
