-- YouTube daily cadence — 7 accounts × 7 videos (5 Shorts + 2 long) = 49 / day.
-- social_publish_log: allow multiple YouTube posts per loop (short vs long).

create table if not exists public.youtube_daily_plans (
  id uuid primary key default gen_random_uuid(),
  day date not null,
  account text not null,
  slot_index int not null check (slot_index >= 0 and slot_index < 7),
  format text not null check (format in ('short', 'long')),
  content_source text not null check (content_source in ('community', 'trend_remix')),
  loop_id uuid references public.loops (id) on delete set null,
  display_title text not null default '',
  cta text,
  track_kind text not null default 'song',
  theme text,
  storage_path text,
  publish_variant text,
  status text not null default 'planned'
    check (status in ('planned', 'rendering', 'rendered', 'queued', 'published', 'failed')),
  last_error text,
  youtube_video_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (day, account, slot_index)
);

create index if not exists youtube_daily_plans_day_status_idx
  on public.youtube_daily_plans (day, status, account, slot_index);

alter table public.youtube_daily_plans enable row level security;

comment on table public.youtube_daily_plans is
  'Daily YouTube publish plan — 5 Shorts + 2 long per account (7 channels, 49 videos/day).';

alter table public.social_publish_log
  add column if not exists publish_variant text not null default 'default';

alter table public.social_publish_log
  drop constraint if exists social_publish_log_loop_platform_key;

create unique index if not exists social_publish_log_loop_platform_variant_key
  on public.social_publish_log (loop_id, platform, publish_variant);
