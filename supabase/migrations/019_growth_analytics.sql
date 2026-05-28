-- Growth analytics: anonymous events + admin dashboard RPC

alter table public.profiles
  add column if not exists is_growth_admin boolean not null default false;

create table if not exists public.growth_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  user_id uuid references public.profiles (id) on delete set null,
  name text not null,
  props jsonb,
  path text,
  client_ts timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists growth_events_created_idx on public.growth_events (created_at desc);
create index if not exists growth_events_name_idx on public.growth_events (name);
create index if not exists growth_events_session_idx on public.growth_events (session_id);

alter table public.growth_events enable row level security;

create or replace function public.log_growth_event(
  p_session_id text,
  p_name text,
  p_props jsonb default null,
  p_path text default null,
  p_client_ts timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_session_id is null or length(trim(p_session_id)) < 8 then
    return;
  end if;
  if p_name is null or length(trim(p_name)) < 2 then
    return;
  end if;

  insert into public.growth_events (session_id, user_id, name, props, path, client_ts)
  values (
    trim(p_session_id),
    auth.uid(),
    trim(p_name),
    p_props,
    p_path,
    coalesce(p_client_ts, now())
  );
end;
$$;

grant execute on function public.log_growth_event(text, text, jsonb, text, timestamptz) to anon, authenticated;

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
    from (
      select props from public.growth_events where created_at >= v_since
      union all
      select props from public.client_events where created_at >= v_since
    ) u
    group by 1
    order by cnt desc
    limit 20
  ) s;

  select coalesce(jsonb_agg(jsonb_build_object('name', n, 'count', cnt) order by cnt desc), '[]'::jsonb)
  into v_by_event
  from (
    select name as n, count(*)::int as cnt
    from (
      select name from public.growth_events where created_at >= v_since
      union all
      select name from public.client_events where created_at >= v_since
    ) e
    group by 1
    order by cnt desc
    limit 30
  ) x;

  select jsonb_build_object(
    'landing_clicks', (
      select count(*)::int from public.growth_events
      where created_at >= v_since and name in ('landing_generate_click', 'page_view')
    ),
    'signups', (
      select count(*)::int from public.growth_events
      where created_at >= v_since and name = 'signup_completed'
    ),
    'generations', (
      select count(*)::int from public.client_events
      where created_at >= v_since and name = 'generate_success'
    ),
    'checkouts', (
      select count(*)::int from public.client_events
      where created_at >= v_since and name = 'checkout_start'
    )
  )
  into v_funnel;

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

grant execute on function public.get_growth_dashboard(int) to authenticated;
