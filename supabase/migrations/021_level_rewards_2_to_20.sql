-- Recalibrate level rewards: +2 gen per level (2–9), +4 at level 10 → 20 max total.

create or replace function public.level_reward_credits(p_level int)
returns int
language sql
immutable
as $$
  select case
    when p_level <= 1 then 0
    when p_level = 10 then 4
    when p_level between 2 and 9 then 2
    else 0
  end;
$$;
