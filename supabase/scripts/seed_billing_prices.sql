-- À exécuter après création des prices Stripe (Dashboard Stripe → Products → Prices).
-- Remplacer price_... par vos vrais IDs (test ou live).

insert into public.billing_stripe_prices (plan, stripe_price_id)
values
  ('pro', 'price_1ThWOlJqW5V9MXwgrnXF3WVC'),
  ('studio', 'price_1ThWPEJqW5V9MXwgKjYhuoE6'),
  ('plus', 'price_1ThWPgJqW5V9MXwgLpsf8HrT')
on conflict (plan) do update
  set stripe_price_id = excluded.stripe_price_id;

-- Vérification
select plan, stripe_price_id from public.billing_stripe_prices order by plan;
