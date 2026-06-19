-- Harden purchased_bonus: client PATCH protection + atomic Stripe credit grants

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
    new.purchased_bonus := old.purchased_bonus;
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

-- Atomic idempotent credit pack grant (insert ledger + bump profile in one transaction)
create or replace function public.grant_purchased_bonus_credits(
  p_stripe_event_id text,
  p_user_id uuid,
  p_pack_id text,
  p_credits integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_credits is null or p_credits <= 0 then
    return false;
  end if;

  insert into public.stripe_credit_pack_grants (stripe_event_id, user_id, pack_id, credits)
  values (p_stripe_event_id, p_user_id, p_pack_id, p_credits)
  on conflict (stripe_event_id) do nothing;

  if not found then
    return false;
  end if;

  update public.profiles
    set purchased_bonus = purchased_bonus + p_credits
  where id = p_user_id;

  return true;
end;
$$;

revoke all on function public.grant_purchased_bonus_credits(text, uuid, text, integer) from public;
revoke all on function public.grant_purchased_bonus_credits(text, uuid, text, integer) from anon;
revoke all on function public.grant_purchased_bonus_credits(text, uuid, text, integer) from authenticated;

-- Atomic idempotent launch bonus grant
create or replace function public.grant_launch_bonus_credits(
  p_stripe_event_id text,
  p_user_id uuid,
  p_grant_type text,
  p_credits integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_credits is null or p_credits <= 0 then
    return false;
  end if;

  insert into public.stripe_launch_bonus_grants (stripe_event_id, user_id, grant_type, credits)
  values (p_stripe_event_id, p_user_id, p_grant_type, p_credits)
  on conflict (stripe_event_id) do nothing;

  if not found then
    return false;
  end if;

  update public.profiles
    set referral_bonus = referral_bonus + p_credits
  where id = p_user_id;

  return true;
end;
$$;

revoke all on function public.grant_launch_bonus_credits(text, uuid, text, integer) from public;
revoke all on function public.grant_launch_bonus_credits(text, uuid, text, integer) from anon;
revoke all on function public.grant_launch_bonus_credits(text, uuid, text, integer) from authenticated;
