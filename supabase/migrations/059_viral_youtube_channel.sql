-- Preferred YouTube channel per viral plan (series → channel mapping).

alter table public.viral_content_plans
  add column if not exists target_youtube_account text;

comment on column public.viral_content_plans.target_youtube_account is
  'Preferred YOUTUBE_ACCOUNTS id (e.g. producerhitai, beatmakerunion).';
