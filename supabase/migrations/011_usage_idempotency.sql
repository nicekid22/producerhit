create table if not exists public.generation_usage_keys (
  user_id uuid not null references public.profiles (id) on delete cascade,
  key text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, key)
);

create index if not exists generation_usage_keys_created_at_idx on public.generation_usage_keys (created_at);

alter table public.generation_usage_keys enable row level security;

create policy "generation_usage_keys_select_own" on public.generation_usage_keys
  for select
  using (auth.uid() = user_id);

create policy "generation_usage_keys_insert_own" on public.generation_usage_keys
  for insert
  with check (auth.uid() = user_id);

create or replace function public.check_and_bump_loops_usage_idempotent(p_key text)
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
  where p.id = uid
  for update;

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

  insert into public.generation_usage_keys (user_id, key)
  values (uid, p_key)
  on conflict do nothing;

  update public.profiles
    set loops_used_this_month = case
          when date_trunc('month', loops_reset_at) <> date_trunc('month', now()) then 1
          else loops_used_this_month + 1
        end,
        loops_reset_at = case
          when date_trunc('month', loops_reset_at) <> date_trunc('month', now()) then now()
          else loops_reset_at
        end
  where id = uid
  returning loops_used_this_month into used_now;

  return query select true, plan_name, coalesce(used_now, 0), limit_now, false;
end;
$$;

create or replace function public.bump_loops_usage_idempotent(p_key text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  used_now int;
  inserted boolean;
begin
  if uid is null then
    return 0;
  end if;

  perform public.reset_loops_usage_if_needed();

  insert into public.generation_usage_keys (user_id, key)
  values (uid, p_key)
  on conflict do nothing;

  inserted := found;

  if not inserted then
    select loops_used_this_month into used_now
    from public.profiles
    where id = uid;
    return coalesce(used_now, 0);
  end if;

  update public.profiles
    set loops_used_this_month = case
          when date_trunc('month', loops_reset_at) <> date_trunc('month', now()) then 1
          else loops_used_this_month + 1
        end,
        loops_reset_at = case
          when date_trunc('month', loops_reset_at) <> date_trunc('month', now()) then now()
          else loops_reset_at
        end
  where id = uid
  returning loops_used_this_month into used_now;

  return coalesce(used_now, 0);
end;
$$;
