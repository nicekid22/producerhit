create or replace function public.check_loops_usage_idempotent(p_key text)
returns table(ok boolean, plan text, used int, "limit" int, already_counted boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  plan_name text;
  used_now int;
  limit_now int;
  counted boolean;
begin
  if uid is null then
    return query select false, 'free', 0, 0, false;
    return;
  end if;

  perform public.reset_loops_usage_if_needed();

  delete from public.generation_usage_keys
  where user_id = uid
    and created_at < now() - interval '45 days';

  select p.plan, p.loops_used_this_month
    into plan_name, used_now
  from public.profiles p
  where p.id = uid;

  plan_name := coalesce(plan_name, 'free');
  used_now := coalesce(used_now, 0);

  limit_now := case
    when plan_name = 'studio' then 250
    when plan_name = 'pro' then 75
    else 3
  end;

  counted := exists (
    select 1
    from public.generation_usage_keys k
    where k.user_id = uid
      and k.key = p_key
  );

  if counted then
    return query select true, plan_name, used_now, limit_now, true;
    return;
  end if;

  if used_now >= limit_now then
    return query select false, plan_name, used_now, limit_now, false;
    return;
  end if;

  return query select true, plan_name, used_now, limit_now, false;
end;
$$;

