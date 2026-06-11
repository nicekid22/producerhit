-- Weekly Discord challenge automation (pg_cron + pg_net)
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- Idempotent: remove old jobs if re-applied
select cron.unschedule(jobid)
from cron.job
where jobname in ('discord_weekly_start', 'discord_weekly_close');

select cron.schedule(
  'discord_weekly_start',
  '0 9 * * 1',
  $$
  select net.http_post(
    url := 'https://pmfnzenqemnonpglmjqx.supabase.co/functions/v1/discord-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-discord-cron-secret', '7c13f270fafd45a2abc9df9550792241'
    ),
    body := '{"action":"start_weekly"}'::jsonb
  ) as request_id;
  $$
);

select cron.schedule(
  'discord_weekly_close',
  '0 23 * * 0',
  $$
  select net.http_post(
    url := 'https://pmfnzenqemnonpglmjqx.supabase.co/functions/v1/discord-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-discord-cron-secret', '7c13f270fafd45a2abc9df9550792241'
    ),
    body := '{"action":"close_weekly"}'::jsonb
  ) as request_id;
  $$
);
