-- Referral: +20 au parrain dès l'inscription du filleul (plus de bonus au passage Plus).

comment on table public.referral_plus_rewards is
  'Legacy ledger for Plus-upgrade referrer rewards (pre-2026-06). New rewards use claim_referral at signup.';

create or replace function public.grant_referral_plus_bonus(p_referee_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  return jsonb_build_object('ok', false, 'error', 'deprecated_plus_upgrade_bonus');
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
  v_referrer_bonus int := 20;
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
    'referrer_bonus', v_referrer_bonus,
    'referrer_id', v_referrer_id
  );
end;
$$;

grant execute on function public.claim_referral(text) to authenticated;
