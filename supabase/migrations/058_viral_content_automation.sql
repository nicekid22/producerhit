-- Viral Shorts automation: 3 series/day, ACE generation + social queue.

create table if not exists public.viral_content_plans (
  id uuid primary key default gen_random_uuid(),
  day date not null,
  slot text not null check (slot in ('morning', 'afternoon', 'evening')),
  series text not null check (series in ('comment_to_song', 'absurd_to_song', 'guess_prompt')),
  episode_num int not null default 1,
  concept_id text not null,
  source_text text not null,
  ace_caption text not null,
  sample_query text not null,
  lyrics text not null default '',
  genre text not null,
  bpm int not null default 120,
  is_song boolean not null default true,
  display_name text not null,
  hook_open text not null,
  hook_reveal text not null,
  hook_cta text not null,
  loop_id uuid references public.loops (id) on delete set null,
  status text not null default 'planned'
    check (status in ('planned', 'generating', 'ready', 'queued', 'published', 'failed')),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (day, slot)
);

create index if not exists viral_content_plans_status_day_idx
  on public.viral_content_plans (day, status, slot);

alter table public.viral_content_plans enable row level security;

comment on table public.viral_content_plans is
  'Daily viral Shorts plan — 3 slots (comment/absurd/guess). Filled by viral-content-run cron.';
