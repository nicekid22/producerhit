-- TikTok multi-account support for social publish automation
-- Allows multiple TikTok accounts (producerhit, rnbfrancais, ...) in the same pipeline

create table if not exists public.tiktok_accounts (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  client_key text not null,
  client_secret text not null,
  refresh_token text not null,
  open_id text,
  privacy_level_options text[],
  post_mode text not null default 'MEDIA_UPLOAD',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tiktok_accounts_username_idx
  on public.tiktok_accounts (username);

create index if not exists tiktok_accounts_active_idx
  on public.tiktok_accounts (is_active);

alter table public.tiktok_accounts enable row level security;

-- Service role / edge only (no anon policies)
create or replace function public.tiktok_accounts_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  NEW.updated_at := now();
  return NEW;
end;
$$;

drop trigger if exists tiktok_accounts_touch on public.tiktok_accounts;
create trigger tiktok_accounts_touch
  before update on public.tiktok_accounts
  for each row execute function public.tiktok_accounts_touch_updated_at();
