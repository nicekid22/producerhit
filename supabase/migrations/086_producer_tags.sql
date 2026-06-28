-- Producer tags (post-generation FFmpeg mix) — upload free for Pro+, 1 credit per loop on first apply

create table if not exists public.producer_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null default 'Mon tag',
  storage_path text not null,
  duration_sec numeric,
  settings_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists producer_tags_user_id_idx on public.producer_tags (user_id, created_at desc);

alter table public.producer_tags enable row level security;

drop policy if exists "producer_tags_owner_select" on public.producer_tags;
create policy "producer_tags_owner_select"
  on public.producer_tags for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "producer_tags_owner_insert" on public.producer_tags;
create policy "producer_tags_owner_insert"
  on public.producer_tags for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "producer_tags_owner_update" on public.producer_tags;
create policy "producer_tags_owner_update"
  on public.producer_tags for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "producer_tags_owner_delete" on public.producer_tags;
create policy "producer_tags_owner_delete"
  on public.producer_tags for delete to authenticated
  using (user_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'producer-tags',
  'producer-tags',
  false,
  5242880,
  array['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/ogg', 'audio/aac', 'audio/flac']
)
on conflict (id) do update
set file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "producer_tags_storage_read" on storage.objects;
create policy "producer_tags_storage_read"
  on storage.objects for select to authenticated
  using (bucket_id = 'producer-tags' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "producer_tags_storage_insert" on storage.objects;
create policy "producer_tags_storage_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'producer-tags' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "producer_tags_storage_delete" on storage.objects;
create policy "producer_tags_storage_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'producer-tags' and auth.uid()::text = (storage.foldername(name))[1]);

create or replace function public.producer_tag_max_count(p_plan text)
returns int
language sql stable set search_path = public as $$
  select case
    when coalesce(p_plan, 'free') = 'plus' then 10
    when coalesce(p_plan, 'free') = 'studio' then 5
    when coalesce(p_plan, 'free') = 'pro' then 2
    else 0
  end;
$$;

create or replace function public.can_use_producer_tag(p_plan text)
returns boolean
language sql stable set search_path = public as $$
  select public.producer_tag_max_count(p_plan) > 0;
$$;
