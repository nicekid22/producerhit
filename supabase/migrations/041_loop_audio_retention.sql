-- Rétention loop-audio (7j) : policies delete + helper SQL pour purge planifiée.

drop policy if exists "loop_audio_auth_delete" on storage.objects;
create policy "loop_audio_auth_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'loop-audio'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

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
  where l.created_at < now() - make_interval(days => greatest(p_retention_days, 1))
    and (
      l.audio_url ilike '%/storage/v1/object/%/loop-audio/%'
      or l.provider_audio_inline is not null
      or l.audio_url ilike '%generate-loop-ace%action=stream_public%'
    )
  order by l.created_at asc
  limit greatest(p_limit, 1);
$$;

comment on function public.list_expired_loop_audio_rows(int, int) is
  'Loops dont l’audio hébergé (Storage / inline / stream_public) dépasse la rétention — pour purge-loop-audio Edge.';

grant execute on function public.list_expired_loop_audio_rows(int, int) to service_role;
