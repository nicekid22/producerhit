-- Apple IAP entitlement tracking (iOS app subscriptions)

alter table public.profiles
  add column if not exists apple_original_transaction_id text,
  add column if not exists billing_source text not null default 'none';

alter table public.profiles drop constraint if exists profiles_billing_source_check;
alter table public.profiles add constraint profiles_billing_source_check
  check (billing_source in ('none', 'stripe', 'apple', 'both'));

create table if not exists public.billing_apple_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id text not null,
  transaction_id text,
  original_transaction_id text,
  expires_at timestamptz,
  environment text not null default 'sandbox',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists billing_apple_subscriptions_original_tx
  on public.billing_apple_subscriptions (original_transaction_id)
  where original_transaction_id is not null;

create index if not exists billing_apple_subscriptions_user_id
  on public.billing_apple_subscriptions (user_id);

alter table public.billing_apple_subscriptions enable row level security;

drop policy if exists billing_apple_subscriptions_select_own on public.billing_apple_subscriptions;
create policy billing_apple_subscriptions_select_own
  on public.billing_apple_subscriptions for select
  using (auth.uid() = user_id);

-- Writes only via service role / edge functions

create or replace function public.apply_apple_pro_entitlement(
  p_user_id uuid,
  p_product_id text,
  p_original_transaction_id text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null then
    raise exception 'missing user';
  end if;

  insert into public.billing_apple_subscriptions (user_id, product_id, original_transaction_id, environment)
  values (p_user_id, coalesce(p_product_id, 'unknown'), p_original_transaction_id, 'sandbox')
  on conflict (original_transaction_id) where original_transaction_id is not null
  do update set updated_at = now(), product_id = excluded.product_id;

  update public.profiles
  set
    plan = case when plan_rank(plan) >= plan_rank('pro') then plan else 'pro' end,
    billing_source = case
      when billing_source = 'stripe' then 'both'
      when billing_source = 'apple' then 'apple'
      else 'apple'
    end,
    apple_original_transaction_id = coalesce(p_original_transaction_id, apple_original_transaction_id)
  where id = p_user_id;
end;
$$;
