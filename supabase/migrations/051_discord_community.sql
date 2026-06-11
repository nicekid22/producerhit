-- Discord community: challenges, links, events, bonus credits

create table if not exists public.discord_weekly_challenges (
  id uuid primary key default gen_random_uuid(),
  week_key text not null unique,
  theme_fr text not null,
  theme_en text not null,
  genre_tag text,
  bpm_range text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  discord_message_id text,
  closed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.discord_challenge_entries (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.discord_weekly_challenges (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  loop_id uuid references public.loops (id) on delete set null,
  discord_message_id text,
  votes int not null default 0,
  rank int,
  reward_credits int not null default 0,
  created_at timestamptz not null default now(),
  unique (challenge_id, user_id)
);

create index if not exists discord_challenge_entries_challenge_idx
  on public.discord_challenge_entries (challenge_id, votes desc);

create table if not exists public.user_discord_links (
  user_id uuid primary key references auth.users (id) on delete cascade,
  discord_user_id text not null unique,
  discord_username text,
  linked_at timestamptz not null default now()
);

create table if not exists public.discord_bot_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  ok boolean not null default true,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists discord_bot_events_created_idx on public.discord_bot_events (created_at desc);

alter table public.discord_weekly_challenges enable row level security;
alter table public.discord_challenge_entries enable row level security;
alter table public.user_discord_links enable row level security;
alter table public.discord_bot_events enable row level security;

create policy "discord_challenges_public_read"
  on public.discord_weekly_challenges for select
  using (true);

create policy "discord_entries_public_read"
  on public.discord_challenge_entries for select
  using (true);

create policy "discord_entries_insert_own"
  on public.discord_challenge_entries for insert
  with check (auth.uid() = user_id);

create policy "user_discord_links_select_own"
  on public.user_discord_links for select
  using (auth.uid() = user_id);

create policy "user_discord_links_insert_own"
  on public.user_discord_links for insert
  with check (auth.uid() = user_id);

create policy "user_discord_links_update_own"
  on public.user_discord_links for update
  using (auth.uid() = user_id);

-- Service role only for events
create policy "discord_bot_events_service"
  on public.discord_bot_events for all
  using (false)
  with check (false);

create or replace function public.grant_discord_challenge_bonus(
  p_user_id uuid,
  p_credits int,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_credits int := greatest(0, coalesce(p_credits, 0));
  v_key text := trim(coalesce(p_idempotency_key, ''));
begin
  if p_user_id is null or v_credits <= 0 or length(v_key) < 8 then
    return jsonb_build_object('ok', false, 'error', 'invalid_args');
  end if;

  if exists (
    select 1 from public.discord_bot_events e
    where e.event_type = 'challenge_bonus'
      and e.payload->>'idempotency_key' = v_key
  ) then
    return jsonb_build_object('ok', true, 'already_granted', true);
  end if;

  update public.profiles
  set referral_bonus = referral_bonus + v_credits
  where id = p_user_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'user_not_found');
  end if;

  insert into public.discord_bot_events (event_type, payload, ok)
  values (
    'challenge_bonus',
    jsonb_build_object(
      'user_id', p_user_id,
      'credits', v_credits,
      'idempotency_key', v_key
    ),
    true
  );

  return jsonb_build_object('ok', true, 'credits', v_credits);
end;
$$;

revoke all on function public.grant_discord_challenge_bonus(uuid, int, text) from public;
grant execute on function public.grant_discord_challenge_bonus(uuid, int, text) to service_role;
