-- Plan Plus: 1000 generations / month (was 500).

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
