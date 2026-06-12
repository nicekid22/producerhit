-- ProducerHit — funnel hebdo (growth_events)
-- Usage : Supabase SQL Editor ou MCP execute_sql
-- Ajuster : remplacer interval '14 days' par '7 days' si besoin.

-- 1) Entonnoir par session
with sessions as (
  select
    ge.session_id,
    bool_or(ge.name = 'landing_view') as saw_landing,
    bool_or(ge.name = 'landing_generate_click') as clicked_gen,
    bool_or(ge.name = 'signup_completed') as signed_up,
    bool_or(ge.name = 'dashboard_view') as saw_dashboard,
    bool_or(ge.name = 'dashboard_ready') as dashboard_ready,
    bool_or(ge.name = 'generate_start') as started_gen,
    bool_or(ge.name = 'generate_success') as gen_success,
    bool_or(ge.name = 'first_audio_play') as heard_audio,
    bool_or(ge.name = 'generation_abandon') as abandoned_gen,
    bool_or(ge.name = 'subscription_activated') as subscribed
  from public.growth_events ge
  where ge.created_at >= now() - interval '14 days'
  group by ge.session_id
)
select
  count(*) as total_sessions,
  count(*) filter (where saw_landing) as landing,
  round(100.0 * count(*) filter (where saw_landing) / nullif(count(*), 0), 1) as pct_landing,
  count(*) filter (where clicked_gen) as click_gen,
  round(100.0 * count(*) filter (where clicked_gen) / nullif(count(*) filter (where saw_landing), 0), 1) as pct_click_from_landing,
  count(*) filter (where signed_up) as signup,
  count(*) filter (where saw_dashboard) as dashboard,
  count(*) filter (where dashboard_ready) as ready,
  round(100.0 * count(*) filter (where dashboard_ready) / nullif(count(*) filter (where saw_dashboard), 0), 1) as pct_ready_from_dashboard,
  count(*) filter (where started_gen) as gen_start,
  count(*) filter (where gen_success) as gen_ok,
  round(100.0 * count(*) filter (where gen_success) / nullif(count(*) filter (where started_gen), 0), 1) as pct_gen_success,
  count(*) filter (where heard_audio) as first_play,
  round(100.0 * count(*) filter (where heard_audio) / nullif(count(*) filter (where gen_success), 0), 1) as pct_play_after_gen,
  count(*) filter (where abandoned_gen) as gen_abandon,
  count(*) filter (where subscribed) as paid
from sessions;

-- 2) Durée génération (start → success)
select
  percentile_cont(0.5) within group (order by extract(epoch from (success_ts - start_ts))) as p50_sec,
  percentile_cont(0.9) within group (order by extract(epoch from (success_ts - start_ts))) as p90_sec,
  count(*) as pairs
from (
  select s.client_ts as start_ts, min(e.client_ts) as success_ts
  from public.growth_events s
  join public.growth_events e
    on e.session_id = s.session_id
   and e.name = 'generate_success'
   and e.client_ts >= s.client_ts
  where s.created_at >= now() - interval '14 days'
    and s.name = 'generate_start'
  group by s.session_id, s.client_ts
) t
where success_ts is not null;

-- 3) Latence dashboard_ready (prop load_ms côté client)
select
  percentile_cont(0.5) within group (order by ((props->>'load_ms')::numeric)) as p50_load_ms,
  percentile_cont(0.9) within group (order by ((props->>'load_ms')::numeric)) as p90_load_ms,
  count(*) as n
from public.growth_events
where created_at >= now() - interval '14 days'
  and name = 'dashboard_ready'
  and (props->>'load_ms') ~ '^\d+$';
