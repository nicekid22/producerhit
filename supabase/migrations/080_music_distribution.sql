-- Music distribution via LabelGrid white-label API (Studio/Plus singles MVP)

create table if not exists public.distribution_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  labelgrid_artist_id text,
  default_artist_name text,
  default_label_name text default 'ProducerHit',
  terms_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.distribution_releases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  loop_id uuid not null references public.loops (id) on delete cascade,
  release_type text not null default 'single'
    check (release_type in ('single', 'ep', 'album')),
  title text not null,
  artist_name text not null,
  featuring text[] not null default '{}',
  genre_labelgrid_id text,
  genre_name text,
  language_code text not null default 'en',
  explicit boolean not null default false,
  release_date date,
  cover_storage_path text,
  audio_storage_path text,
  labelgrid_release_id text,
  labelgrid_track_id text,
  isrc text,
  upc text,
  status text not null default 'draft'
    check (status in ('draft', 'preparing', 'submitted', 'in_review', 'live', 'rejected', 'failed')),
  status_detail jsonb not null default '{}'::jsonb,
  submitted_at timestamptz,
  live_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists distribution_releases_user_created_idx
  on public.distribution_releases (user_id, created_at desc);

create index if not exists distribution_releases_loop_idx
  on public.distribution_releases (loop_id);

create index if not exists distribution_releases_status_idx
  on public.distribution_releases (status)
  where status in ('submitted', 'in_review');

create unique index if not exists distribution_releases_loop_active_uidx
  on public.distribution_releases (loop_id)
  where status in ('preparing', 'submitted', 'in_review', 'live');

create table if not exists public.distribution_outlet_status (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references public.distribution_releases (id) on delete cascade,
  outlet_slug text not null,
  outlet_name text not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'live', 'rejected', 'takedown')),
  external_url text,
  updated_at timestamptz not null default now(),
  constraint distribution_outlet_status_release_outlet_key unique (release_id, outlet_slug)
);

create index if not exists distribution_outlet_status_release_idx
  on public.distribution_outlet_status (release_id);

create table if not exists public.distribution_events (
  id uuid primary key default gen_random_uuid(),
  release_id uuid references public.distribution_releases (id) on delete set null,
  user_id uuid references public.profiles (id) on delete set null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists distribution_events_release_idx
  on public.distribution_events (release_id, created_at desc);

create table if not exists public.distribution_usage (
  user_id uuid not null references public.profiles (id) on delete cascade,
  month_key text not null,
  releases_used int not null default 0,
  primary key (user_id, month_key)
);

-- Private bucket for prepared WAV/cover assets (service role only)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'distribution-assets',
  'distribution-assets',
  false,
  104857600,
  array['audio/wav', 'audio/mpeg', 'audio/mp3', 'image/jpeg', 'image/png']
)
on conflict (id) do nothing;

alter table public.distribution_profiles enable row level security;
alter table public.distribution_releases enable row level security;
alter table public.distribution_outlet_status enable row level security;
alter table public.distribution_events enable row level security;
alter table public.distribution_usage enable row level security;

create policy "distribution_profiles_select_own"
  on public.distribution_profiles for select
  using (auth.uid() = user_id);

create policy "distribution_profiles_insert_own"
  on public.distribution_profiles for insert
  with check (auth.uid() = user_id);

create policy "distribution_profiles_update_own"
  on public.distribution_profiles for update
  using (auth.uid() = user_id);

create policy "distribution_releases_select_own"
  on public.distribution_releases for select
  using (auth.uid() = user_id);

create policy "distribution_outlet_status_select_own"
  on public.distribution_outlet_status for select
  using (
    exists (
      select 1 from public.distribution_releases r
      where r.id = release_id and r.user_id = auth.uid()
    )
  );

create policy "distribution_usage_select_own"
  on public.distribution_usage for select
  using (auth.uid() = user_id);

create or replace function public.distribution_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists distribution_profiles_touch on public.distribution_profiles;
create trigger distribution_profiles_touch
  before update on public.distribution_profiles
  for each row execute function public.distribution_touch_updated_at();

drop trigger if exists distribution_releases_touch on public.distribution_releases;
create trigger distribution_releases_touch
  before update on public.distribution_releases
  for each row execute function public.distribution_touch_updated_at();

drop trigger if exists distribution_outlet_status_touch on public.distribution_outlet_status;
create trigger distribution_outlet_status_touch
  before update on public.distribution_outlet_status
  for each row execute function public.distribution_touch_updated_at();

create or replace function public.distribution_monthly_quota(p_plan text)
returns int
language sql
immutable
as $$
  select case
    when p_plan = 'plus' then 5
    when p_plan = 'studio' then 2
    else 0
  end;
$$;

create or replace function public.check_and_consume_distribution_quota(p_release_id uuid)
returns table(ok boolean, plan text, used int, quota int, error_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  plan_name text;
  month_k text := to_char(now() at time zone 'utc', 'YYYY-MM');
  used_now int;
  quota_now int;
begin
  if uid is null then
    return query select false, 'free'::text, 0, 0, 'not_authenticated'::text;
    return;
  end if;

  select p.plan into plan_name
  from public.profiles p
  where p.id = uid
  for update;

  plan_name := coalesce(plan_name, 'free');
  quota_now := public.distribution_monthly_quota(plan_name);

  if quota_now <= 0 then
    return query select false, plan_name, 0, 0, 'plan_not_eligible'::text;
    return;
  end if;

  select coalesce(du.releases_used, 0) into used_now
  from public.distribution_usage du
  where du.user_id = uid and du.month_key = month_k;

  used_now := coalesce(used_now, 0);

  if used_now >= quota_now then
    return query select false, plan_name, used_now, quota_now, 'quota_exceeded'::text;
    return;
  end if;

  insert into public.distribution_usage (user_id, month_key, releases_used)
  values (uid, month_k, 1)
  on conflict (user_id, month_key)
  do update set releases_used = distribution_usage.releases_used + 1;

  return query select true, plan_name, used_now + 1, quota_now, null::text;
end;
$$;

revoke all on function public.check_and_consume_distribution_quota(uuid) from public;
grant execute on function public.check_and_consume_distribution_quota(uuid) to authenticated;

create or replace function public.get_distribution_usage_summary()
returns table(plan text, used int, quota int, month_key text)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  plan_name text;
  month_k text := to_char(now() at time zone 'utc', 'YYYY-MM');
  used_now int;
  quota_now int;
begin
  if uid is null then
    return;
  end if;

  select p.plan into plan_name from public.profiles p where p.id = uid;
  plan_name := coalesce(plan_name, 'free');
  quota_now := public.distribution_monthly_quota(plan_name);

  select coalesce(du.releases_used, 0) into used_now
  from public.distribution_usage du
  where du.user_id = uid and du.month_key = month_k;

  return query select plan_name, coalesce(used_now, 0), quota_now, month_k;
end;
$$;

revoke all on function public.get_distribution_usage_summary() from public;
grant execute on function public.get_distribution_usage_summary() to authenticated;

create or replace function public.accept_distribution_terms()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  insert into public.distribution_profiles (user_id, terms_accepted_at)
  values (uid, now())
  on conflict (user_id) do update
    set terms_accepted_at = coalesce(distribution_profiles.terms_accepted_at, excluded.terms_accepted_at),
        updated_at = now();

  return jsonb_build_object('ok', true, 'accepted_at', now());
end;
$$;

revoke all on function public.accept_distribution_terms() from public;
grant execute on function public.accept_distribution_terms() to authenticated;
