-- Fix: PL/pgSQL variable `social` shadowed column `profiles.social` → save profile 400

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
begin
  if uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  uname := trim(coalesce(p_payload->>'username', ''));
  if uname <> '' then
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

  avatar := coalesce((p_payload->>'avatar_id')::smallint, 1);
  if avatar < 1 or avatar > 10 then avatar := 1; end if;

  bio_text := left(trim(coalesce(p_payload->>'bio', '')), 280);
  if bio_text = '' then bio_text := null; end if;

  ctype := nullif(trim(coalesce(p_payload->>'creator_type', '')), '');
  if ctype is not null and ctype not in (
    'beatmaker', 'producer', 'artist', 'singer', 'youtuber', 'content_creator', 'dj', 'other'
  ) then
    ctype := null;
  end if;

  social_links := public.sanitize_creator_social(p_payload->'social');

  update public.profiles
  set
    username = uname,
    avatar_id = avatar,
    bio = bio_text,
    creator_type = ctype,
    social = social_links
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
      'social', social_links
    )
  );
end;
$$;

revoke all on function public.update_creator_profile(jsonb) from public;
grant execute on function public.update_creator_profile(jsonb) to authenticated;
