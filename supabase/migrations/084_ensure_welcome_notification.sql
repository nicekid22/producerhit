-- Welcome notification (idempotent) so in-app bell is useful on first login.

create or replace function public.ensure_welcome_notification(p_locale text default 'en')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
  v_fr boolean := lower(trim(coalesce(p_locale, 'en'))) = 'fr';
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  if exists (
    select 1 from public.user_notifications
    where user_id = v_uid and kind = 'welcome'
    limit 1
  ) then
    return jsonb_build_object('ok', true, 'created', false);
  end if;

  insert into public.user_notifications (user_id, kind, title, body, href)
  values (
    v_uid,
    'welcome',
    case when v_fr then 'Bienvenue sur ProducerHit 🎵' else 'Welcome to ProducerHit 🎵' end,
    case
      when v_fr then 'Génère ton premier beat ou ta première chanson depuis le studio.'
      else 'Generate your first beat or song from the studio.'
    end,
    '/dashboard'
  )
  returning id into v_id;

  return jsonb_build_object('ok', true, 'created', true, 'id', v_id);
end;
$$;

grant execute on function public.ensure_welcome_notification(text) to authenticated;
