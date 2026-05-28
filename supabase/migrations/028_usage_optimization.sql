-- Indexes + retention helpers (egress/DB size)

create index if not exists loops_user_created_idx on public.loops (user_id, created_at desc);
create index if not exists loops_public_created_idx on public.loops (created_at desc) where is_public = true;

create or replace function public.purge_old_analytics_events(retention_days int default 90)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  growth_deleted bigint := 0;
  client_deleted bigint := 0;
begin
  if to_regclass('public.growth_events') is not null then
    delete from public.growth_events where created_at < now() - make_interval(days => retention_days);
    get diagnostics growth_deleted = row_count;
  end if;

  if to_regclass('public.client_events') is not null then
    delete from public.client_events where created_at < now() - make_interval(days => retention_days);
    get diagnostics client_deleted = row_count;
  end if;

  return jsonb_build_object(
    'growth_events_deleted', growth_deleted,
    'client_events_deleted', client_deleted,
    'retention_days', retention_days
  );
end;
$$;

comment on function public.purge_old_analytics_events(int) is
  'Run manually or via pg_cron: select purge_old_analytics_events(90);';
