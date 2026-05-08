create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text,
  plan text not null default 'free' check (plan in ('free','pro','studio')),
  loops_used_this_month int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select
  using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert
  with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table if not exists public.loops (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  genre text not null,
  influence text not null,
  key text not null,
  scale text not null,
  bpm int not null,
  loop_length text not null,
  mood text not null,
  energy_level text not null,
  reverb text not null,
  swing int not null default 0,
  prompt text not null default '',
  audio_url text,
  stems_url jsonb,
  is_saved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.loops enable row level security;

create policy "loops_select_own" on public.loops
  for select
  using (auth.uid() = user_id);

create policy "loops_insert_own" on public.loops
  for insert
  with check (auth.uid() = user_id);

create policy "loops_update_own" on public.loops
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "loops_delete_own" on public.loops
  for delete
  using (auth.uid() = user_id);

