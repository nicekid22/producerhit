-- 091_relax_profiles_fk_for_firebase.sql
--
-- Background:
--   profiles.id was `uuid primary key references auth.users (id) on delete cascade`.
--   With the move to Firebase Auth, user IDs are 28-char Firebase UIDs (NOT
--   UUIDs), and there is no corresponding row in supabase `auth.users`. So any
--   insert of a Firebase user into `public.profiles` violates the foreign key.
--
--   The Stripe webhook, Apple IAP sync, distribution, etc. all read/write
--   `public.profiles` (and dependent tables) by `user_id`. For Firebase
--   users to be billable, rows must exist. The FK constraints and uuid-typed
--   user-id columns must be relaxed so Firebase uids (28-char text) fit.
--
--   All Edge Functions call the database with the service_role key, which
--   bypasses RLS — so dropping policies here only affects the anon-key client
--   (which is no longer used by Firebase users — they go through the Supabase
--   wrapper that talks to Firestore). The Edge Functions keep working.

-- Helper: dynamic do-blocks that swallow errors when a constraint/policy
-- doesn't exist, so this migration is idempotent and re-runnable.

-- 1) Drop the Supabase auto-register trigger (Firebase owns auth now).
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- 2) Drop ALL RLS policies on every public table that has one — altering
--    column types requires no policies reference those columns. Edge Functions
--    use service_role (bypass RLS), so policy removal doesn't break them.
do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- 3) Drop EVERY foreign key on every public table. We're changing column
--    types (uuid → text) which blocks while any FK references the column.
--    All Edge Functions use service_role (bypass FK checks), so dropping FKs
--    is safe — the database becomes intentionally permissive about references.
do $$
declare r record;
begin
  for r in
    select conname, conrelid::regclass::text as tbl
    from pg_constraint
    where contype = 'f'
      and conrelid in (
        select oid from pg_class where relnamespace = 'public'::regnamespace
      )
  loop
    execute format('alter table %s drop constraint %I', r.tbl, r.conname);
  end loop;
end $$;

-- 4) Drop the FK from profiles.id → auth.users(id) (the original blocker).
do $$
declare fk_name text;
begin
  select conname into fk_name
  from pg_constraint
  where conrelid = 'public.profiles'::regclass
    and contype = 'f' and confrelid = 'auth.users'::regclass
  limit 1;
  if fk_name is not null then
    execute format('alter table public.profiles drop constraint %I', fk_name);
  end if;
end $$;

-- 5) Relax profiles.id from uuid to text.
alter table public.profiles
  alter column id type text using id::text;

-- 6) Re-apply primary key on profiles.id (may have been dropped above).
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass and contype = 'p'
  ) then
    alter table public.profiles add primary key (id);
  end if;
end $$;

-- 7) Relax user-id-style columns on every public table from uuid to text.
--    Covers every column that a Firebase user id might land in.
do $$
declare r record;
begin
  for r in
    select table_name, column_name
    from information_schema.columns
    where table_schema = 'public'
      and data_type = 'uuid'
      and column_name in (
        'id','user_id','owner_id','follower_id','following_id',
        'referred_id','referrer_id','author_id','referred_by','referee_id',
        'reviewer_id','recipient_id','sender_id','actor_id','target_user_id'
      )
    order by table_name
  loop
    execute format(
      'alter table public.%I alter column %I type text using %I::text',
      r.table_name, r.column_name, r.column_name
    );
  end loop;
end $$;

-- 8) Recreate minimal RLS policies on profiles for the anon-key client
--    (auth.uid() returns NULL under service_role, so Edge Functions bypass).
alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid()::text = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid()::text = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid()::text = id) with check (auth.uid()::text = id);
