-- Hermes Execution Pack — revenue events + metrics RPC (service_role only)
-- Complements: profiles (users), growth_events + client_events (events), get_growth_dashboard (funnel)

create table if not exists public.billing_revenue_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  user_id uuid references public.profiles (id) on delete set null,
  stripe_subscription_id text,
  stripe_invoice_id text,
  event_type text not null check (
    event_type in (
      'subscription_activated',
      'subscription_updated',
      'subscription_canceled',
      'invoice_paid',
      'refund',
      'credit_pack_purchased'
    )
  ),
  plan text,
  amount_cents int,
  currency text not null default 'usd',
  status text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists billing_revenue_events_created_idx
  on public.billing_revenue_events (created_at desc);
create index if not exists billing_revenue_events_user_idx
  on public.billing_revenue_events (user_id, created_at desc);
create index if not exists billing_revenue_events_type_idx
  on public.billing_revenue_events (event_type, created_at desc);

alter table public.billing_revenue_events enable row level security;

comment on table public.billing_revenue_events is
  'Stripe revenue ledger for Hermes metrics sync. No RLS policies — service_role only.';

-- Approximate monthly USD per plan (align with src/lib/planPricing.ts)
create or replace function public._plan_mrr_cents(p_plan text)
returns int
language sql
immutable
as $$
  select case lower(coalesce(p_plan, 'free'))
    when 'pro' then 800
    when 'studio' then 2400
    when 'plus' then 4700
    else 0
  end;
$$;

create or replace function public.get_hermes_execution_metrics(p_days int default 30)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_days int := greatest(1, least(coalesce(p_days, 30), 90));
  v_since timestamptz := now() - make_interval(days => v_days);
  v_since_24h timestamptz := now() - interval '24 hours';
  v_since_7d timestamptz := now() - interval '7 days';
  v_users jsonb;
  v_funnel jsonb;
  v_revenue jsonb;
  v_channels jsonb;
  v_retention jsonb;
begin
  -- Users / plans
  select jsonb_build_object(
    'total', (select count(*)::int from public.profiles),
    'signups_24h', (select count(*)::int from public.profiles where created_at >= v_since_24h),
    'signups_7d', (select count(*)::int from public.profiles where created_at >= v_since_7d),
    'active_7d', (
      select count(distinct user_id)::int
      from public.growth_events
      where created_at >= v_since_7d and user_id is not null
    ),
    'by_plan', (
      select coalesce(jsonb_object_agg(plan, cnt), '{}'::jsonb)
      from (
        select plan, count(*)::int as cnt
        from public.profiles
        group by plan
      ) p
    ),
    'paid_subscriptions', (
      select count(*)::int
      from public.profiles
      where stripe_subscription_id is not null
        and plan in ('pro', 'studio', 'plus')
    )
  ) into v_users;

  -- Funnel (session-based, growth_events)
  with sessions as (
    select
      ge.session_id,
      bool_or(ge.name = 'landing_view') as saw_landing,
      bool_or(ge.name = 'signup_completed') as signed_up,
      bool_or(ge.name = 'generate_success') as gen_success,
      bool_or(ge.name = 'first_audio_play') as heard_audio,
      bool_or(ge.name = 'checkout_start') as checkout_start,
      bool_or(ge.name = 'subscription_activated') as subscribed
    from public.growth_events ge
    where ge.created_at >= v_since
    group by ge.session_id
  )
  select jsonb_build_object(
    'sessions', count(*)::int,
    'landing', count(*) filter (where saw_landing)::int,
    'signups', count(*) filter (where signed_up)::int,
    'generations', count(*) filter (where gen_success)::int,
    'first_play', count(*) filter (where heard_audio)::int,
    'checkouts', count(*) filter (where checkout_start)::int,
    'subscriptions', count(*) filter (where subscribed)::int,
    'signup_to_gen_pct', case
      when count(*) filter (where signed_up) > 0
      then round(100.0 * count(*) filter (where gen_success) / count(*) filter (where signed_up), 1)
      else 0
    end,
    'gen_to_checkout_pct', case
      when count(*) filter (where gen_success) > 0
      then round(100.0 * count(*) filter (where checkout_start) / count(*) filter (where gen_success), 1)
      else 0
    end,
    'checkout_to_paid_pct', case
      when count(*) filter (where checkout_start) > 0
      then round(100.0 * count(*) filter (where subscribed) / count(*) filter (where checkout_start), 1)
      else 0
    end
  ) into v_funnel
  from sessions;

  -- Revenue ledger + MRR estimate
  select jsonb_build_object(
    'mrr_cents_estimate', (
      select coalesce(sum(public._plan_mrr_cents(plan)), 0)::int
      from public.profiles
      where stripe_subscription_id is not null
        and plan in ('pro', 'studio', 'plus')
    ),
    'arr_cents_estimate', (
      select coalesce(sum(public._plan_mrr_cents(plan)), 0)::int * 12
      from public.profiles
      where stripe_subscription_id is not null
        and plan in ('pro', 'studio', 'plus')
    ),
    'events_24h', (
      select count(*)::int from public.billing_revenue_events where created_at >= v_since_24h
    ),
    'activations_7d', (
      select count(*)::int
      from public.billing_revenue_events
      where created_at >= v_since_7d and event_type = 'subscription_activated'
    ),
    'cancellations_7d', (
      select count(*)::int
      from public.billing_revenue_events
      where created_at >= v_since_7d and event_type = 'subscription_canceled'
    ),
    'invoice_paid_cents_7d', (
      select coalesce(sum(amount_cents), 0)::int
      from public.billing_revenue_events
      where created_at >= v_since_7d and event_type = 'invoice_paid'
    ),
    'free_to_paid_pct_7d', case
      when (select count(*) from public.profiles where created_at >= v_since_7d) > 0
      then round(
        100.0 * (
          select count(*) from public.billing_revenue_events
          where created_at >= v_since_7d and event_type = 'subscription_activated'
        ) / (select count(*) from public.profiles where created_at >= v_since_7d),
        2
      )
      else 0
    end,
    'churn_rate_7d_pct', case
      when (select count(*) from public.profiles where stripe_subscription_id is not null) > 0
      then round(
        100.0 * (
          select count(*) from public.billing_revenue_events
          where created_at >= v_since_7d and event_type = 'subscription_canceled'
        ) / greatest(
          1,
          (select count(*) from public.profiles where stripe_subscription_id is not null)
        ),
        2
      )
      else 0
    end
  ) into v_revenue;

  -- Top acquisition channels (UTM)
  select coalesce(
    jsonb_agg(jsonb_build_object('source', src, 'count', cnt) order by cnt desc),
    '[]'::jsonb
  ) into v_channels
  from (
    select coalesce(nullif(trim(props->>'utm_source'), ''), 'direct') as src, count(*)::int as cnt
    from public.growth_events
    where created_at >= v_since
    group by 1
    order by cnt desc
    limit 10
  ) s;

  -- Retention proxies (D1/D7 from signup cohort — simplified)
  with cohort as (
    select id, created_at::date as signup_day
    from public.profiles
    where created_at >= v_since
  ),
  active as (
    select distinct user_id, created_at::date as active_day
    from public.growth_events
    where user_id is not null and created_at >= v_since
  )
  select jsonb_build_object(
    'd1_pct', case
      when (select count(*) from cohort) > 0 then round(
        100.0 * (
          select count(distinct c.id)
          from cohort c
          join active a on a.user_id = c.id and a.active_day = c.signup_day + 1
        ) / (select count(*) from cohort),
        1
      )
      else null
    end,
    'd7_pct', case
      when (select count(*) from cohort) > 0 then round(
        100.0 * (
          select count(distinct c.id)
          from cohort c
          join active a on a.user_id = c.id
            and a.active_day between c.signup_day + 1 and c.signup_day + 7
        ) / (select count(*) from cohort),
        1
      )
      else null
    end
  ) into v_retention;

  return jsonb_build_object(
    'generated_at', now(),
    'days', v_days,
    'since', v_since,
    'users', v_users,
    'funnel', v_funnel,
    'revenue', v_revenue,
    'channels', v_channels,
    'retention', v_retention
  );
end;
$$;

revoke all on function public.get_hermes_execution_metrics(int) from public;
revoke all on function public.get_hermes_execution_metrics(int) from anon;
revoke all on function public.get_hermes_execution_metrics(int) from authenticated;
grant execute on function public.get_hermes_execution_metrics(int) to service_role;

comment on function public.get_hermes_execution_metrics(int) is
  'Execution Pack metrics for Hermes sync script (service_role). Not exposed to clients.';
