-- Fix Google / email signup: "Database error saving new user" when handle_new_user() fails.
-- Safe to re-run. Rollback: restore prior handle_new_user from 024_profile_email_sync.sql.

-- Unique referral codes (retry on collision).
create or replace function public.generate_referral_code()
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  code text;
  attempts int := 0;
begin
  loop
    code := lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (
      select 1 from public.profiles p where p.referral_code = code
    );
    attempts := attempts + 1;
    if attempts >= 16 then
      code := lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
      exit;
    end if;
  end loop;
  return code;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_code text;
begin
  v_email := nullif(trim(coalesce(new.email, '')), '');
  v_code := public.generate_referral_code();

  begin
    insert into public.profiles (id, referral_code, email)
    values (new.id, v_code, v_email)
    on conflict (id) do update
    set
      email = coalesce(nullif(trim(public.profiles.email), ''), excluded.email),
      referral_code = coalesce(public.profiles.referral_code, excluded.referral_code);
  exception
    when unique_violation then
      insert into public.profiles (id, referral_code, email)
      values (new.id, public.generate_referral_code(), v_email)
      on conflict (id) do update
      set email = coalesce(nullif(trim(public.profiles.email), ''), excluded.email);
    when others then
      raise warning 'handle_new_user primary insert failed for %: %', new.id, sqlerrm;
      insert into public.profiles (id)
      values (new.id)
      on conflict (id) do nothing;
  end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

grant execute on function public.generate_referral_code() to service_role;
grant execute on function public.handle_new_user() to service_role;

-- Orphan repair: profil manquant après auth OK (Google / email).
create or replace function public.repair_missing_profile()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
  user_email text;
begin
  if uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  if exists (select 1 from public.profiles p where p.id = uid) then
    return jsonb_build_object('ok', true, 'status', 'already_exists');
  end if;

  select email into user_email
  from auth.users
  where id = uid and deleted_at is null;

  insert into public.profiles (id, referral_code, email)
  values (uid, public.generate_referral_code(), user_email)
  on conflict (id) do update
  set
    email = coalesce(nullif(trim(public.profiles.email), ''), excluded.email),
    referral_code = coalesce(public.profiles.referral_code, excluded.referral_code);

  return jsonb_build_object('ok', true, 'status', 'created');
exception
  when others then
    return jsonb_build_object('ok', false, 'error', sqlerrm);
end;
$$;

revoke all on function public.repair_missing_profile() from public;
grant execute on function public.repair_missing_profile() to authenticated;
