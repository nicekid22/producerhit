-- Voice → lyrics (Whisper/Gemini) before ACE-Step Song Mode
-- Trial: Free 2/mo, Pro 5/mo, Studio+ unlimited

alter table public.profiles
  add column if not exists voice_to_song_used_this_month int not null default 0;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'voice-uploads',
  'voice-uploads',
  false,
  12582912,
  array['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/aac', 'audio/flac']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "voice_uploads_owner_read" on storage.objects;
create policy "voice_uploads_owner_read"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'voice-uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "voice_uploads_owner_insert" on storage.objects;
create policy "voice_uploads_owner_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'voice-uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "voice_uploads_owner_delete" on storage.objects;
create policy "voice_uploads_owner_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'voice-uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create or replace function public.voice_to_song_monthly_limit(p_plan text)
returns int
language sql
stable
set search_path = public
as $$
  select case
    when coalesce(p_plan, 'free') in ('studio', 'plus') then 999999
    when coalesce(p_plan, 'free') = 'pro' then 5
    else 2
  end;
$$;

create or replace function public.reset_loops_usage_if_needed()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
    set loops_used_this_month = 0,
        voice_to_song_used_this_month = 0,
        loops_reset_at = now()
  where id = auth.uid()
    and date_trunc('month', loops_reset_at) <> date_trunc('month', now());
end;
$$;

create or replace function public.check_and_consume_voice_to_song()
returns json
language plpgsql
security definer
set search_path = public
as $$
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

  select p.plan, coalesce(p.voice_to_song_used_this_month, 0)
    into plan_name, used_now
  from public.profiles p
  where p.id = uid
  for update;

  plan_name := coalesce(plan_name, 'free');
  limit_now := public.voice_to_song_monthly_limit(plan_name);

  if used_now >= limit_now then
    return json_build_object(
      'ok', false,
      'error', 'limit_reached',
      'plan', plan_name,
      'used', used_now,
      'limit', limit_now,
      'remaining', 0
    );
  end if;

  update public.profiles
    set voice_to_song_used_this_month = voice_to_song_used_this_month + 1
  where id = uid
  returning voice_to_song_used_this_month into used_now;

  limit_now := public.voice_to_song_monthly_limit(plan_name);

  return json_build_object(
    'ok', true,
    'plan', plan_name,
    'used', used_now,
    'limit', limit_now,
    'remaining', greatest(0, limit_now - used_now)
  );
end;
$$;

grant execute on function public.check_and_consume_voice_to_song() to authenticated;
