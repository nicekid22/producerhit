-- Referral boost: +10 for referee, +15 for referrer (on top of free plan base).

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
  v_referrer_bonus int := 15;
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

  update public.profiles
  set referral_bonus = referral_bonus + v_referrer_bonus
  where id = v_referrer_id;

  return jsonb_build_object(
    'ok', true,
    'referee_bonus', v_referee_bonus,
    'referrer_bonus', v_referrer_bonus
  );
end;
$$;

grant execute on function public.claim_referral(text) to authenticated;
