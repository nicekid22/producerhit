-- Diagnostic: run in Supabase SQL Editor to find plan/credits mismatch.
-- Replace the email below if needed.

-- 1) Auth account
select id, email, created_at, last_sign_in_at
from auth.users
where lower(email) = lower('info.producermarket@gmail.com');

-- 2) Profile tied to that auth id (this is what the app reads)
select
  p.id,
  p.username,
  p.email,
  p.plan,
  p.loops_used_this_month,
  p.referral_bonus,
  p.level_bonus,
  p.daily_bonus_month,
  p.stripe_subscription_id,
  (select count(*) from public.loops l where l.user_id = p.id) as loop_count
from public.profiles p
where p.id = '7ce66a37-8b7e-49a4-a38b-a120a5074b71';

-- 3) Any profile rows sharing the same email (duplicates / legacy)
select
  p.id,
  p.username,
  coalesce(p.email, u.email) as email,
  p.plan,
  p.loops_used_this_month,
  (select count(*) from public.loops l where l.user_id = p.id) as loop_count,
  u.id is not null as has_auth_user
from public.profiles p
left join auth.users u on u.id = p.id and u.deleted_at is null
where lower(coalesce(p.email, u.email, '')) = lower('info.producermarket@gmail.com')
order by
  case p.plan when 'studio' then 3 when 'pro' then 2 else 1 end desc,
  loop_count desc;

-- 4) If query 2 shows plan=free but query 3 shows studio on another id, run load_session_profile after migration 025.
-- Manual hotfix (only if id 7ce66a37 is your live account):
-- update public.profiles set plan = 'studio', username = coalesce(username, 'Producer Hit')
-- where id = '7ce66a37-8b7e-49a4-a38b-a120a5074b71';
