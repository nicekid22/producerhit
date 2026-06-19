-- Idempotent Stripe launch bonus credit grants (webhook dedup)
create table if not exists public.stripe_launch_bonus_grants (
  stripe_event_id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  grant_type text not null check (grant_type in ('pro_first_month', 'checkout_recovery')),
  credits int not null check (credits > 0),
  created_at timestamptz not null default now()
);

create index if not exists stripe_launch_bonus_grants_user_id_idx
  on public.stripe_launch_bonus_grants (user_id);

alter table public.stripe_launch_bonus_grants enable row level security;

-- Service role only (webhook); no client policies
