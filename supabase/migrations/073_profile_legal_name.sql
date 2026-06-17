-- Legal holder name for per-track commercial license certificates (Pro+ exports).

alter table public.profiles
  add column if not exists legal_first_name text,
  add column if not exists legal_last_name text;

comment on column public.profiles.legal_first_name is 'First name on commercial license certificates (private, not public profile).';
comment on column public.profiles.legal_last_name is 'Last name on commercial license certificates (private, not public profile).';

create or replace function public.update_creator_profile(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
  uname text;
  unorm text;
  avatar smallint;
  bio_text text;
  ctype text;
  social_links jsonb;
  legal_first text;
  legal_last text;
begin
  if uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  uname := trim(coalesce(p_payload->>'username', ''));
  if not (p_payload ? 'username') then
    select p.username into uname from public.profiles p where p.id = uid;
  elsif uname <> '' then
    if length(uname) < 3 or length(uname) > 24 then
      return jsonb_build_object('ok', false, 'error', 'username_length');
    end if;
    if uname !~ '^[A-Za-z0-9_]+$' then
      return jsonb_build_object('ok', false, 'error', 'username_format');
    end if;
    unorm := lower(uname);
    if exists (
      select 1 from public.profiles p
      where p.username_norm = unorm and p.id <> uid
    ) then
      return jsonb_build_object('ok', false, 'error', 'username_taken');
    end if;
  else
    uname := null;
  end if;

  if p_payload ? 'avatar_id' then
    avatar := coalesce((p_payload->>'avatar_id')::smallint, 1);
    if avatar < 1 or avatar > 10 then avatar := 1; end if;
  else
    select coalesce(p.avatar_id, 1) into avatar from public.profiles p where p.id = uid;
  end if;

  if p_payload ? 'bio' then
    bio_text := left(trim(coalesce(p_payload->>'bio', '')), 280);
    if bio_text = '' then bio_text := null; end if;
  else
    select p.bio into bio_text from public.profiles p where p.id = uid;
  end if;

  if p_payload ? 'creator_type' then
    ctype := nullif(trim(coalesce(p_payload->>'creator_type', '')), '');
    if ctype is not null and ctype not in (
      'beatmaker', 'producer', 'artist', 'singer', 'youtuber', 'content_creator', 'dj', 'other'
    ) then
      ctype := null;
    end if;
  else
    select p.creator_type into ctype from public.profiles p where p.id = uid;
  end if;

  if p_payload ? 'social' then
    social_links := public.sanitize_creator_social(p_payload->'social');
  else
    select coalesce(p.social, '{}'::jsonb) into social_links from public.profiles p where p.id = uid;
  end if;

  legal_first := left(trim(coalesce(p_payload->>'legal_first_name', '')), 60);
  if legal_first = '' then legal_first := null; end if;
  if legal_first is not null and (length(legal_first) < 2 or legal_first ~ '[0-9@#$%^&*()+={}\[\]|\\;:"<>?/`~]') then
    return jsonb_build_object('ok', false, 'error', 'legal_name_invalid');
  end if;

  legal_last := left(trim(coalesce(p_payload->>'legal_last_name', '')), 60);
  if legal_last = '' then legal_last := null; end if;
  if legal_last is not null and (length(legal_last) < 2 or legal_last ~ '[0-9@#$%^&*()+={}\[\]|\\;:"<>?/`~]') then
    return jsonb_build_object('ok', false, 'error', 'legal_name_invalid');
  end if;

  update public.profiles
  set
    username = uname,
    avatar_id = avatar,
    bio = bio_text,
    creator_type = ctype,
    social = social_links,
    legal_first_name = case when p_payload ? 'legal_first_name' then legal_first else legal_first_name end,
    legal_last_name = case when p_payload ? 'legal_last_name' then legal_last else legal_last_name end
  where id = uid;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'profile_not_found');
  end if;

  return jsonb_build_object(
    'ok', true,
    'profile', jsonb_build_object(
      'username', uname,
      'avatar_id', avatar,
      'bio', bio_text,
      'creator_type', ctype,
      'social', social_links,
      'legal_first_name', legal_first,
      'legal_last_name', legal_last
    )
  );
end;
$$;

revoke all on function public.update_creator_profile(jsonb) from public;
grant execute on function public.update_creator_profile(jsonb) to authenticated;
