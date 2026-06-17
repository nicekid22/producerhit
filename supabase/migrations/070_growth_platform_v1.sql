-- Growth platform v1: XP sync, notifications, onboarding progress, referral stats.

alter table public.profiles
  add column if not exists visit_streak int not null default 0,
  add column if not exists last_visit_ymd date,
  add column if not exists gamification_achievements jsonb not null default '[]'::jsonb;

-- ─── Gamification sync (cross-device) ───────────────────────────────────────

create or replace function public.sync_gamification_state(
  p_xp int,
  p_streak int default 0,
  p_last_visit_ymd text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_old_xp int;
  v_new_xp int;
  v_old_streak int;
  v_new_streak int;
  v_visit date;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  select gamification_xp, visit_streak
  into v_old_xp, v_old_streak
  from public.profiles
  where id = v_uid
  for update;

  v_new_xp := greatest(coalesce(v_old_xp, 0), greatest(0, coalesce(p_xp, 0)));
  v_new_streak := greatest(coalesce(v_old_streak, 0), greatest(0, coalesce(p_streak, 0)));

  v_visit := null;
  if p_last_visit_ymd is not null and length(trim(p_last_visit_ymd)) >= 10 then
    begin
      v_visit := (trim(p_last_visit_ymd))::date;
    exception when others then
      v_visit := null;
    end;
  end if;

  update public.profiles
  set gamification_xp = v_new_xp,
      visit_streak = v_new_streak,
      last_visit_ymd = coalesce(v_visit, last_visit_ymd)
  where id = v_uid;

  return jsonb_build_object(
    'ok', true,
    'xp', v_new_xp,
    'streak', v_new_streak,
    'last_visit_ymd', (select last_visit_ymd from public.profiles where id = v_uid)
  );
end;
$$;

grant execute on function public.sync_gamification_state(int, int, text) to authenticated;

-- ─── Referral stats ───────────────────────────────────────────────────────────

create or replace function public.get_referral_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_count int := 0;
  v_bonus int := 0;
  v_recent jsonb := '[]'::jsonb;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  select count(*)::int into v_count
  from public.profiles
  where referred_by = v_uid;

  select coalesce(referral_bonus, 0) into v_bonus
  from public.profiles
  where id = v_uid;

  select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb)
  into v_recent
  from (
    select
      p.id,
      coalesce(p.username, left(p.id::text, 8)) as username,
      p.created_at
    from public.profiles p
    where p.referred_by = v_uid
    order by p.created_at desc
    limit 5
  ) t;

  return jsonb_build_object(
    'ok', true,
    'invited_count', v_count,
    'referral_bonus', v_bonus,
    'estimated_signup_bonus', v_count * 20,
    'recent_invites', v_recent
  );
end;
$$;

grant execute on function public.get_referral_stats() to authenticated;

-- ─── In-app notifications ───────────────────────────────────────────────────

create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists user_notifications_user_created_idx
  on public.user_notifications (user_id, created_at desc);

create index if not exists user_notifications_unread_idx
  on public.user_notifications (user_id, created_at desc)
  where read_at is null;

alter table public.user_notifications enable row level security;

drop policy if exists user_notifications_select_own on public.user_notifications;
create policy user_notifications_select_own
  on public.user_notifications for select
  using (user_id = auth.uid());

drop policy if exists user_notifications_update_own on public.user_notifications;
create policy user_notifications_update_own
  on public.user_notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function public.list_user_notifications(p_limit int default 20)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_rows jsonb;
  v_unread int;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb)
  into v_rows
  from (
    select id, kind, title, body, href, read_at, created_at
    from public.user_notifications
    where user_id = v_uid
    order by created_at desc
    limit greatest(1, least(coalesce(p_limit, 20), 50))
  ) t;

  select count(*)::int into v_unread
  from public.user_notifications
  where user_id = v_uid and read_at is null;

  return jsonb_build_object('ok', true, 'items', v_rows, 'unread_count', v_unread);
end;
$$;

grant execute on function public.list_user_notifications(int) to authenticated;

create or replace function public.mark_notification_read(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  update public.user_notifications
  set read_at = coalesce(read_at, now())
  where id = p_id and user_id = auth.uid();

  return jsonb_build_object('ok', FOUND);
end;
$$;

grant execute on function public.mark_notification_read(uuid) to authenticated;

create or replace function public.mark_all_notifications_read()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  update public.user_notifications
  set read_at = coalesce(read_at, now())
  where user_id = auth.uid() and read_at is null;

  get diagnostics v_count = row_count;
  return jsonb_build_object('ok', true, 'marked', v_count);
end;
$$;

grant execute on function public.mark_all_notifications_read() to authenticated;

create or replace function public.create_user_notification(
  p_kind text,
  p_title text,
  p_body text,
  p_href text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  insert into public.user_notifications (user_id, kind, title, body, href)
  values (v_uid, coalesce(p_kind, 'info'), left(coalesce(p_title, ''), 200), left(coalesce(p_body, ''), 500), p_href)
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.create_user_notification(text, text, text, text) to authenticated;

-- ─── Onboarding progress (server) ───────────────────────────────────────────

create table if not exists public.onboarding_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  step_id text not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, step_id)
);

alter table public.onboarding_progress enable row level security;

drop policy if exists onboarding_progress_select_own on public.onboarding_progress;
create policy onboarding_progress_select_own
  on public.onboarding_progress for select
  using (user_id = auth.uid());

drop policy if exists onboarding_progress_insert_own on public.onboarding_progress;
create policy onboarding_progress_insert_own
  on public.onboarding_progress for insert
  with check (user_id = auth.uid());

create or replace function public.get_onboarding_progress()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_steps jsonb;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  select coalesce(jsonb_agg(step_id order by completed_at), '[]'::jsonb)
  into v_steps
  from public.onboarding_progress
  where user_id = v_uid;

  return jsonb_build_object('ok', true, 'steps', v_steps);
end;
$$;

grant execute on function public.get_onboarding_progress() to authenticated;

create or replace function public.complete_onboarding_step(p_step_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_step text := lower(trim(coalesce(p_step_id, '')));
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;
  if length(v_step) < 2 or length(v_step) > 40 then
    return jsonb_build_object('ok', false, 'error', 'invalid_step');
  end if;

  insert into public.onboarding_progress (user_id, step_id)
  values (v_uid, v_step)
  on conflict (user_id, step_id) do nothing;

  return jsonb_build_object('ok', true, 'step_id', v_step);
end;
$$;

grant execute on function public.complete_onboarding_step(text) to authenticated;

-- Notify referrer on successful claim (extends claim_referral)
create or replace function public.claim_referral(p_ref_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_referrer_id uuid;
  v_existing uuid;
  v_code text := lower(trim(coalesce(p_ref_code, '')));
  v_referee_bonus int := 10;
  v_referrer_bonus int := 20;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  select referred_by into v_existing from public.profiles where id = v_uid;
  if v_existing is not null then
    return jsonb_build_object('ok', false, 'error', 'already_claimed');
  end if;

  if length(v_code) < 4 then
    return jsonb_build_object('ok', false, 'error', 'invalid_code');
  end if;

  select id into v_referrer_id
  from public.profiles
  where referral_code = v_code
    and id <> v_uid
  limit 1;

  if v_referrer_id is null then
    return jsonb_build_object('ok', false, 'error', 'code_not_found');
  end if;

  update public.profiles
  set referred_by = v_referrer_id
  where id = v_uid
    and referred_by is null;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'already_claimed');
  end if;

  update public.profiles
  set referral_bonus = referral_bonus + v_referee_bonus
  where id = v_uid;

  update public.profiles
  set referral_bonus = referral_bonus + v_referrer_bonus
  where id = v_referrer_id;

  insert into public.user_notifications (user_id, kind, title, body, href)
  values (
    v_referrer_id,
    'referral',
    'New referral signup 🎉',
    '+20 bonus generations — someone joined with your link.',
    '/settings#pk-settings-referral'
  );

  return jsonb_build_object(
    'ok', true,
    'referee_bonus', v_referee_bonus,
    'referrer_bonus', v_referrer_bonus,
    'referrer_id', v_referrer_id
  );
end;
$$;

grant execute on function public.claim_referral(text) to authenticated;
