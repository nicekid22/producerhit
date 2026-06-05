-- Réaligne check_loops_usage_idempotent sur profile_generation_limit (bonus parrainage / niveau / daily).
-- Migration 032 avait régressé vers plan_monthly_limit seul → cover reroll refusé alors que le dashboard affiche des crédits.

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
    select 1 from public.generation_usage_keys k
    where k.user_id = uid and k.key = p_key
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
    select 1 from public.generation_usage_keys k
    where k.user_id = uid and k.key = p_key
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
