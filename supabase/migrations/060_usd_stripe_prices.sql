-- Stripe USD monthly prices ($8 Pro / $24 Studio / $47 Plus) — live mode
insert into public.billing_stripe_prices (plan, stripe_price_id)
values
  ('pro', 'price_1ThWOlJqW5V9MXwgrnXF3WVC'),
  ('studio', 'price_1ThWPEJqW5V9MXwgKjYhuoE6'),
  ('plus', 'price_1ThWPgJqW5V9MXwgLpsf8HrT')
on conflict (plan) do update set stripe_price_id = excluded.stripe_price_id;
