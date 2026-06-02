insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'social-videos',
  'social-videos',
  true,
  52428800,
  array['video/mp4']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "social_videos_public_read" on storage.objects;
create policy "social_videos_public_read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'social-videos');
