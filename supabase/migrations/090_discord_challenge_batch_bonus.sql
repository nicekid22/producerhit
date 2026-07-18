-- Batch version of grant_discord_challenge_bonus — replaces N sequential RPC calls.
-- Called by discord-cron closeWeekly action.

create or replace function public.grant_discord_challenge_bonus_batch(
  p_grants jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_granted int := 0;
  v_skipped int := 0;
  rec jsonb;
  v_user_id uuid;
  v_credits int;
  v_key text;
  v_already boolean;
begin
  for rec in select value from jsonb_array_elements(p_grants)
  loop
    v_user_id := (rec->>'user_id')::uuid;
    v_credits := (rec->>'credits')::int;
    v_key := rec->>'idempotency_key';

    -- Skip invalid entries
    if v_user_id is null or v_credits is null or v_credits <= 0 or v_key is null or length(v_key) < 8 then
      v_skipped := v_skipped + 1;
      continue;
    end if;

    -- Idempotency check
    select exists(
      select 1 from public.discord_bot_events
      where event_type = 'challenge_bonus'
        and payload->>'idempotency_key' = v_key
    ) into v_already;

    if v_already then
      v_skipped := v_skipped + 1;
      continue;
    end if;

    -- Update profiles
    update public.profiles
    set referral_bonus = referral_bonus + v_credits
    where id = v_user_id;

    -- Insert idempotency record
    insert into public.discord_bot_events (event_type, payload, ok)
    values ('challenge_bonus', jsonb_build_object(
      'user_id', v_user_id,
      'credits', v_credits,
      'idempotency_key', v_key
    ), true);

    v_granted := v_granted + 1;
  end loop;

  return jsonb_build_object('ok', true, 'granted', v_granted, 'skipped', v_skipped);
end;
$$;

grant execute on function public.grant_discord_challenge_bonus_batch(jsonb) to service_role;
