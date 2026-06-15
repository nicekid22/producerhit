-- 4 daily trend remix slots: 2 videos per account (remix1 + remix2).
-- Step 1: drop old slot check before renaming slots.

alter table public.trend_remix_plans
  drop constraint if exists trend_remix_plans_slot_check;

update public.trend_remix_plans
set slot = 'remix1_morning', target_youtube_account = 'remix1'
where slot = 'morning';

update public.trend_remix_plans
set slot = 'remix2_evening', target_youtube_account = 'remix2'
where slot = 'evening';

alter table public.trend_remix_plans
  add constraint trend_remix_plans_slot_check
  check (slot in ('remix1_morning', 'remix1_evening', 'remix2_morning', 'remix2_evening'));

comment on table public.trend_remix_plans is
  'Daily trend remix plan — 4 slots/day: remix1×2 + remix2×2 landscape YouTube uploads.';
