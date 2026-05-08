drop policy if exists "Public can view public loops" on public.loops;

create policy "Public can view public loops"
  on public.loops
  for select
  to public
  using (is_public = true and audio_url is not null);
