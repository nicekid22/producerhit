alter table public.loops
  add column if not exists is_public boolean not null default false;

drop policy if exists "Public can view loops with audio" on public.loops;

create policy "Public can view public loops"
  on public.loops
  for select
  to anon
  using (is_public = true and audio_url is not null);
