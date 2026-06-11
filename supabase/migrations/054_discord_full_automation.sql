-- Discord full automation: daily crons + auto-post on public loops

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- Helper: POST to discord-cron edge function
create or replace function public.discord_cron_post(p_action text, p_body jsonb default '{}'::jsonb)
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
    url := 'https://pmfnzenqemnonpglmjqx.supabase.co/functions/v1/discord-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-discord-cron-secret', '7c13f270fafd45a2abc9df9550792241'
    ),
    body := v_body
  ) into v_request_id;
  return v_request_id;
end;
$$;

revoke all on function public.discord_cron_post(text, jsonb) from public;
grant execute on function public.discord_cron_post(text, jsonb) to postgres;

-- Auto-post to Discord showcase when a loop becomes public
create or replace function public.discord_notify_public_loop()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(NEW.is_public, false) = true
     and (TG_OP = 'INSERT' or coalesce(OLD.is_public, false) = false) then
    perform public.discord_cron_post('post_public_loop', jsonb_build_object('loop_id', NEW.id::text));
  end if;
  return NEW;
end;
$$;

drop trigger if exists loops_discord_public_notify on public.loops;
create trigger loops_discord_public_notify
  after insert or update of is_public on public.loops
  for each row
  execute function public.discord_notify_public_loop();

-- Idempotent cron job registration
do $$
declare
  r record;
begin
  for r in
    select jobname from cron.job
    where jobname in (
      'discord_weekly_start',
      'discord_weekly_close',
      'discord_daily_pulse',
      'discord_daily_tip',
      'discord_showcase_spotlight',
      'discord_challenge_reminder_wed',
      'discord_challenge_reminder_fri',
      'discord_member_welcome',
      'discord_community_stats',
      'discord_weekend_vibes_sat',
      'discord_weekend_vibes_sun'
    )
  loop
    perform cron.unschedule(r.jobname);
  end loop;
end $$;

-- Weekly challenge (existing schedule)
select cron.schedule(
  'discord_weekly_start',
  '0 9 * * 1',
  $$select public.discord_cron_post('start_weekly');$$
);

select cron.schedule(
  'discord_weekly_close',
  '0 23 * * 0',
  $$select public.discord_cron_post('close_weekly');$$
);

-- Daily engagement (UTC)
select cron.schedule(
  'discord_daily_pulse',
  '0 14 * * *',
  $$select public.discord_cron_post('daily_pulse');$$
);

select cron.schedule(
  'discord_daily_tip',
  '0 16 * * *',
  $$select public.discord_cron_post('daily_tip');$$
);

-- Showcase spotlight every 6 hours (catches loops missed by trigger)
select cron.schedule(
  'discord_showcase_spotlight',
  '0 */6 * * *',
  $$select public.discord_cron_post('showcase_spotlight');$$
);

-- Challenge mid-week reminders
select cron.schedule(
  'discord_challenge_reminder_wed',
  '0 15 * * 3',
  $$select public.discord_cron_post('challenge_reminder');$$
);

select cron.schedule(
  'discord_challenge_reminder_fri',
  '0 15 * * 5',
  $$select public.discord_cron_post('challenge_reminder');$$
);

-- New member welcome pulse (poll member count every 30 min)
select cron.schedule(
  'discord_member_welcome',
  '*/30 * * * *',
  $$select public.discord_cron_post('member_welcome');$$
);

-- Sunday recap before results
select cron.schedule(
  'discord_community_stats',
  '0 18 * * 0',
  $$select public.discord_cron_post('community_stats');$$
);

-- Weekend studio prompts
select cron.schedule(
  'discord_weekend_vibes_sat',
  '0 17 * * 6',
  $$select public.discord_cron_post('weekend_vibes');$$
);

select cron.schedule(
  'discord_weekend_vibes_sun',
  '0 12 * * 0',
  $$select public.discord_cron_post('weekend_vibes');$$
);
