insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'loop-audio',
  'loop-audio',
  true,
  52428800,
  array['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/webm', 'audio/ogg']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "loop_audio_public_read" on storage.objects;
create policy "loop_audio_public_read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'loop-audio');

drop policy if exists "loop_audio_auth_insert" on storage.objects;
create policy "loop_audio_auth_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'loop-audio'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "loop_audio_auth_update" on storage.objects;
create policy "loop_audio_auth_update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'loop-audio'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'loop-audio'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
