-- Checkout abandon → marketing_leads with props (win-back nurture)

drop function if exists public.capture_marketing_lead(text, text, text, text, text, text, text, text);

create or replace function public.capture_marketing_lead(
  p_email text,
  p_locale text default 'en',
  p_source text default 'landing',
  p_session_id text default null,
  p_utm_source text default null,
  p_utm_medium text default null,
  p_utm_campaign text default null,
  p_utm_content text default null,
  p_props jsonb default null
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
    utm_source, utm_medium, utm_campaign, utm_content, props
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
    nullif(left(trim(coalesce(p_utm_content, '')), 120), ''),
    p_props
  )
  on conflict (email) do update
    set locale = excluded.locale,
        source = case
          when excluded.source = 'checkout_abandon' then excluded.source
          else coalesce(excluded.source, marketing_leads.source)
        end,
        user_id = coalesce(excluded.user_id, marketing_leads.user_id),
        utm_source = coalesce(excluded.utm_source, marketing_leads.utm_source),
        utm_medium = coalesce(excluded.utm_medium, marketing_leads.utm_medium),
        utm_campaign = coalesce(excluded.utm_campaign, marketing_leads.utm_campaign),
        utm_content = coalesce(excluded.utm_content, marketing_leads.utm_content),
        props = coalesce(marketing_leads.props, '{}'::jsonb) || coalesce(excluded.props, '{}'::jsonb),
        subscribed_at = case
          when excluded.source = 'checkout_abandon' then now()
          else marketing_leads.subscribed_at
        end
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

grant execute on function public.capture_marketing_lead(text, text, text, text, text, text, text, text, jsonb) to anon, authenticated;

create index if not exists marketing_leads_checkout_abandon_idx
  on public.marketing_leads (subscribed_at desc)
  where source = 'checkout_abandon';
