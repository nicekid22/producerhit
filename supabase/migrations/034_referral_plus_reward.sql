-- Referral Plus: +20 gen au parrain quand le filleul passe au plan Plus (idempotent).
-- claim_referral: bonus filleul +10 à l'inscription, plus de bonus immédiat au parrain.

create table if not exists public.referral_plus_rewards (
  referee_id uuid primary key references public.profiles (id) on delete cascade,
  referrer_id uuid not null references public.profiles (id) on delete cascade,
  bonus int not null default 20 check (bonus > 0),
  created_at timestamptz not null default now()
);

create index if not exists referral_plus_rewards_referrer_idx on public.referral_plus_rewards (referrer_id);

alter table public.referral_plus_rewards enable row level security;

comment on table public.referral_plus_rewards is
  'One-time referrer bonus when a referred user subscribes to plan Plus.';

create or replace function public.grant_referral_plus_bonus(p_referee_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referrer_id uuid;
  v_bonus int := 20;
begin
  if p_referee_id is null then
    return jsonb_build_object('ok', false, 'error', 'missing_referee');
  end if;

  select referred_by into v_referrer_id
  from public.profiles
  where id = p_referee_id;

  if v_referrer_id is null then
    return jsonb_build_object('ok', false, 'error', 'no_referrer');
  end if;

  if exists (select 1 from public.referral_plus_rewards r where r.referee_id = p_referee_id) then
    return jsonb_build_object('ok', false, 'error', 'already_rewarded');
  end if;

  insert into public.referral_plus_rewards (referee_id, referrer_id, bonus)
  values (p_referee_id, v_referrer_id, v_bonus);

  update public.profiles
  set referral_bonus = referral_bonus + v_bonus
  where id = v_referrer_id;

  return jsonb_build_object(
    'ok', true,
    'referrer_id', v_referrer_id,
    'referee_id', p_referee_id,
    'bonus', v_bonus
  );
end;
$$;

revoke all on function public.grant_referral_plus_bonus(uuid) from public;
grant execute on function public.grant_referral_plus_bonus(uuid) to service_role;

create or replace function public.claim_referral(p_ref_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_referrer_id uuid;
  v_existing uuid;
  v_code text := lower(trim(coalesce(p_ref_code, '')));
  v_referee_bonus int := 10;
  v_referrer_bonus int := 0;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  select referred_by into v_existing from public.profiles where id = v_uid;
  if v_existing is not null then
    return jsonb_build_object('ok', false, 'error', 'already_claimed');
  end if;

  if length(v_code) < 4 then
    return jsonb_build_object('ok', false, 'error', 'invalid_code');
  end if;

  select id into v_referrer_id
  from public.profiles
  where referral_code = v_code
    and id <> v_uid
  limit 1;

  if v_referrer_id is null then
    return jsonb_build_object('ok', false, 'error', 'code_not_found');
  end if;

  update public.profiles
  set referred_by = v_referrer_id
  where id = v_uid
    and referred_by is null;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'already_claimed');
  end if;

  update public.profiles
  set referral_bonus = referral_bonus + v_referee_bonus
  where id = v_uid;

  if v_referrer_bonus > 0 then
    update public.profiles
    set referral_bonus = referral_bonus + v_referrer_bonus
    where id = v_referrer_id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'referee_bonus', v_referee_bonus,
    'referrer_bonus', v_referrer_bonus,
    'referrer_id', v_referrer_id
  );
end;
$$;

grant execute on function public.claim_referral(text) to authenticated;

create or replace function public.ensure_referral_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  code text;
begin
  if uid is null then
    return null;
  end if;

  update public.profiles
  set referral_code = public.generate_referral_code()
  where id = uid
    and (referral_code is null or trim(referral_code) = '');

  select referral_code into code
  from public.profiles
  where id = uid;

  return code;
end;
$$;

revoke all on function public.ensure_referral_code() from public;
grant execute on function public.ensure_referral_code() to authenticated;
