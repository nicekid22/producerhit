do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'loops'
      and column_name = 'vocal_type'
  ) then
    alter table public.loops rename column vocal_type to energy_level;
  end if;
end $$;

