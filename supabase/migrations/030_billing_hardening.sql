-- Billing hardening: protect plan/stripe fields from client PATCH, fix studio self-heal.

create table if not exists public.billing_stripe_prices (
  plan text primary key check (plan in ('pro', 'studio')),
  stripe_price_id text not null unique
);

alter table public.billing_stripe_prices enable row level security;

comment on table public.billing_stripe_prices is
  'Map Stripe price IDs to plans. Insert once per environment after creating Stripe prices.';

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
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_billing_fields on public.profiles;
create trigger profiles_protect_billing_fields
  before update on public.profiles
  for each row
  execute function public.profiles_protect_billing_fields();

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
     and cur.plan = 'free'
     and cur.stripe_price_id is not null then
    select m.plan into healed_plan
    from public.billing_stripe_prices m
    where m.stripe_price_id = cur.stripe_price_id
    limit 1;

    if healed_plan is not null then
      update public.profiles
      set plan = healed_plan
      where id = uid;
    end if;
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
