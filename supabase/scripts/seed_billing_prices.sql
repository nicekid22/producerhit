-- À exécuter après création des prices Stripe (Dashboard Stripe → Products → Prices).
-- Remplacer price_... par vos vrais IDs (test ou live).

insert into public.billing_stripe_prices (plan, stripe_price_id)
values
  ('pro', 'price_REPLACE_PRO'),
  ('studio', 'price_REPLACE_STUDIO'),
  ('plus', 'price_1Tc9IsJqW5V9MXwgBB0dlFcp')
on conflict (plan) do update
  set stripe_price_id = excluded.stripe_price_id;

-- Vérification
select plan, stripe_price_id from public.billing_stripe_prices order by plan;
