-- Plus : audio hébergé permanent. Après downgrade Plus → fenêtre unique 7j (hosted_audio_expires_at).

alter table public.profiles
  add column if not exists hosted_audio_expires_at timestamptz;

comment on column public.profiles.hosted_audio_expires_at is
  'Après downgrade Plus : date limite pour tout l’audio hébergé. NULL si Plus actif ou règle 7j/track standard.';

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
        and l.created_at < now() - make_interval(days => greatest(p_retention_days, 1))
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

grant execute on function public.list_expired_loop_audio_rows(int, int) to service_role;
