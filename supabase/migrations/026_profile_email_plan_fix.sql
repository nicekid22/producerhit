-- Ensure profile emails are synced so reconcile can match accounts.
-- Safe to re-run. Run after 024, before or with 025.

update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and u.deleted_at is null
  and u.email is not null
  and (p.email is null or trim(p.email) = '' or lower(trim(p.email)) <> lower(trim(u.email)));

-- One-shot: promote auth-linked profile to best plan among same-email profiles.
with ranked as (
  select
    p.id,
    lower(trim(coalesce(p.email, u.email, ''))) as norm_email,
    case p.plan when 'studio' then 3 when 'pro' then 2 else 1 end as plan_rank,
    p.plan,
    p.loops_used_this_month,
    p.stripe_customer_id,
    p.stripe_subscription_id,
    p.stripe_price_id,
    p.stripe_current_period_end,
    p.referral_bonus,
    p.level_bonus,
    p.daily_bonus_month,
    p.username,
    row_number() over (
      partition by lower(trim(coalesce(p.email, u.email, '')))
      order by
        case p.plan when 'studio' then 3 when 'pro' then 2 else 1 end desc,
        (select count(*) from public.loops l where l.user_id = p.id) desc,
        p.loops_used_this_month desc
    ) as rn
  from public.profiles p
  left join auth.users u on u.id = p.id and u.deleted_at is null
  where coalesce(p.email, u.email) is not null
    and trim(coalesce(p.email, u.email, '')) <> ''
),
auth_profiles as (
  select p.id as auth_profile_id, lower(trim(u.email)) as norm_email
  from auth.users u
  inner join public.profiles p on p.id = u.id
  where u.deleted_at is null
    and u.email is not null
),
best as (
  select * from ranked where rn = 1
)
update public.profiles cur
set
  plan = best.plan,
  loops_used_this_month = greatest(cur.loops_used_this_month, best.loops_used_this_month),
  stripe_customer_id = coalesce(cur.stripe_customer_id, best.stripe_customer_id),
  stripe_subscription_id = coalesce(cur.stripe_subscription_id, best.stripe_subscription_id),
  stripe_price_id = coalesce(cur.stripe_price_id, best.stripe_price_id),
  stripe_current_period_end = coalesce(cur.stripe_current_period_end, best.stripe_current_period_end),
  referral_bonus = greatest(cur.referral_bonus, best.referral_bonus),
  level_bonus = greatest(cur.level_bonus, best.level_bonus),
  daily_bonus_month = greatest(cur.daily_bonus_month, best.daily_bonus_month),
  username = coalesce(nullif(trim(cur.username), ''), nullif(trim(best.username), '')),
  email = coalesce(nullif(trim(cur.email), ''), best.norm_email)
from auth_profiles ap
inner join best on best.norm_email = ap.norm_email
where cur.id = ap.auth_profile_id
  and case best.plan when 'studio' then 3 when 'pro' then 2 else 1 end
    > case cur.plan when 'studio' then 3 when 'pro' then 2 else 1 end;
