-- Security hardening: gamification abuse, profile field protection, RPC grants, rate limits.

-- ─── claim_level_rewards: ignore client XP (server is source of truth) ─────

create or replace function public.claim_level_rewards(p_xp int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_stored_xp int;
  v_claimed int;
  v_new_level int;
  v_credits int := 0;
  v_lvl int;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  select gamification_xp, level_rewards_claimed
    into v_stored_xp, v_claimed
  from public.profiles
  where id = v_uid
  for update;

  v_stored_xp := greatest(0, coalesce(v_stored_xp, 0));
  v_claimed := greatest(1, coalesce(v_claimed, 1));
  v_new_level := public.gamification_level_from_xp(v_stored_xp);

  if v_new_level <= v_claimed then
    return jsonb_build_object(
      'ok', true,
      'already_claimed', true,
      'level', v_new_level,
      'credits_granted', 0,
      'level_bonus', (select level_bonus from public.profiles where id = v_uid),
      'daily_bonus_month', (select daily_bonus_month from public.profiles where id = v_uid)
    );
  end if;

  for v_lvl in (v_claimed + 1)..v_new_level loop
    v_credits := v_credits + public.level_reward_credits(v_lvl);
  end loop;

  update public.profiles
    set level_bonus = level_bonus + v_credits,
        level_rewards_claimed = v_new_level
  where id = v_uid;

  return jsonb_build_object(
    'ok', true,
    'already_claimed', false,
    'level', v_new_level,
    'credits_granted', v_credits,
    'level_bonus', (select level_bonus from public.profiles where id = v_uid),
    'daily_bonus_month', (select daily_bonus_month from public.profiles where id = v_uid)
  );
end;
$$;

-- ─── sync_gamification_state: cap inflation per sync ────────────────────────

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
  v_incoming_xp int;
  v_max_xp int := 120000;
  v_max_delta int := 2000;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  select gamification_xp, visit_streak
  into v_old_xp, v_old_streak
  from public.profiles
  where id = v_uid
  for update;

  v_incoming_xp := greatest(0, least(coalesce(p_xp, 0), v_max_xp));
  v_new_xp := greatest(coalesce(v_old_xp, 0), v_incoming_xp);
  if v_new_xp > coalesce(v_old_xp, 0) + v_max_delta then
    v_new_xp := coalesce(v_old_xp, 0) + v_max_delta;
  end if;

  v_new_streak := greatest(coalesce(v_old_streak, 0), greatest(0, least(coalesce(p_streak, 0), 9999)));
  if v_new_streak > coalesce(v_old_streak, 0) + 1 then
    v_new_streak := coalesce(v_old_streak, 0) + 1;
  end if;

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

-- ─── Protect gamification / referral fields from client PATCH ───────────────

create or replace function public.profiles_protect_billing_fields()
returns trigger
language plpgsql
as $$
begin
  if coalesce(auth.jwt()->>'role', '') = 'service_role' then
    return new;
  end if;
  if current_user in ('postgres', 'supabase_admin') then
    return new;
  end if;
  if auth.uid() is not null and auth.uid() = old.id then
    new.plan := old.plan;
    new.stripe_customer_id := old.stripe_customer_id;
    new.stripe_subscription_id := old.stripe_subscription_id;
    new.stripe_price_id := old.stripe_price_id;
    new.stripe_current_period_end := old.stripe_current_period_end;
    new.referral_bonus := old.referral_bonus;
    new.level_bonus := old.level_bonus;
    new.gamification_xp := old.gamification_xp;
    new.level_rewards_claimed := old.level_rewards_claimed;
    new.referred_by := old.referred_by;
    new.daily_bonus_month := old.daily_bonus_month;
    new.last_daily_gen_bonus := old.last_daily_gen_bonus;
    new.visit_streak := old.visit_streak;
    new.last_visit_ymd := old.last_visit_ymd;
    new.gamification_achievements := old.gamification_achievements;
  end if;
  return new;
end;
$$;

-- ─── create_user_notification: server-only (RPC from trusted functions) ─────

revoke execute on function public.create_user_notification(text, text, text, text) from authenticated;
revoke execute on function public.create_user_notification(text, text, text, text) from anon;

-- ─── log_growth_event: rate limit + input bounds ────────────────────────────

create or replace function public.log_growth_event(
  p_session_id text,
  p_name text,
  p_props jsonb default null,
  p_path text default null,
  p_client_ts timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session text := trim(coalesce(p_session_id, ''));
  v_name text := trim(coalesce(p_name, ''));
  v_recent int;
begin
  if length(v_session) < 8 or length(v_session) > 128 then
    return;
  end if;
  if length(v_name) < 2 or length(v_name) > 80 then
    return;
  end if;

  select count(*)::int into v_recent
  from public.growth_events
  where session_id = v_session
    and created_at > now() - interval '1 minute';

  if v_recent >= 60 then
    return;
  end if;

  insert into public.growth_events (session_id, user_id, name, props, path, client_ts)
  values (
    v_session,
    auth.uid(),
    v_name,
    case
      when p_props is null then null
      when length(p_props::text) > 4000 then null
      else p_props
    end,
    left(coalesce(p_path, ''), 500),
    coalesce(p_client_ts, now())
  );
end;
$$;
