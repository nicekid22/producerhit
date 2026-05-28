-- Fix reconcile: prefer legacy account when plan/billing/library is better (studio > pro > free).

create or replace function public.reconcile_profile_by_email()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
  user_email text;
  legacy_uid uuid;
  cur public.profiles%rowtype;
  leg public.profiles%rowtype;
  cur_loops int := 0;
  leg_loops int := 0;
  cur_plan_rank int := 0;
  leg_plan_rank int := 0;
  moved_loops int := 0;
  should_merge boolean := false;
begin
  if uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  perform public.ensure_profile();

  select email into user_email
  from auth.users
  where id = uid
    and deleted_at is null;

  if user_email is null or trim(user_email) = '' then
    return jsonb_build_object('ok', true, 'status', 'no_email');
  end if;

  select * into cur from public.profiles where id = uid;
  select count(*) into cur_loops from public.loops where user_id = uid;

  select u.id into legacy_uid
  from auth.users u
  inner join public.profiles p on p.id = u.id
  where lower(trim(u.email)) = lower(trim(user_email))
    and u.id <> uid
    and u.deleted_at is null
  order by
    case p.plan when 'studio' then 3 when 'pro' then 2 else 1 end desc,
    (select count(*) from public.loops l where l.user_id = u.id) desc,
    p.loops_used_this_month desc,
    p.created_at asc
  limit 1;

  if legacy_uid is null then
    return jsonb_build_object('ok', true, 'status', 'no_legacy');
  end if;

  select * into leg from public.profiles where id = legacy_uid;
  select count(*) into leg_loops from public.loops where user_id = legacy_uid;

  cur_plan_rank := case cur.plan when 'studio' then 3 when 'pro' then 2 else 1 end;
  leg_plan_rank := case leg.plan when 'studio' then 3 when 'pro' then 2 else 1 end;

  should_merge :=
    leg_plan_rank > cur_plan_rank
    or (leg.stripe_subscription_id is not null and cur.stripe_subscription_id is null)
    or leg_loops > cur_loops
    or (
      leg_plan_rank = cur_plan_rank
      and (
        leg.loops_used_this_month + leg.referral_bonus + leg.level_bonus + leg.daily_bonus_month
        > cur.loops_used_this_month + cur.referral_bonus + cur.level_bonus + cur.daily_bonus_month
      )
    );

  if not should_merge then
    return jsonb_build_object('ok', true, 'status', 'current_preferred', 'legacy_user_id', legacy_uid);
  end if;

  update public.profiles
  set
    username = coalesce(nullif(trim(cur.username), ''), nullif(trim(leg.username), '')),
    plan = leg.plan,
    loops_used_this_month = leg.loops_used_this_month,
    loops_reset_at = leg.loops_reset_at,
    stripe_customer_id = leg.stripe_customer_id,
    stripe_subscription_id = leg.stripe_subscription_id,
    stripe_price_id = leg.stripe_price_id,
    stripe_current_period_end = leg.stripe_current_period_end,
    referral_bonus = greatest(cur.referral_bonus, leg.referral_bonus),
    referred_by = coalesce(cur.referred_by, leg.referred_by),
    gamification_xp = greatest(coalesce(cur.gamification_xp, 0), coalesce(leg.gamification_xp, 0)),
    level_bonus = greatest(cur.level_bonus, leg.level_bonus),
    level_rewards_claimed = greatest(cur.level_rewards_claimed, leg.level_rewards_claimed),
    daily_bonus_month = greatest(cur.daily_bonus_month, leg.daily_bonus_month),
    last_daily_gen_bonus = coalesce(leg.last_daily_gen_bonus, cur.last_daily_gen_bonus),
    last_generation_at = coalesce(leg.last_generation_at, cur.last_generation_at),
    generation_window_started_at = coalesce(leg.generation_window_started_at, cur.generation_window_started_at),
    generation_window_count = greatest(
      coalesce(cur.generation_window_count, 0),
      coalesce(leg.generation_window_count, 0)
    )
  where id = uid;

  update public.loops
  set user_id = uid
  where user_id = legacy_uid;
  get diagnostics moved_loops = row_count;

  delete from public.generation_usage_keys g1
  where g1.user_id = legacy_uid
    and exists (
      select 1
      from public.generation_usage_keys g2
      where g2.user_id = uid
        and g2.key = g1.key
    );

  update public.generation_usage_keys
  set user_id = uid
  where user_id = legacy_uid;

  delete from public.loop_ratings lr
  where lr.user_id = legacy_uid
    and exists (
      select 1
      from public.loop_ratings x
      where x.user_id = uid
        and x.loop_id = lr.loop_id
    );

  update public.loop_ratings
  set user_id = uid
  where user_id = legacy_uid;

  update public.client_events
  set user_id = uid
  where user_id = legacy_uid;

  update public.profiles
  set
    loops_used_this_month = 0,
    referral_bonus = 0,
    level_bonus = 0,
    daily_bonus_month = 0,
    plan = 'free',
    stripe_customer_id = null,
    stripe_subscription_id = null,
    stripe_price_id = null,
    stripe_current_period_end = null
  where id = legacy_uid;

  return jsonb_build_object(
    'ok', true,
    'status', 'merged',
    'legacy_user_id', legacy_uid,
    'loops_moved', moved_loops
  );
exception
  when others then
    return jsonb_build_object('ok', false, 'error', sqlerrm);
end;
$$;

revoke all on function public.reconcile_profile_by_email() from public;
grant execute on function public.reconcile_profile_by_email() to authenticated;
