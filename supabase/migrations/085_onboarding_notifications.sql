-- Onboarding: step completion → in-app notification + single "next step" nudge.

create or replace function public._onboarding_step_notification(
  p_uid uuid,
  p_step text,
  p_locale text,
  p_kind text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_fr boolean := lower(trim(coalesce(p_locale, 'en'))) = 'fr';
  v_title text;
  v_body text;
  v_href text;
begin
  if p_kind = 'complete' then
    case p_step
      when 'first_beat' then
        v_title := case when v_fr then 'Premier son créé 🎉' else 'First track created 🎉' end;
        v_body := case
          when v_fr then 'Bravo ! Écoute ta track dans Résultats ou lance une variation.'
          else 'Nice! Listen in Results or try a variation.'
        end;
        v_href := '/dashboard';
      when 'library_visit' then
        v_title := case when v_fr then 'Library visitée ✓' else 'Library visited ✓' end;
        v_body := case
          when v_fr then 'Tes créations sont rangées ici — exporte quand tu veux.'
          else 'Your tracks live here — export anytime.'
        end;
        v_href := '/library';
      when 'community_visit' then
        v_title := case when v_fr then 'Commu explorée ✓' else 'Community explored ✓' end;
        v_body := case
          when v_fr then 'Like et commente les tracks qui t''inspirent.'
          else 'Like and comment tracks that inspire you.'
        end;
        v_href := '/community';
      when 'referral_share' then
        v_title := case when v_fr then 'Studio activé 🚀' else 'Studio unlocked 🚀' end;
        v_body := case
          when v_fr then 'Tu as tout débloqué — continue de créer !'
          else 'You''re all set — keep creating!'
        end;
        v_href := '/dashboard';
      else
        return;
    end case;

    if exists (
      select 1 from public.user_notifications
      where user_id = p_uid and kind = 'onboarding_' || p_step
      limit 1
    ) then
      return;
    end if;

    insert into public.user_notifications (user_id, kind, title, body, href)
    values (p_uid, 'onboarding_' || p_step, v_title, v_body, v_href);
    return;
  end if;

  if p_kind = 'nudge' then
    case p_step
      when 'first_beat' then
        v_title := case when v_fr then 'Prochain pas : ton premier son' else 'Next: your first track' end;
        v_body := case
          when v_fr then 'Lance une génération depuis le studio — 10 crédits offerts ce mois-ci.'
          else 'Generate from the studio — 10 free credits this month.'
        end;
        v_href := '/dashboard';
      when 'library_visit' then
        v_title := case when v_fr then 'Visite ta Library' else 'Visit your Library' end;
        v_body := case
          when v_fr then 'Retrouve tes tracks, covers et exports en un clic.'
          else 'Find your tracks, covers, and exports in one place.'
        end;
        v_href := '/library';
      when 'community_visit' then
        v_title := case when v_fr then 'Explore la commu' else 'Explore the community' end;
        v_body := case
          when v_fr then 'Découvre les sons des autres créateurs et partage le tien.'
          else 'Discover other creators and share your sound.'
        end;
        v_href := '/community';
      when 'referral_share' then
        v_title := case when v_fr then 'Gagne des crédits bonus' else 'Earn bonus credits' end;
        v_body := case
          when v_fr then 'Partage ton lien parrainage — 5 crédits pour toi et ton filleul.'
          else 'Share your referral link — 5 credits for you and your friend.'
        end;
        v_href := '/settings#pk-settings-referral';
      else
        return;
    end case;

    delete from public.user_notifications
    where user_id = p_uid and kind = 'activation_nudge';

    insert into public.user_notifications (user_id, kind, title, body, href)
    values (p_uid, 'activation_nudge', v_title, v_body, v_href);
  end if;
end;
$$;

create or replace function public.complete_onboarding_step(
  p_step_id text,
  p_locale text default 'en'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_step text := lower(trim(coalesce(p_step_id, '')));
  v_row_count integer := 0;
  v_inserted boolean := false;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;
  if length(v_step) < 2 or length(v_step) > 40 then
    return jsonb_build_object('ok', false, 'error', 'invalid_step');
  end if;

  insert into public.onboarding_progress (user_id, step_id)
  values (v_uid, v_step)
  on conflict (user_id, step_id) do nothing;

  get diagnostics v_row_count = row_count;
  v_inserted := v_row_count > 0;

  if v_inserted then
    perform public._onboarding_step_notification(v_uid, v_step, p_locale, 'complete');
    perform public.ensure_activation_nudge(p_locale);
  end if;

  return jsonb_build_object('ok', true, 'step_id', v_step, 'created', v_inserted);
end;
$$;

grant execute on function public.complete_onboarding_step(text, text) to authenticated;

drop function if exists public.complete_onboarding_step(text);

create or replace function public.ensure_activation_nudge(p_locale text default 'en')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_steps text[] := array['first_beat', 'library_visit', 'community_visit', 'referral_share'];
  v_step text;
  v_done text[];
  v_next text;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  select coalesce(array_agg(step_id), '{}')
  into v_done
  from public.onboarding_progress
  where user_id = v_uid;

  v_next := null;
  foreach v_step in array v_steps loop
    if not (v_step = any (v_done)) then
      v_next := v_step;
      exit;
    end if;
  end loop;

  if v_next is null then
    delete from public.user_notifications
    where user_id = v_uid and kind = 'activation_nudge';
    return jsonb_build_object('ok', true, 'nudge', false, 'complete', true);
  end if;

  perform public._onboarding_step_notification(v_uid, v_next, p_locale, 'nudge');

  return jsonb_build_object('ok', true, 'nudge', true, 'step', v_next);
end;
$$;

grant execute on function public.ensure_activation_nudge(text) to authenticated;
