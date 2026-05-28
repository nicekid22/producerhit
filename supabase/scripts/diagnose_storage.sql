-- Diagnostic egress / storage — à exécuter dans Supabase SQL Editor
-- Fonctionne même si growth_events / client_events n'existent pas (migrations 014/019 optionnelles).

-- 1) Taille DB par table
select
  relname as table_name,
  pg_size_pretty(pg_total_relation_size(relid)) as total_size
from pg_catalog.pg_stat_user_tables
where schemaname = 'public'
order by pg_total_relation_size(relid) desc;

-- 2) Loops : combien pointent vers Supabase Storage vs URLs externes
select
  count(*) as total_loops,
  count(*) filter (where audio_url like '%/storage/v1/object/%/loop-audio/%') as in_supabase_storage,
  count(*) filter (where audio_url is not null and audio_url not like '%/storage/v1/object/%/loop-audio/%') as external_urls,
  count(*) filter (where is_public) as public_loops
from public.loops;

-- 3) Poids texte (prompt + stems) — ignore si colonnes absentes
select
  pg_size_pretty(sum(octet_length(coalesce(prompt, '')))) as prompt_bytes,
  pg_size_pretty(
    sum(
      case
        when to_regclass('public.loops') is not null then octet_length(coalesce(stems_url::text, ''))
        else 0
      end
    )
  ) as stems_json_bytes
from public.loops;

-- 4) Présence tables analytics (sans erreur si absentes)
select
  t.expected_table as table_name,
  case when c.oid is not null then 'present' else 'absent' end as status,
  case when c.oid is not null then pg_size_pretty(pg_total_relation_size(c.oid)) else '—' end as table_size
from (
  values ('growth_events'), ('client_events'), ('loops'), ('profiles')
) as t(expected_table)
left join pg_catalog.pg_class c on c.relname = t.expected_table
left join pg_catalog.pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
order by t.expected_table;

-- 5) Comptes analytics (dynamic SQL — skip tables absentes)
do $$
declare
  cnt bigint;
  oldest timestamptz;
  newest timestamptz;
begin
  if to_regclass('public.growth_events') is not null then
    execute 'select count(*), min(created_at), max(created_at) from public.growth_events'
      into cnt, oldest, newest;
    raise notice 'growth_events: % rows (% → %)', cnt, oldest, newest;
  else
    raise notice 'growth_events: table absente (migration 019 non appliquée — OK, analytics désactivées côté DB)';
  end if;

  if to_regclass('public.client_events') is not null then
    execute 'select count(*), min(created_at), max(created_at) from public.client_events'
      into cnt, oldest, newest;
    raise notice 'client_events: % rows (% → %)', cnt, oldest, newest;
  else
    raise notice 'client_events: table absente (migration 014 non appliquée — OK)';
  end if;
end $$;

-- 6) Purge manuelle events > 90 jours (optionnel, nécessite migration 028)
-- select public.purge_old_analytics_events(90);

-- 7) Storage bucket loop-audio — voir Dashboard > Storage > loop-audio
-- Objets orphelins : comparer userId/loopId dans le path avec public.loops.id
