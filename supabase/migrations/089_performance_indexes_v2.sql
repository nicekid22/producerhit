-- Indexes critiques pour réduire la charge CPU sur les requêtes fréquentes.
-- Voir audit: generation_jobs polling (3s), discord_bot_events (cron),
-- social_publish_queue (cron 15min), growth_events (flush), youtube_daily_plans.

-- generation_jobs: polling par id + status (poll_job action)
create index if not exists generation_jobs_status_created_idx
  on public.generation_jobs (status, created_at desc);

-- discord_bot_events: event_type + created_at DESC (showcaseSpotlight, alreadyRan, memberWelcomePulse)
create index if not exists discord_bot_events_type_created_idx
  on public.discord_bot_events (event_type, created_at desc);

-- social_publish_queue: status IN ('pending','failed') + created_at ASC (processQueue)
create index if not exists social_publish_queue_status_created_idx
  on public.social_publish_queue (status, created_at asc);

-- growth_events: session_id + created_at (rate limit check dans log_growth_event)
create index if not exists growth_events_session_created_idx
  on public.growth_events (session_id, created_at desc);

-- youtube_daily_plans: day + status (youtube-daily-run query)
create index if not exists youtube_daily_plans_day_status_idx
  on public.youtube_daily_plans (day, status);
