-- Allow skipped status (duplicate remix long already on YouTube via trend pipeline).
alter table public.youtube_daily_plans drop constraint if exists youtube_daily_plans_status_check;
alter table public.youtube_daily_plans add constraint youtube_daily_plans_status_check
  check (status in ('planned', 'rendering', 'rendered', 'queued', 'published', 'failed', 'skipped'));
