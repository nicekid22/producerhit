-- Robust profile/plan resolution: stripe self-heal, email sibling promotion, atomic load RPC.

create or replace function public.sync_profile_plan_from_billing()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
  user_email text;
  cur public.profiles%rowtype;
  sibling_plan text;
  sibling_uid uuid;
begin
  if uid is null then
    return;
  end if;

  select coalesce(u.email, p.email) into user_email
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = uid
    and u.deleted_at is null;

  select * into cur from public.profiles where id = uid;
  if not found then
    return;
  end if;

  update public.profiles
  set email = user_email
  where id = uid
    and user_email is not null
    and trim(user_email) <> ''
    and (email is null or trim(email) = '');

  if cur.stripe_subscription_id is not null
     and coalesce(cur.stripe_current_period_end, now() + interval '1 day') > now()
     and cur.plan = 'free' then
    update public.profiles
    set plan = 'pro'
    where id = uid;
  end if;

  if user_email is null or trim(user_email) = '' then
    return;
  end if;

  select p.plan into sibling_plan
  from public.profiles p
  left join auth.users u on u.id = p.id and u.deleted_at is null
  where p.id <> uid
    and lower(trim(coalesce(nullif(trim(p.email), ''), u.email, ''))) = lower(trim(user_email))
    and p.plan in ('pro', 'studio')
  order by
    case p.plan when 'studio' then 3 when 'pro' then 2 else 1 end desc,
    (select count(*) from public.loops l where l.user_id = p.id) desc,
    p.loops_used_this_month desc
  limit 1;

  select src.id into sibling_uid
  from public.profiles src
  left join auth.users u on u.id = src.id and u.deleted_at is null
  where src.id <> uid
    and src.plan = sibling_plan
    and lower(trim(coalesce(nullif(trim(src.email), ''), u.email, ''))) = lower(trim(user_email))
  order by
    (select count(*) from public.loops l where l.user_id = src.id) desc,
    src.loops_used_this_month desc,
    src.created_at asc
  limit 1;

  if sibling_uid is not null
     and sibling_plan is not null
     and (
       case sibling_plan when 'studio' then 3 when 'pro' then 2 else 1 end
       > case cur.plan when 'studio' then 3 when 'pro' then 2 else 1 end
     ) then
    update public.profiles curp
    set
      plan = src.plan,
      loops_used_this_month = greatest(curp.loops_used_this_month, src.loops_used_this_month),
      loops_reset_at = coalesce(curp.loops_reset_at, src.loops_reset_at),
      stripe_customer_id = coalesce(curp.stripe_customer_id, src.stripe_customer_id),
      stripe_subscription_id = coalesce(curp.stripe_subscription_id, src.stripe_subscription_id),
      stripe_price_id = coalesce(curp.stripe_price_id, src.stripe_price_id),
      stripe_current_period_end = coalesce(curp.stripe_current_period_end, src.stripe_current_period_end),
      referral_bonus = greatest(curp.referral_bonus, src.referral_bonus),
      referred_by = coalesce(curp.referred_by, src.referred_by),
      gamification_xp = greatest(coalesce(curp.gamification_xp, 0), coalesce(src.gamification_xp, 0)),
      level_bonus = greatest(curp.level_bonus, src.level_bonus),
      level_rewards_claimed = greatest(curp.level_rewards_claimed, src.level_rewards_claimed),
      daily_bonus_month = greatest(curp.daily_bonus_month, src.daily_bonus_month),
      last_daily_gen_bonus = coalesce(curp.last_daily_gen_bonus, src.last_daily_gen_bonus),
      last_generation_at = coalesce(curp.last_generation_at, src.last_generation_at),
      generation_window_started_at = coalesce(curp.generation_window_started_at, src.generation_window_started_at),
      generation_window_count = greatest(
        coalesce(curp.generation_window_count, 0),
        coalesce(src.generation_window_count, 0)
      ),
      username = coalesce(nullif(trim(curp.username), ''), nullif(trim(src.username), ''))
    from public.profiles src
    where curp.id = uid
      and src.id = sibling_uid;
  end if;
end;
$$;

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
  perform public.sync_profile_plan_from_billing();

  select coalesce(u.email, p.email) into user_email
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = uid
    and u.deleted_at is null;

  if user_email is null or trim(user_email) = '' then
    return jsonb_build_object('ok', true, 'status', 'no_email');
  end if;

  update public.profiles
  set email = user_email
  where id = uid
    and (email is null or trim(email) = '');

  select * into cur from public.profiles where id = uid;
  select count(*) into cur_loops from public.loops where user_id = uid;

  select candidate.id into legacy_uid
  from (
    select
      p.id,
      case p.plan when 'studio' then 3 when 'pro' then 2 else 1 end as plan_rank,
      (select count(*) from public.loops l where l.user_id = p.id) as loop_count,
      p.loops_used_this_month,
      p.created_at
    from public.profiles p
    left join auth.users u on u.id = p.id and u.deleted_at is null
    where p.id <> uid
      and lower(trim(coalesce(nullif(trim(p.email), ''), u.email, ''))) = lower(trim(user_email))

    union

    select
      u.id,
      case p.plan when 'studio' then 3 when 'pro' then 2 else 1 end as plan_rank,
      (select count(*) from public.loops l where l.user_id = u.id) as loop_count,
      p.loops_used_this_month,
      p.created_at
    from auth.users u
    inner join public.profiles p on p.id = u.id
    where u.id <> uid
      and u.deleted_at is null
      and lower(trim(u.email)) = lower(trim(user_email))
  ) candidate
  order by
    candidate.plan_rank desc,
    candidate.loop_count desc,
    candidate.loops_used_this_month desc,
    candidate.created_at asc
  limit 1;

  if legacy_uid is null then
    return jsonb_build_object('ok', true, 'status', 'no_legacy', 'email', user_email, 'plan', cur.plan);
  end if;

  select * into leg from public.profiles where id = legacy_uid;
  select count(*) into leg_loops from public.loops where user_id = legacy_uid;

  cur_plan_rank := case cur.plan when 'studio' then 3 when 'pro' then 2 else 1 end;
  leg_plan_rank := case leg.plan when 'studio' then 3 when 'pro' then 2 else 1 end;

  should_merge :=
    leg_plan_rank > cur_plan_rank
    or (leg.stripe_subscription_id is not null and cur.stripe_subscription_id is null)
    or (leg_plan_rank = cur_plan_rank and leg_loops > cur_loops)
    or (
      leg_plan_rank = cur_plan_rank
      and leg_loops = cur_loops
      and (
        leg.loops_used_this_month + leg.referral_bonus + leg.level_bonus + leg.daily_bonus_month
        > cur.loops_used_this_month + cur.referral_bonus + cur.level_bonus + cur.daily_bonus_month
      )
    );

  if not should_merge then
    return jsonb_build_object(
      'ok', true,
      'status', 'current_preferred',
      'legacy_user_id', legacy_uid,
      'email', user_email,
      'plan', cur.plan
    );
  end if;

  update public.profiles
  set
    email = user_email,
    username = coalesce(nullif(trim(cur.username), ''), nullif(trim(leg.username), '')),
    plan = leg.plan,
    loops_used_this_month = greatest(cur.loops_used_this_month, leg.loops_used_this_month),
    loops_reset_at = coalesce(cur.loops_reset_at, leg.loops_reset_at),
    stripe_customer_id = coalesce(cur.stripe_customer_id, leg.stripe_customer_id),
    stripe_subscription_id = coalesce(cur.stripe_subscription_id, leg.stripe_subscription_id),
    stripe_price_id = coalesce(cur.stripe_price_id, leg.stripe_price_id),
    stripe_current_period_end = coalesce(cur.stripe_current_period_end, leg.stripe_current_period_end),
    referral_bonus = greatest(cur.referral_bonus, leg.referral_bonus),
    referred_by = coalesce(cur.referred_by, leg.referred_by),
    gamification_xp = greatest(coalesce(cur.gamification_xp, 0), coalesce(leg.gamification_xp, 0)),
    level_bonus = greatest(cur.level_bonus, leg.level_bonus),
    level_rewards_claimed = greatest(cur.level_rewards_claimed, leg.level_rewards_claimed),
    daily_bonus_month = greatest(cur.daily_bonus_month, leg.daily_bonus_month),
    last_daily_gen_bonus = coalesce(cur.last_daily_gen_bonus, leg.last_daily_gen_bonus),
    last_generation_at = coalesce(cur.last_generation_at, leg.last_generation_at),
    generation_window_started_at = coalesce(cur.generation_window_started_at, leg.generation_window_started_at),
    generation_window_count = greatest(
      coalesce(cur.generation_window_count, 0),
      coalesce(leg.generation_window_count, 0)
    )
  where id = uid;

  update public.loops set user_id = uid where user_id = legacy_uid;
  get diagnostics moved_loops = row_count;

  delete from public.generation_usage_keys g1
  where g1.user_id = legacy_uid
    and exists (
      select 1 from public.generation_usage_keys g2
      where g2.user_id = uid and g2.key = g1.key
    );

  update public.generation_usage_keys set user_id = uid where user_id = legacy_uid;

  delete from public.loop_ratings lr
  where lr.user_id = legacy_uid
    and exists (
      select 1 from public.loop_ratings x
      where x.user_id = uid and x.loop_id = lr.loop_id
    );

  update public.loop_ratings set user_id = uid where user_id = legacy_uid;
  update public.client_events set user_id = uid where user_id = legacy_uid;

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
    'loops_moved', moved_loops,
    'email', user_email,
    'plan', leg.plan
  );
exception
  when others then
    return jsonb_build_object('ok', false, 'error', sqlerrm);
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
  rec public.profiles%rowtype;
  reconcile_result jsonb;
begin
  if uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  perform public.ensure_profile();
  perform public.sync_profile_plan_from_billing();
  reconcile_result := public.reconcile_profile_by_email();
  perform public.reset_loops_usage_if_needed();

  select * into rec from public.profiles where id = uid;

  return jsonb_build_object(
    'ok', true,
    'profile', jsonb_build_object(
      'username', rec.username,
      'plan', rec.plan,
      'loops_used_this_month', rec.loops_used_this_month,
      'referral_bonus', rec.referral_bonus,
      'referral_code', rec.referral_code,
      'level_bonus', rec.level_bonus,
      'daily_bonus_month', rec.daily_bonus_month
    ),
    'reconcile', reconcile_result
  );
exception
  when others then
    return jsonb_build_object('ok', false, 'error', sqlerrm);
end;
$$;

revoke all on function public.sync_profile_plan_from_billing() from public;
grant execute on function public.sync_profile_plan_from_billing() to authenticated;

revoke all on function public.load_session_profile() from public;
grant execute on function public.load_session_profile() to authenticated;
