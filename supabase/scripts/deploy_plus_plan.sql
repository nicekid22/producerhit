-- Déploiement plan Plus — SQL Editor Supabase (safe si billing_stripe_prices n'existe pas encore).
-- Price Stripe Plus : price_1Tc9IsJqW5V9MXwgBB0dlFcp (89€/mo)

-- ── 0) Table billing (migration 030) ─────────────────────────────────────
create table if not exists public.billing_stripe_prices (
  plan text primary key,
  stripe_price_id text not null unique
);

alter table public.billing_stripe_prices enable row level security;

comment on table public.billing_stripe_prices is
  'Map Stripe price IDs to plans. Insert once per environment after creating Stripe prices.';

-- ── 1) Contraintes plan (pro / studio / plus) ─────────────────────────────
alter table public.billing_stripe_prices drop constraint if exists billing_stripe_prices_plan_check;
alter table public.billing_stripe_prices add constraint billing_stripe_prices_plan_check
  check (plan in ('pro', 'studio', 'plus'));

alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles add constraint profiles_plan_check
  check (plan in ('free', 'pro', 'studio', 'plus'));

-- ── 2) Price Plus ─────────────────────────────────────────────────────────
insert into public.billing_stripe_prices (plan, stripe_price_id)
values ('plus', 'price_1Tc9IsJqW5V9MXwgBB0dlFcp')
on conflict (plan) do update set stripe_price_id = excluded.stripe_price_id;

-- Remplace aussi Pro/Studio si besoin (décommente et mets tes vrais IDs) :
-- insert into public.billing_stripe_prices (plan, stripe_price_id) values
--   ('pro', 'price_REPLACE_PRO'),
--   ('studio', 'price_REPLACE_STUDIO')
-- on conflict (plan) do update set stripe_price_id = excluded.stripe_price_id;

-- ── 3) Limites & rang ─────────────────────────────────────────────────────
create or replace function public.plan_rank(p text)
returns int
language sql
immutable
as $$
  select case p
    when 'plus' then 4
    when 'studio' then 3
    when 'pro' then 2
    else 1
  end;
$$;

create or replace function public.plan_monthly_limit(p text)
returns int
language sql
immutable
as $$
  select case p
    when 'plus' then 1000
    when 'studio' then 250
    when 'pro' then 75
    else 10
  end;
$$;

-- ── 4) Vérification ───────────────────────────────────────────────────────
select plan, stripe_price_id from public.billing_stripe_prices order by plan;
select public.plan_monthly_limit('plus') as plus_limit;
select public.plan_monthly_limit('studio') as studio_limit;
