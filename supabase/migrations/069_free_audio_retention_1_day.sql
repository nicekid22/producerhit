-- Free plan : rétention audio hébergé 1 jour (Pro 3j, Studio 7j inchangés).

create or replace function public.loop_audio_retention_days(p_plan text)
returns int
language sql
immutable
as $$
  select greatest(1, case coalesce(nullif(trim(lower(p_plan)), ''), 'free')
    when 'studio' then 7
    when 'pro' then 3
    else 1
  end);
$$;

comment on function public.loop_audio_retention_days(text) is
  'Jours de rétention audio hébergé selon le plan (Free 1, Pro 3, Studio 7). Plus géré à part (pas de purge par âge).';

comment on function public.list_expired_loop_audio_rows(int, int) is
  'Loops dont l’audio hébergé dépasse la rétention plan (Free 1j, Pro 3j, Studio 7j) ou hosted_audio_expires_at — pour purge-loop-audio Edge.';
