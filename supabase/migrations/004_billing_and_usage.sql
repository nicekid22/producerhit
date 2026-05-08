alter table public.profiles
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_price_id text,
  add column if not exists stripe_current_period_end timestamptz,
  add column if not exists loops_reset_at timestamptz not null default now();

create or replace function public.reset_loops_usage_if_needed()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
    set loops_used_this_month = 0,
        loops_reset_at = now()
  where id = auth.uid()
    and date_trunc('month', loops_reset_at) <> date_trunc('month', now());
end;
$$;

create or replace function public.bump_loops_usage()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_used int;
begin
  update public.profiles
    set loops_used_this_month = case
          when date_trunc('month', loops_reset_at) <> date_trunc('month', now()) then 1
          else loops_used_this_month + 1
        end,
        loops_reset_at = case
          when date_trunc('month', loops_reset_at) <> date_trunc('month', now()) then now()
          else loops_reset_at
        end
  where id = auth.uid()
  returning loops_used_this_month into new_used;

  return coalesce(new_used, 0);
end;
$$;
