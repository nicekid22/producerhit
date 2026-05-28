-- Public creator profiles: avatar, bio, social, follows.
-- Minimal egress: RPCs return only public-safe fields.

alter table public.profiles
  add column if not exists avatar_id smallint not null default 1,
  add column if not exists bio text,
  add column if not exists creator_type text,
  add column if not exists social jsonb not null default '{}'::jsonb,
  add column if not exists username_norm text;

alter table public.profiles
  drop constraint if exists profiles_avatar_id_check;

alter table public.profiles
  add constraint profiles_avatar_id_check check (avatar_id between 1 and 10);

alter table public.profiles
  drop constraint if exists profiles_creator_type_check;

alter table public.profiles
  add constraint profiles_creator_type_check check (
    creator_type is null
    or creator_type in (
      'beatmaker', 'producer', 'artist', 'singer', 'youtuber', 'content_creator', 'dj', 'other'
    )
  );

create or replace function public.sync_username_norm()
returns trigger
language plpgsql
as $$
begin
  if new.username is not null and length(trim(new.username)) >= 3 then
    new.username_norm := lower(trim(new.username));
  else
    new.username_norm := null;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_sync_username_norm on public.profiles;
create trigger profiles_sync_username_norm
  before insert or update of username on public.profiles
  for each row execute function public.sync_username_norm();

update public.profiles
set username = username
where username is not null and trim(username) <> '';

create unique index if not exists profiles_username_norm_unique
  on public.profiles (username_norm)
  where username_norm is not null;

create table if not exists public.profile_follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index if not exists profile_follows_following_idx on public.profile_follows (following_id);

alter table public.profile_follows enable row level security;

drop policy if exists profile_follows_select_own on public.profile_follows;
create policy profile_follows_select_own on public.profile_follows
  for select using (auth.uid() = follower_id);

drop policy if exists profile_follows_insert_own on public.profile_follows;
create policy profile_follows_insert_own on public.profile_follows
  for insert with check (auth.uid() = follower_id and follower_id <> following_id);

drop policy if exists profile_follows_delete_own on public.profile_follows;
create policy profile_follows_delete_own on public.profile_follows
  for delete using (auth.uid() = follower_id);

create or replace function public.sanitize_creator_social(p_social jsonb)
returns jsonb
language plpgsql
immutable
as $$
declare
  out jsonb := '{}'::jsonb;
  v text;
begin
  if p_social is null or jsonb_typeof(p_social) <> 'object' then
    return out;
  end if;

  v := left(trim(coalesce(p_social->>'ig', '')), 64);
  if v <> '' then out := out || jsonb_build_object('ig', v); end if;

  v := left(trim(coalesce(p_social->>'tt', '')), 64);
  if v <> '' then out := out || jsonb_build_object('tt', v); end if;

  v := left(trim(coalesce(p_social->>'yt', '')), 120);
  if v <> '' then out := out || jsonb_build_object('yt', v); end if;

  v := left(trim(coalesce(p_social->>'x', '')), 64);
  if v <> '' then out := out || jsonb_build_object('x', v); end if;

  v := left(trim(coalesce(p_social->>'web', '')), 200);
  if v <> '' and (v like 'http://%' or v like 'https://%') then
    out := out || jsonb_build_object('web', v);
  end if;

  return out;
end;
$$;

create or replace function public.update_creator_profile(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  uname text;
  avatar smallint;
  bio_text text;
  ctype text;
  social jsonb;
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
  else
    uname := null;
  end if;

  avatar := coalesce((p_payload->>'avatar_id')::smallint, 1);
  if avatar < 1 or avatar > 10 then
    avatar := 1;
  end if;

  bio_text := left(trim(coalesce(p_payload->>'bio', '')), 280);
  if bio_text = '' then bio_text := null; end if;

  ctype := nullif(trim(coalesce(p_payload->>'creator_type', '')), '');
  if ctype is not null and ctype not in (
    'beatmaker', 'producer', 'artist', 'singer', 'youtuber', 'content_creator', 'dj', 'other'
  ) then
    ctype := null;
  end if;

  social := public.sanitize_creator_social(p_payload->'social');

  begin
    update public.profiles
    set
      username = uname,
      avatar_id = avatar,
      bio = bio_text,
      creator_type = ctype,
      social = social
    where id = uid;
  exception
    when unique_violation then
      return jsonb_build_object('ok', false, 'error', 'username_taken');
  end;

  return jsonb_build_object(
    'ok', true,
    'profile', jsonb_build_object(
      'username', uname,
      'avatar_id', avatar,
      'bio', bio_text,
      'creator_type', ctype,
      'social', social
    )
  );
end;
$$;

create or replace function public.get_public_profile_cards(p_user_ids uuid[])
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if p_user_ids is null or cardinality(p_user_ids) = 0 then
    return '[]'::jsonb;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'username', p.username,
        'avatar_id', coalesce(p.avatar_id, 1),
        'creator_type', p.creator_type
      )
    ),
    '[]'::jsonb
  )
  into result
  from public.profiles p
  where p.id = any (p_user_ids)
    and p.username_norm is not null;

  return result;
end;
$$;

create or replace function public.get_public_profile(p_username text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  rec record;
  followers int;
  following int;
  loops_count int;
  is_following boolean := false;
  unorm text := lower(trim(coalesce(p_username, '')));
begin
  if length(unorm) < 3 then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  select
    p.id,
    p.username,
    coalesce(p.avatar_id, 1) as avatar_id,
    p.bio,
    p.creator_type,
    coalesce(p.social, '{}'::jsonb) as social
  into rec
  from public.profiles p
  where p.username_norm = unorm
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  select count(*)::int into followers from public.profile_follows f where f.following_id = rec.id;
  select count(*)::int into following from public.profile_follows f where f.follower_id = rec.id;
  select count(*)::int into loops_count from public.loops l where l.user_id = rec.id and l.is_public = true;

  if uid is not null then
    select exists(
      select 1 from public.profile_follows f where f.follower_id = uid and f.following_id = rec.id
    ) into is_following;
  end if;

  return jsonb_build_object(
    'ok', true,
    'profile', jsonb_build_object(
      'id', rec.id,
      'username', rec.username,
      'avatar_id', rec.avatar_id,
      'bio', rec.bio,
      'creator_type', rec.creator_type,
      'social', rec.social,
      'followers_count', followers,
      'following_count', following,
      'public_loops_count', loops_count,
      'is_following', is_following
    )
  );
end;
$$;

create or replace function public.toggle_profile_follow(p_following_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  following boolean;
  followers int;
begin
  if uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;
  if p_following_id is null or p_following_id = uid then
    return jsonb_build_object('ok', false, 'error', 'invalid_target');
  end if;
  if not exists (select 1 from public.profiles p where p.id = p_following_id and p.username_norm is not null) then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if exists (
    select 1 from public.profile_follows f where f.follower_id = uid and f.following_id = p_following_id
  ) then
    delete from public.profile_follows f where f.follower_id = uid and f.following_id = p_following_id;
    following := false;
  else
    insert into public.profile_follows (follower_id, following_id) values (uid, p_following_id);
    following := true;
  end if;

  select count(*)::int into followers from public.profile_follows f where f.following_id = p_following_id;

  return jsonb_build_object('ok', true, 'following', following, 'followers_count', followers);
end;
$$;

create or replace function public.list_user_public_loops(p_user_id uuid, p_limit int default 24)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  lim int := greatest(1, least(coalesce(p_limit, 24), 48));
  result jsonb;
begin
  if p_user_id is null then
    return '[]'::jsonb;
  end if;
  if not exists (select 1 from public.profiles p where p.id = p_user_id and p.username_norm is not null) then
    return '[]'::jsonb;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', l.id,
        'name', l.name,
        'genre', l.genre,
        'mood', l.mood,
        'bpm', l.bpm,
        'created_at', l.created_at,
        'seed', l.seed
      )
      order by l.created_at desc
    ),
    '[]'::jsonb
  )
  into result
  from (
    select l.id, l.name, l.genre, l.mood, l.bpm, l.created_at, l.seed
    from public.loops l
    where l.user_id = p_user_id and l.is_public = true
    order by l.created_at desc
    limit lim
  ) l;

  return result;
end;
$$;

create or replace function public.load_session_profile()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
  rec record;
  reconcile_result jsonb := jsonb_build_object('ok', true, 'status', 'skipped');
begin
  if uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  begin perform public.ensure_profile(); exception when others then null; end;
  begin perform public.sync_profile_plan_from_billing(); exception when others then null; end;
  begin reconcile_result := public.reconcile_profile_by_email(); exception when others then
    reconcile_result := jsonb_build_object('ok', false, 'error', sqlerrm);
  end;
  begin perform public.reset_loops_usage_if_needed(); exception when others then null; end;

  begin
    select
      p.username,
      p.plan,
      p.loops_used_this_month,
      p.referral_bonus,
      p.referral_code,
      coalesce(p.level_bonus, 0) as level_bonus,
      coalesce(p.daily_bonus_month, 0) as daily_bonus_month,
      coalesce(p.avatar_id, 1) as avatar_id,
      p.bio,
      p.creator_type,
      coalesce(p.social, '{}'::jsonb) as social
    into rec
    from public.profiles p
    where p.id = uid;
  exception
    when undefined_column then
      select
        p.username,
        p.plan,
        p.loops_used_this_month,
        p.referral_bonus,
        p.referral_code,
        0 as level_bonus,
        0 as daily_bonus_month,
        1 as avatar_id,
        null::text as bio,
        null::text as creator_type,
        '{}'::jsonb as social
      into rec
      from public.profiles p
      where p.id = uid;
  end;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'profile_not_found');
  end if;

  return jsonb_build_object(
    'ok', true,
    'profile', jsonb_build_object(
      'username', rec.username,
      'plan', rec.plan,
      'loops_used_this_month', rec.loops_used_this_month,
      'referral_bonus', rec.referral_bonus,
      'referral_code', rec.referral_code,
      'level_bonus', rec.level_bonus,
      'daily_bonus_month', rec.daily_bonus_month,
      'avatar_id', rec.avatar_id,
      'bio', rec.bio,
      'creator_type', rec.creator_type,
      'social', rec.social
    ),
    'reconcile', reconcile_result
  );
exception
  when others then
    return jsonb_build_object('ok', false, 'error', sqlerrm);
end;
$$;

revoke all on function public.update_creator_profile(jsonb) from public;
grant execute on function public.update_creator_profile(jsonb) to authenticated;

revoke all on function public.get_public_profile_cards(uuid[]) from public;
grant execute on function public.get_public_profile_cards(uuid[]) to anon, authenticated;

revoke all on function public.get_public_profile(text) from public;
grant execute on function public.get_public_profile(text) to anon, authenticated;

revoke all on function public.toggle_profile_follow(uuid) from public;
grant execute on function public.toggle_profile_follow(uuid) to authenticated;

revoke all on function public.list_user_public_loops(uuid, int) from public;
grant execute on function public.list_user_public_loops(uuid, int) to anon, authenticated;
