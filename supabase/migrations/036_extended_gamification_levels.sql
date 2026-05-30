-- Extended gamification: levels 11–25 with slower XP curve and milestone loot.

create or replace function public.gamification_level_from_xp(p_xp int)
returns int
language plpgsql
immutable
as $$
declare
  thresholds int[] := array[0, 80, 180, 320, 500, 720, 980, 1280, 1620, 2000];
  lvl int := 1;
  i int;
  floor_xp int := 2000;
  span int;
  max_lvl int := 25;
begin
  for i in 2..array_length(thresholds, 1) loop
    if p_xp >= thresholds[i] then
      lvl := i;
    else
      exit;
    end if;
  end loop;

  while lvl < max_lvl loop
    span := 380 + (lvl - 9) * 35;
    if p_xp >= floor_xp + span then
      floor_xp := floor_xp + span;
      lvl := lvl + 1;
    else
      exit;
    end if;
  end loop;

  return lvl;
end;
$$;

create or replace function public.level_reward_credits(p_level int)
returns int
language sql
immutable
as $$
  select case
    when p_level <= 1 then 0
    when p_level between 2 and 9 then 2
    when p_level = 10 then 4
    when p_level between 11 and 24 then
      case when p_level % 5 = 0 then 2 else 1 end
    when p_level = 25 then 3
    else 0
  end;
$$;

create or replace function public.claim_level_rewards(p_xp int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_stored_xp int;
  v_claimed int;
  v_new_level int;
  v_credits int := 0;
  v_lvl int;
  v_safe_xp int;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  v_safe_xp := greatest(0, least(coalesce(p_xp, 0), 120000));

  select gamification_xp, level_rewards_claimed
    into v_stored_xp, v_claimed
  from public.profiles
  where id = v_uid
  for update;

  v_safe_xp := greatest(coalesce(v_stored_xp, 0), v_safe_xp);
  v_claimed := greatest(1, coalesce(v_claimed, 1));
  v_new_level := public.gamification_level_from_xp(v_safe_xp);

  if v_new_level <= v_claimed then
    return jsonb_build_object(
      'ok', true,
      'already_claimed', true,
      'level', v_new_level,
      'credits_granted', 0,
      'level_bonus', (select level_bonus from public.profiles where id = v_uid),
      'daily_bonus_month', (select daily_bonus_month from public.profiles where id = v_uid)
    );
  end if;

  for v_lvl in (v_claimed + 1)..v_new_level loop
    v_credits := v_credits + public.level_reward_credits(v_lvl);
  end loop;

  update public.profiles
    set gamification_xp = v_safe_xp,
        level_bonus = level_bonus + v_credits,
        level_rewards_claimed = v_new_level
  where id = v_uid;

  return jsonb_build_object(
    'ok', true,
    'already_claimed', false,
    'level', v_new_level,
    'credits_granted', v_credits,
    'level_bonus', (select level_bonus from public.profiles where id = v_uid),
    'daily_bonus_month', (select daily_bonus_month from public.profiles where id = v_uid)
  );
end;
$$;
