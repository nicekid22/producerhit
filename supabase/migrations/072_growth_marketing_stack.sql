-- Growth marketing stack: email capture, server attribution, referral leaderboard, share tracking.

alter table public.profiles
  add column if not exists acquisition_attribution jsonb,
  add column if not exists marketing_opt_in boolean not null default false;

create table if not exists public.marketing_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  locale text not null default 'en',
  source text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  session_id text,
  user_id uuid references public.profiles (id) on delete set null,
  props jsonb,
  subscribed_at timestamptz not null default now(),
  constraint marketing_leads_email_unique unique (email)
);

create index if not exists marketing_leads_subscribed_idx on public.marketing_leads (subscribed_at desc);
create index if not exists marketing_leads_utm_source_idx on public.marketing_leads (utm_source);

alter table public.marketing_leads enable row level security;

-- ─── Email capture (anon + auth) ─────────────────────────────────────────────

create or replace function public.capture_marketing_lead(
  p_email text,
  p_locale text default 'en',
  p_source text default 'landing',
  p_session_id text default null,
  p_utm_source text default null,
  p_utm_medium text default null,
  p_utm_campaign text default null,
  p_utm_content text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_uid uuid := auth.uid();
  v_recent int;
  v_id uuid;
begin
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(v_email) > 254 then
    return jsonb_build_object('ok', false, 'error', 'invalid_email');
  end if;

  if p_session_id is not null and length(trim(p_session_id)) >= 8 then
    select count(*)::int into v_recent
    from public.marketing_leads
    where session_id = trim(p_session_id)
      and subscribed_at > now() - interval '1 hour';
    if v_recent >= 5 then
      return jsonb_build_object('ok', false, 'error', 'rate_limited');
    end if;
  end if;

  insert into public.marketing_leads (
    email, locale, source, session_id, user_id,
    utm_source, utm_medium, utm_campaign, utm_content
  )
  values (
    v_email,
    left(coalesce(p_locale, 'en'), 8),
    left(coalesce(p_source, 'landing'), 80),
    nullif(left(trim(coalesce(p_session_id, '')), 128), ''),
    v_uid,
    nullif(left(trim(coalesce(p_utm_source, '')), 120), ''),
    nullif(left(trim(coalesce(p_utm_medium, '')), 120), ''),
    nullif(left(trim(coalesce(p_utm_campaign, '')), 120), ''),
    nullif(left(trim(coalesce(p_utm_content, '')), 120), '')
  )
  on conflict (email) do update
    set locale = excluded.locale,
        source = coalesce(excluded.source, marketing_leads.source),
        user_id = coalesce(excluded.user_id, marketing_leads.user_id),
        utm_source = coalesce(excluded.utm_source, marketing_leads.utm_source),
        utm_medium = coalesce(excluded.utm_medium, marketing_leads.utm_medium),
        utm_campaign = coalesce(excluded.utm_campaign, marketing_leads.utm_campaign),
        utm_content = coalesce(excluded.utm_content, marketing_leads.utm_content)
  returning id into v_id;

  if v_uid is not null then
    update public.profiles
    set marketing_opt_in = true,
        email = coalesce(nullif(trim(email), ''), v_email)
    where id = v_uid;
  end if;

  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

grant execute on function public.capture_marketing_lead(text, text, text, text, text, text, text, text) to anon, authenticated;

-- ─── Persist first-touch attribution on signup ───────────────────────────────

create or replace function public.sync_user_attribution(p_attribution jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;
  if p_attribution is null or jsonb_typeof(p_attribution) <> 'object' then
    return jsonb_build_object('ok', false, 'error', 'invalid_payload');
  end if;

  update public.profiles
  set acquisition_attribution = coalesce(acquisition_attribution, p_attribution)
  where id = v_uid
    and acquisition_attribution is null;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.sync_user_attribution(jsonb) to authenticated;

-- ─── Referral leaderboard (public stats, no PII) ────────────────────────────

create or replace function public.get_referral_leaderboard(p_limit int default 10)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows jsonb;
  v_limit int := greatest(3, least(coalesce(p_limit, 10), 25));
begin
  select coalesce(jsonb_agg(row order by (row->>'referrals')::int desc), '[]'::jsonb)
  into v_rows
  from (
    select jsonb_build_object(
      'referrals', count(*)::int,
      'code_prefix', left(referrer.referral_code, 4)
    ) as row
    from public.profiles referred
    join public.profiles referrer on referrer.id = referred.referred_by
    where referred.referred_by is not null
    group by referrer.id, referrer.referral_code
    order by count(*) desc
    limit v_limit
  ) t;

  return jsonb_build_object('ok', true, 'items', v_rows);
end;
$$;

grant execute on function public.get_referral_leaderboard(int) to anon, authenticated;

-- ─── Track viral share (server-side counter in growth_events via existing RPC) ─

create or replace function public.track_viral_share(
  p_channel text,
  p_session_id text,
  p_target text default null,
  p_loop_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_channel text := lower(trim(coalesce(p_channel, '')));
  v_session text := trim(coalesce(p_session_id, ''));
begin
  if length(v_channel) < 2 or length(v_channel) > 40 then
    return jsonb_build_object('ok', false, 'error', 'invalid_channel');
  end if;
  if length(v_session) < 8 then
    return jsonb_build_object('ok', false, 'error', 'invalid_session');
  end if;

  perform public.log_growth_event(
    v_session,
    'viral_share',
    jsonb_build_object(
      'channel', v_channel,
      'target', left(coalesce(p_target, ''), 120),
      'loop_id', p_loop_id
    ),
    null,
    now()
  );

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.track_viral_share(text, text, text, uuid) to anon, authenticated;
