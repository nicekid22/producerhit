-- Option A: export pack manuel (sans API DSP) — statut exported + RPC enregistrement

alter table public.distribution_releases
  drop constraint if exists distribution_releases_status_check;

alter table public.distribution_releases
  add constraint distribution_releases_status_check
  check (status in (
    'draft', 'preparing', 'submitted', 'in_review', 'live', 'rejected', 'failed', 'exported'
  ));

drop index if exists distribution_releases_loop_active_uidx;
create unique index distribution_releases_loop_active_uidx
  on public.distribution_releases (loop_id)
  where status in ('preparing', 'submitted', 'in_review', 'live', 'exported');

create or replace function public.record_distribution_pack_export(
  p_loop_id uuid,
  p_title text,
  p_artist_name text,
  p_featuring text[] default '{}',
  p_genre_name text default null,
  p_language_code text default 'en',
  p_explicit boolean default false,
  p_release_date date default null
)
returns table(ok boolean, release_id uuid, error_code text, used int, quota int)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  new_id uuid;
  q_ok boolean;
  q_plan text;
  q_used int;
  q_quota int;
  q_error text;
begin
  if uid is null then
    return query select false, null::uuid, 'not_authenticated'::text, 0, 0;
    return;
  end if;

  if not exists (
    select 1 from public.loops l where l.id = p_loop_id and l.user_id = uid
  ) then
    return query select false, null::uuid, 'loop_not_found'::text, 0, 0;
    return;
  end if;

  if exists (
    select 1 from public.distribution_releases r
    where r.loop_id = p_loop_id
      and r.status in ('preparing', 'submitted', 'in_review', 'live', 'exported')
  ) then
    return query select false, null::uuid, 'release_already_active'::text, 0, 0;
    return;
  end if;

  insert into public.distribution_releases (
    user_id, loop_id, release_type, title, artist_name, featuring,
    genre_name, language_code, explicit, release_date, status, submitted_at
  ) values (
    uid, p_loop_id, 'single', p_title, p_artist_name, coalesce(p_featuring, '{}'),
    p_genre_name, coalesce(p_language_code, 'en'), coalesce(p_explicit, false),
    p_release_date, 'exported', now()
  )
  returning id into new_id;

  select ok, plan, used, quota, error_code
    into q_ok, q_plan, q_used, q_quota, q_error
  from public.check_and_consume_distribution_quota(new_id);

  if not q_ok then
    delete from public.distribution_releases where id = new_id;
    return query select false, null::uuid, q_error, q_used, q_quota;
    return;
  end if;

  insert into public.distribution_events (release_id, user_id, event_type, payload)
  values (
    new_id, uid, 'pack_exported',
    jsonb_build_object('title', p_title, 'artist_name', p_artist_name, 'genre', p_genre_name)
  );

  return query select true, new_id, null::text, q_used, q_quota;
end;
$$;

revoke all on function public.record_distribution_pack_export(uuid, text, text, text[], text, text, boolean, date) from public;
grant execute on function public.record_distribution_pack_export(uuid, text, text, text[], text, text, boolean, date) to authenticated;
