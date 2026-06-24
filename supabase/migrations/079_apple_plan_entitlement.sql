-- Apple IAP: map product_id → pro | studio | plus (multi-tier subscriptions)

create or replace function public.plan_from_apple_product_id(p_product_id text)
returns text
language sql
immutable
as $$
  select case
    when p_product_id like '%.plus.monthly' then 'plus'
    when p_product_id like '%.studio.monthly' then 'studio'
    when p_product_id like '%.pro.monthly' then 'pro'
    else 'pro'
  end;
$$;

create or replace function public.apply_apple_plan_entitlement(
  p_user_id uuid,
  p_product_id text,
  p_plan text default null,
  p_original_transaction_id text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
  v_cur_plan text;
begin
  if p_user_id is null then
    raise exception 'missing user';
  end if;

  v_plan := coalesce(
    nullif(trim(p_plan), ''),
    public.plan_from_apple_product_id(p_product_id)
  );

  if v_plan not in ('pro', 'studio', 'plus') then
    raise exception 'invalid apple plan: %', v_plan;
  end if;

  insert into public.billing_apple_subscriptions (user_id, product_id, original_transaction_id, environment)
  values (p_user_id, coalesce(p_product_id, 'unknown'), p_original_transaction_id, 'sandbox')
  on conflict (original_transaction_id) where original_transaction_id is not null
  do update set
    updated_at = now(),
    product_id = excluded.product_id;

  select plan into v_cur_plan from public.profiles where id = p_user_id;

  update public.profiles
  set
    plan = case
      when public.plan_rank(v_plan) >= public.plan_rank(coalesce(v_cur_plan, 'free')) then v_plan
      else plan
    end,
    billing_source = case
      when billing_source = 'stripe' then 'both'
      when billing_source = 'apple' then 'apple'
      else 'apple'
    end,
    apple_original_transaction_id = coalesce(p_original_transaction_id, apple_original_transaction_id)
  where id = p_user_id;
end;
$$;

-- Back-compat wrapper (legacy edge + migrations)
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
  perform public.apply_apple_plan_entitlement(
    p_user_id,
    p_product_id,
    null,
    p_original_transaction_id
  );
end;
$$;
