-- Voice clone profiles (ACE reference_audio timbre) + monthly clone generation quota

alter table public.profiles
  add column if not exists voice_clone_used_this_month int not null default 0;

create table if not exists public.voice_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null default 'Ma voix',
  storage_path text not null,
  sample_sec numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists voice_profiles_user_id_idx on public.voice_profiles (user_id, created_at desc);

alter table public.voice_profiles enable row level security;

drop policy if exists "voice_profiles_owner_select" on public.voice_profiles;
create policy "voice_profiles_owner_select"
  on public.voice_profiles for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "voice_profiles_owner_insert" on public.voice_profiles;
create policy "voice_profiles_owner_insert"
  on public.voice_profiles for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "voice_profiles_owner_update" on public.voice_profiles;
create policy "voice_profiles_owner_update"
  on public.voice_profiles for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "voice_profiles_owner_delete" on public.voice_profiles;
create policy "voice_profiles_owner_delete"
  on public.voice_profiles for delete to authenticated
  using (user_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'voice-profiles',
  'voice-profiles',
  false,
  12582912,
  array['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/ogg', 'audio/aac', 'audio/flac']
)
on conflict (id) do update
set file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "voice_profiles_storage_read" on storage.objects;
create policy "voice_profiles_storage_read"
  on storage.objects for select to authenticated
  using (bucket_id = 'voice-profiles' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "voice_profiles_storage_insert" on storage.objects;
create policy "voice_profiles_storage_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'voice-profiles' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "voice_profiles_storage_delete" on storage.objects;
create policy "voice_profiles_storage_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'voice-profiles' and auth.uid()::text = (storage.foldername(name))[1]);

create or replace function public.voice_profile_max_count(p_plan text)
returns int
language sql stable set search_path = public as $$
  select case
    when coalesce(p_plan, 'free') in ('studio', 'plus') then 10
    when coalesce(p_plan, 'free') = 'pro' then 2
    else 1
  end;
$$;

create or replace function public.voice_clone_monthly_limit(p_plan text)
returns int
language sql stable set search_path = public as $$
  select case
    when coalesce(p_plan, 'free') in ('studio', 'plus') then 999999
    when coalesce(p_plan, 'free') = 'pro' then 3
    else 1
  end;
$$;

create or replace function public.reset_loops_usage_if_needed()
returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.profiles
    set loops_used_this_month = 0,
        voice_to_song_used_this_month = 0,
        voice_clone_used_this_month = 0,
        loops_reset_at = now()
  where id = auth.uid()
    and date_trunc('month', loops_reset_at) <> date_trunc('month', now());
end;
$$;

create or replace function public.check_and_consume_voice_clone()
returns json
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  plan_name text;
  used_now int;
  limit_now int;
begin
  if uid is null then
    return json_build_object('ok', false, 'error', 'unauthorized');
  end if;

  perform public.reset_loops_usage_if_needed();

  select p.plan, coalesce(p.voice_clone_used_this_month, 0)
    into plan_name, used_now
  from public.profiles p
  where p.id = uid
  for update;

  plan_name := coalesce(plan_name, 'free');
  limit_now := public.voice_clone_monthly_limit(plan_name);

  if used_now >= limit_now then
    return json_build_object(
      'ok', false,
      'error', 'clone_limit_reached',
      'plan', plan_name,
      'used', used_now,
      'limit', limit_now,
      'remaining', 0
    );
  end if;

  update public.profiles
    set voice_clone_used_this_month = voice_clone_used_this_month + 1
  where id = uid
  returning voice_clone_used_this_month into used_now;

  limit_now := public.voice_clone_monthly_limit(plan_name);

  return json_build_object(
    'ok', true,
    'plan', plan_name,
    'used', used_now,
    'limit', limit_now,
    'remaining', greatest(0, limit_now - used_now)
  );
end;
$$;

grant execute on function public.check_and_consume_voice_clone() to authenticated;
