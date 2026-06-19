-- One-shot credit packs (Stripe payment mode) — purchased_bonus separate from referral/level bonuses

alter table public.profiles
  add column if not exists purchased_bonus integer not null default 0;

create table if not exists public.stripe_credit_pack_grants (
  stripe_event_id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  pack_id text not null,
  credits integer not null check (credits > 0),
  created_at timestamptz not null default now()
);

create index if not exists stripe_credit_pack_grants_user_idx
  on public.stripe_credit_pack_grants (user_id, created_at desc);

alter table public.stripe_credit_pack_grants enable row level security;

create or replace function public.profile_generation_limit(
  p_plan text,
  p_referral_bonus int,
  p_level_bonus int,
  p_daily_bonus_month int,
  p_purchased_bonus int default 0
)
returns int
language sql
immutable
as $$
  select public.plan_monthly_limit(p_plan)
    + greatest(0, coalesce(p_referral_bonus, 0))
    + greatest(0, coalesce(p_level_bonus, 0))
    + greatest(0, coalesce(p_daily_bonus_month, 0))
    + greatest(0, coalesce(p_purchased_bonus, 0));
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
  purchased_bonus_now int;
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

  select p.plan, p.loops_used_this_month, p.referral_bonus, p.level_bonus, p.daily_bonus_month, p.purchased_bonus
    into plan_name, used_now, referral_bonus_now, level_bonus_now, daily_bonus_now, purchased_bonus_now
  from public.profiles p
  where p.id = uid;

  plan_name := coalesce(plan_name, 'free');
  used_now := coalesce(used_now, 0);

  limit_now := public.profile_generation_limit(
    plan_name,
    referral_bonus_now,
    level_bonus_now,
    daily_bonus_now,
    purchased_bonus_now
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
  purchased_bonus_now int;
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

  select p.plan, p.loops_used_this_month, p.referral_bonus, p.level_bonus, p.daily_bonus_month, p.purchased_bonus
    into plan_name, used_now, referral_bonus_now, level_bonus_now, daily_bonus_now, purchased_bonus_now
  from public.profiles p
  where p.id = uid
  for update;

  plan_name := coalesce(plan_name, 'free');
  used_now := coalesce(used_now, 0);

  limit_now := public.profile_generation_limit(
    plan_name,
    referral_bonus_now,
    level_bonus_now,
    daily_bonus_now,
    purchased_bonus_now
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
