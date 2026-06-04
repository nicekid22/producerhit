-- Compteur d'écoutes communauté (growth_events.community_play) pour le rail « Les plus kiffés ».

create or replace function public.get_community_loop_play_counts(p_loop_ids uuid[])
returns table(loop_id uuid, play_count int)
language sql
security definer
set search_path = public
stable
as $$
  select
    (ge.props->>'loop_id')::uuid as loop_id,
    count(*)::int as play_count
  from public.growth_events ge
  where ge.name = 'community_play'
    and ge.props ? 'loop_id'
    and (ge.props->>'loop_id') ~* '^[0-9a-f-]{36}$'
    and (ge.props->>'loop_id')::uuid = any(p_loop_ids)
  group by 1;
$$;

revoke all on function public.get_community_loop_play_counts(uuid[]) from public;
grant execute on function public.get_community_loop_play_counts(uuid[]) to anon, authenticated;
