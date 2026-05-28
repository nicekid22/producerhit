-- Plan Plus (€89/mo) — 1000 gen/month, Stripe price mapping, plan rank updates.

create or replace function public.plan_rank(p text)
returns int
language sql
immutable
as $$
  select case p
    when 'plus' then 4
    when 'studio' then 3
    when 'pro' then 2
    else 1
  end;
$$;

create or replace function public.plan_monthly_limit(p text)
returns int
language sql
immutable
as $$
  select case p
    when 'plus' then 1000
    when 'studio' then 250
    when 'pro' then 75
    else 10
  end;
$$;

alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles add constraint profiles_plan_check check (plan in ('free', 'pro', 'studio', 'plus'));

alter table public.billing_stripe_prices drop constraint if exists billing_stripe_prices_plan_check;
alter table public.billing_stripe_prices add constraint billing_stripe_prices_plan_check check (plan in ('pro', 'studio', 'plus'));

insert into public.billing_stripe_prices (plan, stripe_price_id)
values ('plus', 'price_1Tc9IsJqW5V9MXwgBB0dlFcp')
on conflict (plan) do update set stripe_price_id = excluded.stripe_price_id;

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

  select p.plan, p.loops_used_this_month into plan_name, used_now
  from public.profiles p
  where p.id = uid;

  plan_name := coalesce(plan_name, 'free');
  used_now := coalesce(used_now, 0);
  limit_now := public.plan_monthly_limit(plan_name);

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

  select p.plan, p.loops_used_this_month into plan_name, used_now
  from public.profiles p
  where p.id = uid
  for update;

  plan_name := coalesce(plan_name, 'free');
  used_now := coalesce(used_now, 0);
  limit_now := public.plan_monthly_limit(plan_name);

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
  select public.plan_monthly_limit(p_plan)
    + greatest(0, coalesce(p_referral_bonus, 0))
    + greatest(0, coalesce(p_level_bonus, 0))
    + greatest(0, coalesce(p_daily_bonus_month, 0));
$$;

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
  healed_plan text;
begin
  if uid is null then return; end if;

  select coalesce(u.email, p.email) into user_email
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = uid and u.deleted_at is null;

  select * into cur from public.profiles where id = uid;
  if not found then return; end if;

  update public.profiles
  set email = user_email
  where id = uid
    and user_email is not null
    and trim(user_email) <> ''
    and (email is null or trim(email) = '');

  if cur.stripe_subscription_id is not null
     and coalesce(cur.stripe_current_period_end, now() + interval '1 day') > now()
     and cur.plan = 'free'
     and cur.stripe_price_id is not null then
    select m.plan into healed_plan
    from public.billing_stripe_prices m
    where m.stripe_price_id = cur.stripe_price_id
    limit 1;

    if healed_plan is not null then
      update public.profiles set plan = healed_plan where id = uid;
    end if;
  end if;

  if user_email is null or trim(user_email) = '' then return; end if;

  select p.plan into sibling_plan
  from public.profiles p
  left join auth.users u on u.id = p.id and u.deleted_at is null
  where p.id <> uid
    and lower(trim(coalesce(nullif(trim(p.email), ''), u.email, ''))) = lower(trim(user_email))
    and p.plan in ('pro', 'studio', 'plus')
  order by public.plan_rank(p.plan) desc,
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
     and public.plan_rank(sibling_plan) > public.plan_rank(cur.plan) then
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
    where curp.id = uid and src.id = sibling_uid;
  end if;
end;
$$;
