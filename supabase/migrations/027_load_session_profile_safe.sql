-- Safe profile loader: never fail login because reconcile/sync throws.
-- Run after 025. Replaces load_session_profile with step-isolated errors.

create or replace function public.load_session_profile()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
  rec record;
  reconcile_result jsonb := jsonb_build_object('ok', true, 'status', 'skipped');
begin
  if uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  begin
    perform public.ensure_profile();
  exception when others then
    null;
  end;

  begin
    perform public.sync_profile_plan_from_billing();
  exception when others then
    null;
  end;

  begin
    reconcile_result := public.reconcile_profile_by_email();
  exception when others then
    reconcile_result := jsonb_build_object('ok', false, 'error', sqlerrm);
  end;

  begin
    perform public.reset_loops_usage_if_needed();
  exception when others then
    null;
  end;

  begin
    select
      p.username,
      p.plan,
      p.loops_used_this_month,
      p.referral_bonus,
      p.referral_code,
      coalesce(p.level_bonus, 0) as level_bonus,
      coalesce(p.daily_bonus_month, 0) as daily_bonus_month
    into rec
    from public.profiles p
    where p.id = uid;
  exception
    when undefined_column then
      select
        p.username,
        p.plan,
        p.loops_used_this_month,
        p.referral_bonus,
        p.referral_code,
        0 as level_bonus,
        0 as daily_bonus_month
      into rec
      from public.profiles p
      where p.id = uid;
  end;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'profile_not_found');
  end if;

  return jsonb_build_object(
    'ok', true,
    'profile', jsonb_build_object(
      'username', rec.username,
      'plan', rec.plan,
      'loops_used_this_month', rec.loops_used_this_month,
      'referral_bonus', rec.referral_bonus,
      'referral_code', rec.referral_code,
      'level_bonus', rec.level_bonus,
      'daily_bonus_month', rec.daily_bonus_month
    ),
    'reconcile', reconcile_result
  );
exception
  when others then
    return jsonb_build_object('ok', false, 'error', sqlerrm);
end;
$$;

revoke all on function public.load_session_profile() from public;
grant execute on function public.load_session_profile() to authenticated;
