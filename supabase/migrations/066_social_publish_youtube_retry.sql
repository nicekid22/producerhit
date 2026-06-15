-- Re-queue loops where YouTube failed for retryable reasons (video missing, API disabled, cadence).

insert into public.social_publish_queue (loop_id, status, attempts, last_error)
select distinct spl.loop_id, 'pending', 0, null
from public.social_publish_log spl
join public.loops l on l.id = spl.loop_id
where spl.platform = 'youtube'
  and spl.status = 'failed'
  and l.is_public = true
  and coalesce(l.audio_url, '') <> ''
  and (
    spl.error = 'youtube_video_unavailable'
    or spl.error like 'youtube_init_403%'
    or spl.error like 'buildYouTubeLongTitle%'
    or (spl.error like 'youtube_preferred_%' and spl.error like '%_wait')
  )
on conflict (loop_id) do update
  set status = 'pending',
      attempts = 0,
      last_error = null,
      updated_at = now()
  where social_publish_queue.status in ('done', 'failed');

delete from public.social_publish_log
where platform = 'youtube'
  and status = 'failed'
  and (
    error = 'youtube_video_unavailable'
    or error like 'youtube_init_403%'
    or error like 'buildYouTubeLongTitle%'
    or (error like 'youtube_preferred_%' and error like '%_wait')
  );
