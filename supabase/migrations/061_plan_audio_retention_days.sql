-- Rétention audio hébergé par plan : Free/Pro 3j, Studio 7j, Plus permanent (hors purge).

create or replace function public.loop_audio_retention_days(p_plan text)
returns int
language sql
immutable
as $$
  select greatest(1, case coalesce(nullif(trim(lower(p_plan)), ''), 'free')
    when 'studio' then 7
    when 'pro' then 3
    else 3
  end);
$$;

comment on function public.loop_audio_retention_days(text) is
  'Jours de rétention audio hébergé selon le plan (Free/Pro 3, Studio 7). Plus géré à part (pas de purge par âge).';

create or replace function public.list_expired_loop_audio_rows(p_retention_days int default 7, p_limit int default 100)
returns table (
  loop_id uuid,
  user_id uuid,
  audio_url text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    l.id as loop_id,
    l.user_id,
    l.audio_url,
    l.created_at
  from public.loops l
  inner join public.profiles p on p.id = l.user_id
  where coalesce(p.plan, 'free') <> 'plus'
    and (
      (
        p.hosted_audio_expires_at is not null
        and now() >= p.hosted_audio_expires_at
      )
      or (
        p.hosted_audio_expires_at is null
        and l.created_at < now() - make_interval(days => public.loop_audio_retention_days(p.plan))
      )
    )
    and (
      l.audio_url ilike '%/storage/v1/object/%/loop-audio/%'
      or l.provider_audio_inline is not null
      or l.audio_url ilike '%generate-loop-ace%action=stream_public%'
    )
  order by l.created_at asc
  limit greatest(p_limit, 1);
$$;

comment on function public.list_expired_loop_audio_rows(int, int) is
  'Loops dont l’audio hébergé dépasse la rétention plan (Free/Pro 3j, Studio 7j) ou hosted_audio_expires_at — pour purge-loop-audio Edge.';

grant execute on function public.loop_audio_retention_days(text) to service_role;
grant execute on function public.list_expired_loop_audio_rows(int, int) to service_role;
