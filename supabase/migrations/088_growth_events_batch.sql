-- Batch insert for growth_events — replaces N sequential RPC calls with 1.
-- Called by flushEventQueue() in supabaseClient.ts.

create or replace function public.log_growth_events_batch(
  p_session_id text,
  p_events jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  ev jsonb;
  uid uuid;
begin
  -- Validate session
  if p_session_id is null or length(p_session_id) < 8 or length(p_session_id) > 128 then
    return;
  end if;

  uid := auth.uid();

  -- Rate limit: max 60 events per session per minute
  if (select count(*) from public.growth_events
      where session_id = p_session_id
        and created_at > now() - interval '1 minute') >= 60 then
    return;
  end if;

  -- Insert all events in a single statement
  insert into public.growth_events (session_id, user_id, name, props, path, client_ts)
  select
    p_session_id,
    uid,
    left(coalesce(ev->>'name', ''), 80),
    case when length(coalesce(ev->>'props', 'null')) > 4000 then null else (ev->>'props')::jsonb end,
    left(coalesce(ev->>'path', ''), 500),
    coalesce((ev->>'client_ts')::timestamptz, now())
  from jsonb_array_elements(p_events) as ev
  where length(coalesce(ev->>'name', '')) >= 2;
end;
$$;

grant execute on function public.log_growth_events_batch(text, jsonb) to anon, authenticated;
