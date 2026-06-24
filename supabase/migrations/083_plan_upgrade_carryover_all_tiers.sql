-- Any plan upgrade (free→paid or paid→higher paid): reset monthly usage + carry previous tier limit
-- as daily_bonus_month for the rest of the calendar month.
-- Examples: free→pro 75+10=85 | pro→studio 250+75=325 | studio→plus 1000+250=1250

create or replace function public.apply_plan_upgrade_carryover()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  old_plan text := coalesce(OLD.plan, 'free');
  new_plan text := coalesce(NEW.plan, 'free');
begin
  if new_plan not in ('pro', 'studio', 'plus') then
    return NEW;
  end if;

  if public.plan_rank(new_plan) > public.plan_rank(old_plan)
     and old_plan is distinct from new_plan then
    NEW.loops_used_this_month := 0;
    NEW.daily_bonus_month := coalesce(OLD.daily_bonus_month, 0) + public.plan_monthly_limit(old_plan);
  end if;

  return NEW;
end;
$$;

drop trigger if exists profile_free_to_paid_carryover on public.profiles;
drop trigger if exists profile_plan_upgrade_carryover on public.profiles;

create trigger profile_plan_upgrade_carryover
before update of plan on public.profiles
for each row
execute function public.apply_plan_upgrade_carryover();

drop function if exists public.apply_free_to_paid_upgrade_carryover();
