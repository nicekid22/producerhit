-- Trend remix automation — full-length landscape YouTube (2 dedicated channels).

create table if not exists public.trend_remix_catalog (
  id text primary key,
  original_title text not null,
  original_artist text not null,
  trend_keywords text[] not null default '{}',
  search_queries text[] not null default '{}',
  remix_genre text not null,
  mood text not null default 'Emotional',
  bpm int not null default 120,
  duration_sec int not null default 90,
  lyrics text not null default '',
  lyrics_theme text not null,
  ace_caption text not null,
  sample_query text not null,
  trend_score int not null default 50,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trend_remix_plans (
  id uuid primary key default gen_random_uuid(),
  day date not null,
  slot text not null check (slot in ('morning', 'evening')),
  catalog_id text not null references public.trend_remix_catalog (id),
  target_youtube_account text not null check (target_youtube_account in ('remix1', 'remix2')),
  display_title text not null,
  loop_id uuid references public.loops (id) on delete set null,
  status text not null default 'planned'
    check (status in ('planned', 'generating', 'ready', 'queued', 'published', 'failed')),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (day, slot)
);

create index if not exists trend_remix_plans_day_status_idx
  on public.trend_remix_plans (day, status, slot);

create index if not exists trend_remix_catalog_active_score_idx
  on public.trend_remix_catalog (active, trend_score desc);

alter table public.trend_remix_catalog enable row level security;
alter table public.trend_remix_plans enable row level security;

comment on table public.trend_remix_catalog is
  'Trending songs catalog for AI genre remixes (landscape YouTube, SEO keywords).';
comment on table public.trend_remix_plans is
  'Daily trend remix publish plan — morning=remix1, evening=remix2.';
