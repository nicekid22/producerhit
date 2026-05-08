insert into public.profiles (id)
select u.id
from auth.users u
on conflict (id) do nothing;

