-- Referral program: codes, attribution, bonus generations

alter table public.profiles
  add column if not exists referral_code text,
  add column if not exists referred_by uuid references public.profiles (id) on delete set null,
  add column if not exists referral_bonus int not null default 0;

create unique index if not exists profiles_referral_code_unique
  on public.profiles (referral_code)
  where referral_code is not null;

create index if not exists profiles_referred_by_idx on public.profiles (referred_by);

-- Backfill codes for existing profiles
update public.profiles
set referral_code = lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
where referral_code is null or referral_code = '';

create or replace function public.generate_referral_code()
returns text
language sql
as $$
  select lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, referral_code)
  values (new.id, public.generate_referral_code())
  on conflict (id) do update
    set referral_code = coalesce(public.profiles.referral_code, public.generate_referral_code());
  return new;
end;
$$;

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
  v_referee_bonus int := 3;
  v_referrer_bonus int := 5;
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
