-- YouTube cadence: slower pg_cron + batch limit 1 (pairs with edge SOCIAL_PUBLISH_QUEUE_BATCH)

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
  '*/15 * * * *',
  $$select public.social_cron_post('process_queue', '{"limit":1}'::jsonb);$$
);
