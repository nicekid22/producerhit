drop policy if exists "Public can view saved loops" on public.loops;
drop policy if exists "Public can view loops with audio" on public.loops;

create policy "Public can view loops with audio"
  on public.loops
  for select
  to anon
  using (audio_url is not null);
