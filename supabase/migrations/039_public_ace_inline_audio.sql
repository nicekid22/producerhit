-- Audio ACE inline pour lecture communauté via Edge stream (sans bucket loop-audio).
-- Non exposé dans les SELECT publics listing — lu uniquement par generate-loop-ace (service role).

alter table public.loops
  add column if not exists provider_audio_inline text;

comment on column public.loops.provider_audio_inline is
  'Data URL audio (base64) pour stream_public Edge; évite loop-audio Storage.';
