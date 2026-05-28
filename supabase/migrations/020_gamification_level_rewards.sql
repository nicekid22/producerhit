-- Level-up & daily login generation credits (added to monthly quota).

alter table public.profiles
  add column if not exists gamification_xp int not null default 0,
  add column if not exists level_bonus int not null default 0,
  add column if not exists level_rewards_claimed int not null default 1,
  add column if not exists daily_bonus_month int not null default 0,
  add column if not exists last_daily_gen_bonus date;

create or replace function public.gamification_level_from_xp(p_xp int)
returns int
language plpgsql
immutable
as $$
declare
  thresholds int[] := array[0, 80, 180, 320, 500, 720, 980, 1280, 1620, 2000];
  lvl int := 1;
  i int;
begin
  for i in 2..array_length(thresholds, 1) loop
    if p_xp >= thresholds[i] then
      lvl := i;
    else
      exit;
    end if;
  end loop;
  return lvl;
end;
$$;

create or replace function public.level_reward_credits(p_level int)
returns int
language sql
immutable
as $$
  select case
    when p_level <= 1 then 0
    when p_level in (5, 8) then 2
    when p_level = 10 then 3
    else 1
  end;
$$;

create or replace function public.profile_generation_limit(
  p_plan text,
  p_referral_bonus int,
  p_level_bonus int,
  p_daily_bonus_month int
)
returns int
language sql
immutable
as $$
  select (
    case
      when p_plan = 'studio' then 250
      when p_plan = 'pro' then 75
      else 10
    end
  )
  + greatest(0, coalesce(p_referral_bonus, 0))
  + greatest(0, coalesce(p_level_bonus, 0))
  + greatest(0, coalesce(p_daily_bonus_month, 0));
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
        daily_bonus_month = 0,
        loops_reset_at = now()
  where id = auth.uid()
    and date_trunc('month', loops_reset_at) <> date_trunc('month', now());
end;
$$;

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
  v_safe_xp int;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  v_safe_xp := greatest(0, least(coalesce(p_xp, 0), 50000));

  select gamification_xp, level_rewards_claimed
    into v_stored_xp, v_claimed
  from public.profiles
  where id = v_uid
  for update;

  v_safe_xp := greatest(coalesce(v_stored_xp, 0), v_safe_xp);
  v_claimed := greatest(1, coalesce(v_claimed, 1));
  v_new_level := public.gamification_level_from_xp(v_safe_xp);

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
    set gamification_xp = v_safe_xp,
        level_bonus = level_bonus + v_credits,
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

create or replace function public.claim_daily_generation_bonus()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_today date := (now() at time zone 'utc')::date;
  v_last date;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  perform public.reset_loops_usage_if_needed();

  select last_daily_gen_bonus
    into v_last
  from public.profiles
  where id = v_uid
  for update;

  if v_last = v_today then
    return jsonb_build_object(
      'ok', true,
      'already_claimed', true,
      'credits_granted', 0,
      'daily_bonus_month', (select daily_bonus_month from public.profiles where id = v_uid)
    );
  end if;

  update public.profiles
    set daily_bonus_month = daily_bonus_month + 1,
        last_daily_gen_bonus = v_today
  where id = v_uid;

  return jsonb_build_object(
    'ok', true,
    'already_claimed', false,
    'credits_granted', 1,
    'daily_bonus_month', (select daily_bonus_month from public.profiles where id = v_uid)
  );
end;
$$;

create or replace function public.check_loops_usage_idempotent(p_key text)
returns table(ok boolean, plan text, used int, "limit" int, already_counted boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  plan_name text;
  used_now int;
  limit_now int;
  referral_bonus_now int;
  level_bonus_now int;
  daily_bonus_now int;
  counted boolean;
begin
  if uid is null then
    return query select false, 'free', 0, 0, false;
    return;
  end if;

  perform public.reset_loops_usage_if_needed();

  delete from public.generation_usage_keys
  where user_id = uid
    and created_at < now() - interval '45 days';

  select p.plan, p.loops_used_this_month, p.referral_bonus, p.level_bonus, p.daily_bonus_month
    into plan_name, used_now, referral_bonus_now, level_bonus_now, daily_bonus_now
  from public.profiles p
  where p.id = uid;

  plan_name := coalesce(plan_name, 'free');
  used_now := coalesce(used_now, 0);

  limit_now := public.profile_generation_limit(
    plan_name,
    referral_bonus_now,
    level_bonus_now,
    daily_bonus_now
  );

  counted := exists (
    select 1
    from public.generation_usage_keys k
    where k.user_id = uid
      and k.key = p_key
  );

  if counted then
    return query select true, plan_name, used_now, limit_now, true;
    return;
  end if;

  if used_now >= limit_now then
    return query select false, plan_name, used_now, limit_now, false;
    return;
  end if;

  return query select true, plan_name, used_now, limit_now, false;
end;
$$;

create or replace function public.check_and_bump_loops_usage_idempotent(p_key text)
returns table(ok boolean, plan text, used int, "limit" int, already_counted boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  plan_name text;
  used_now int;
  limit_now int;
  referral_bonus_now int;
  level_bonus_now int;
  daily_bonus_now int;
  counted boolean;
begin
  if uid is null then
    return query select false, 'free', 0, 0, false;
    return;
  end if;

  perform public.reset_loops_usage_if_needed();

  delete from public.generation_usage_keys
  where user_id = uid
    and created_at < now() - interval '45 days';

  select p.plan, p.loops_used_this_month, p.referral_bonus, p.level_bonus, p.daily_bonus_month
    into plan_name, used_now, referral_bonus_now, level_bonus_now, daily_bonus_now
  from public.profiles p
  where p.id = uid
  for update;

  plan_name := coalesce(plan_name, 'free');
  used_now := coalesce(used_now, 0);

  limit_now := public.profile_generation_limit(
    plan_name,
    referral_bonus_now,
    level_bonus_now,
    daily_bonus_now
  );

  counted := exists (
    select 1
    from public.generation_usage_keys k
    where k.user_id = uid
      and k.key = p_key
  );

  if counted then
    return query select true, plan_name, used_now, limit_now, true;
    return;
  end if;

  if used_now >= limit_now then
    return query select false, plan_name, used_now, limit_now, false;
    return;
  end if;

  insert into public.generation_usage_keys (user_id, key)
  values (uid, p_key)
  on conflict do nothing;

  update public.profiles
    set loops_used_this_month = case
          when date_trunc('month', loops_reset_at) <> date_trunc('month', now()) then 1
          else loops_used_this_month + 1
        end,
        loops_reset_at = case
          when date_trunc('month', loops_reset_at) <> date_trunc('month', now()) then now()
          else loops_reset_at
        end
  where id = uid
  returning loops_used_this_month into used_now;

  return query select true, plan_name, coalesce(used_now, 0), limit_now, false;
end;
$$;

grant execute on function public.claim_level_rewards(int) to authenticated;
grant execute on function public.claim_daily_generation_bonus() to authenticated;
