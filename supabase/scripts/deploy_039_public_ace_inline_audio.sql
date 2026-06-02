-- Migration 039 — à exécuter dans Supabase SQL Editor si la CLI/API timeout.
-- Ou : node scripts/apply-migration-039.mjs (nécessite SUPABASE_ACCESS_TOKEN)

alter table public.loops
  add column if not exists provider_audio_inline text;

comment on column public.loops.provider_audio_inline is
  'Data URL audio (base64) pour stream_public Edge; évite loop-audio Storage.';
