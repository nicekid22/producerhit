alter table public.profiles
  add column if not exists last_generation_at timestamptz,
  add column if not exists generation_window_started_at timestamptz,
  add column if not exists generation_window_count integer not null default 0;

create or replace function public.check_and_bump_generation_rate_limit(
  p_window_seconds integer,
  p_max_in_window integer,
  p_min_interval_seconds integer
)
returns table(ok boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  now_ts timestamptz := now();
  window_start timestamptz;
  window_count integer;
  last_ts timestamptz;
  elapsed_window_seconds integer;
  elapsed_since_last integer;
begin
  if uid is null then
    return query select false, 0;
    return;
  end if;

  select generation_window_started_at, generation_window_count, last_generation_at
    into window_start, window_count, last_ts
  from public.profiles
  where id = uid
  for update;

  if window_start is null then
    window_start := now_ts;
    window_count := 0;
  end if;

  elapsed_window_seconds := floor(extract(epoch from (now_ts - window_start)));
  if elapsed_window_seconds >= p_window_seconds then
    window_start := now_ts;
    window_count := 0;
    elapsed_window_seconds := 0;
  end if;

  if last_ts is not null and p_min_interval_seconds > 0 then
    elapsed_since_last := floor(extract(epoch from (now_ts - last_ts)));
    if elapsed_since_last < p_min_interval_seconds then
      return query select false, greatest(1, p_min_interval_seconds - elapsed_since_last);
      return;
    end if;
  end if;

  if p_max_in_window > 0 and window_count >= p_max_in_window then
    return query select false, greatest(1, p_window_seconds - elapsed_window_seconds);
    return;
  end if;

  update public.profiles
    set generation_window_started_at = window_start,
        generation_window_count = window_count + 1,
        last_generation_at = now_ts
  where id = uid;

  return query select true, 0;
end;
$$;
