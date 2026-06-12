-- Social publish automation: queue + cross-platform cron (Twitter, webhook, IndexNow, …)
-- Pair with Edge Function social-publish-cron + secret SOCIAL_PUBLISH_CRON_SECRET

create table if not exists public.social_publish_queue (
  id uuid primary key default gen_random_uuid(),
  loop_id uuid not null references public.loops(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'done', 'failed')),
  attempts int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint social_publish_queue_loop_id_key unique (loop_id)
);

create index if not exists social_publish_queue_status_created_idx
  on public.social_publish_queue (status, created_at);

create table if not exists public.social_publish_log (
  id uuid primary key default gen_random_uuid(),
  loop_id uuid not null references public.loops(id) on delete cascade,
  platform text not null,
  status text not null default 'posted'
    check (status in ('posted', 'failed', 'skipped')),
  external_id text,
  payload jsonb,
  error text,
  created_at timestamptz not null default now(),
  constraint social_publish_log_loop_platform_key unique (loop_id, platform)
);

create index if not exists social_publish_log_created_idx
  on public.social_publish_log (created_at desc);

alter table public.social_publish_queue enable row level security;
alter table public.social_publish_log enable row level security;

-- Service role / edge only (no anon policies)

create or replace function public.social_publish_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  NEW.updated_at := now();
  return NEW;
end;
$$;

drop trigger if exists social_publish_queue_touch on public.social_publish_queue;
create trigger social_publish_queue_touch
  before update on public.social_publish_queue
  for each row execute function public.social_publish_touch_updated_at();

-- POST to social-publish-cron edge function
create or replace function public.social_cron_post(p_action text, p_body jsonb default '{}'::jsonb)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_body jsonb := jsonb_build_object('action', p_action) || coalesce(p_body, '{}'::jsonb);
  v_request_id bigint;
begin
  select net.http_post(
    url := 'https://pmfnzenqemnonpglmjqx.supabase.co/functions/v1/social-publish-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-social-cron-secret', 'a8f3c2e1b9d04f6a8e7c5d3b2a190f4'
    ),
    body := v_body
  ) into v_request_id;
  return v_request_id;
end;
$$;

revoke all on function public.social_cron_post(text, jsonb) from public;
grant execute on function public.social_cron_post(text, jsonb) to postgres;

-- Enqueue when a loop becomes public (+ immediate process attempt)
create or replace function public.social_enqueue_public_loop()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(NEW.is_public, false) = true
     and coalesce(NEW.audio_url, '') <> ''
     and (TG_OP = 'INSERT' or coalesce(OLD.is_public, false) = false) then
    insert into public.social_publish_queue (loop_id, status, attempts)
    values (NEW.id, 'pending', 0)
    on conflict (loop_id) do update
      set status = 'pending',
          attempts = 0,
          last_error = null,
          updated_at = now()
      where social_publish_queue.status in ('failed', 'done');

    perform public.social_cron_post('process_loop', jsonb_build_object('loop_id', NEW.id::text));
  end if;
  return NEW;
end;
$$;

drop trigger if exists loops_social_publish_enqueue on public.loops;
create trigger loops_social_publish_enqueue
  after insert or update of is_public on public.loops
  for each row
  execute function public.social_enqueue_public_loop();

-- Process pending queue every 5 minutes (catches missed trigger / retries)
do $$
declare
  r record;
begin
  for r in select jobname from cron.job where jobname = 'social_publish_process_queue'
  loop
    perform cron.unschedule(r.jobname);
  end loop;
end $$;

select cron.schedule(
  'social_publish_process_queue',
  '*/5 * * * *',
  $$select public.social_cron_post('process_queue');$$
);

-- Backfill: enqueue recent public loops not yet in queue (last 200)
insert into public.social_publish_queue (loop_id, status)
select l.id, 'pending'
from public.loops l
where l.is_public = true
  and coalesce(l.audio_url, '') <> ''
  and not exists (select 1 from public.social_publish_queue q where q.loop_id = l.id)
order by l.created_at desc
limit 200
on conflict (loop_id) do nothing;
