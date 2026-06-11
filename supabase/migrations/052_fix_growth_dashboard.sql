-- Corrige le funnel admin : generate_success / checkout_start vivent dans growth_events, pas client_events.

create or replace function public.get_growth_dashboard(p_days int default 30)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_admin boolean := false;
  v_since timestamptz := now() - make_interval(days => greatest(1, least(coalesce(p_days, 30), 90)));
  v_by_source jsonb := '[]'::jsonb;
  v_by_event jsonb := '[]'::jsonb;
  v_funnel jsonb;
  v_referrals jsonb;
  v_landing int;
  v_signups int;
  v_generations int;
  v_checkouts int;
  v_upgrades int;
  v_upgrade_prompts int;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select coalesce(is_growth_admin, false) into v_admin from public.profiles where id = v_uid;
  if not v_admin then
    raise exception 'forbidden';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object('source', src, 'count', cnt) order by cnt desc), '[]'::jsonb)
  into v_by_source
  from (
    select coalesce(nullif(trim(props->>'utm_source'), ''), 'direct') as src, count(*)::int as cnt
    from public.growth_events
    where created_at >= v_since
    group by 1
    order by cnt desc
    limit 20
  ) s;

  select coalesce(jsonb_agg(jsonb_build_object('name', n, 'count', cnt) order by cnt desc), '[]'::jsonb)
  into v_by_event
  from (
    select name as n, count(*)::int as cnt
    from public.growth_events
    where created_at >= v_since
    group by 1
    order by cnt desc
    limit 30
  ) x;

  select count(*)::int into v_landing
  from public.growth_events
  where created_at >= v_since
    and name in ('landing_generate_click', 'landing_view');

  select count(*)::int into v_signups
  from public.growth_events
  where created_at >= v_since and name = 'signup_completed';

  select count(*)::int into v_generations
  from public.growth_events
  where created_at >= v_since and name = 'generate_success';

  select count(*)::int into v_checkouts
  from public.growth_events
  where created_at >= v_since and name = 'checkout_start';

  select count(*)::int into v_upgrades
  from public.growth_events
  where created_at >= v_since and name = 'subscription_activated';

  select count(*)::int into v_upgrade_prompts
  from public.growth_events
  where created_at >= v_since and name = 'upgrade_prompt_shown';

  v_funnel := jsonb_build_object(
    'landing_clicks', v_landing,
    'signups', v_signups,
    'generations', v_generations,
    'checkouts', v_checkouts,
    'subscriptions', v_upgrades,
    'upgrade_prompts', v_upgrade_prompts,
    'signup_to_gen_pct', case when v_signups > 0 then round(100.0 * v_generations / v_signups, 1) else 0 end,
    'gen_to_checkout_pct', case when v_generations > 0 then round(100.0 * v_checkouts / v_generations, 1) else 0 end,
    'checkout_to_paid_pct', case when v_checkouts > 0 then round(100.0 * v_upgrades / v_checkouts, 1) else 0 end
  );

  select jsonb_build_object(
    'referred_users', (select count(*)::int from public.profiles where referred_by is not null and created_at >= v_since),
    'total_referral_bonus', (select coalesce(sum(referral_bonus), 0)::int from public.profiles)
  )
  into v_referrals;

  return jsonb_build_object(
    'since', v_since,
    'days', greatest(1, least(coalesce(p_days, 30), 90)),
    'by_source', v_by_source,
    'by_event', v_by_event,
    'funnel', v_funnel,
    'referrals', v_referrals
  );
end;
$$;
