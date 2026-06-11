-- Community comments on public loops + bootstrap seed comments for early social proof.

create table if not exists public.loop_comments (
  id uuid primary key default gen_random_uuid(),
  loop_id uuid not null references public.loops (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  body text not null,
  author_name text,
  author_avatar_id smallint not null default 1,
  is_seed boolean not null default false,
  hidden_at timestamptz,
  created_at timestamptz not null default now(),
  constraint loop_comments_body_len check (char_length(trim(body)) between 1 and 280),
  constraint loop_comments_author_avatar_check check (author_avatar_id between 1 and 10),
  constraint loop_comments_author_mode check (
    (user_id is not null and author_name is null and is_seed = false)
    or (user_id is null and author_name is not null and is_seed = true)
  )
);

create index if not exists loop_comments_loop_id_idx on public.loop_comments (loop_id);
create index if not exists loop_comments_user_id_idx on public.loop_comments (user_id);
create index if not exists loop_comments_created_at_idx on public.loop_comments (created_at desc);

alter table public.loop_comments enable row level security;

drop policy if exists loop_comments_select_public on public.loop_comments;
create policy loop_comments_select_public on public.loop_comments
  for select
  using (
    hidden_at is null
    and exists (
      select 1
      from public.loops l
      where l.id = loop_comments.loop_id
        and l.is_public = true
    )
  );

drop policy if exists loop_comments_insert_authenticated on public.loop_comments;
create policy loop_comments_insert_authenticated on public.loop_comments
  for insert
  with check (
    auth.uid() is not null
    and user_id = auth.uid()
    and is_seed = false
    and author_name is null
    and exists (
      select 1
      from public.loops l
      where l.id = loop_comments.loop_id
        and l.is_public = true
    )
  );

drop policy if exists loop_comments_delete_own on public.loop_comments;
create policy loop_comments_delete_own on public.loop_comments
  for delete
  using (auth.uid() = user_id);

drop policy if exists loop_comments_hide_moderation on public.loop_comments;
create policy loop_comments_hide_moderation on public.loop_comments
  for update
  using (
    hidden_at is null
    and (
      auth.uid() = user_id
      or exists (
        select 1
        from public.loops l
        where l.id = loop_comments.loop_id
          and l.user_id = auth.uid()
      )
    )
  )
  with check (
    hidden_at is not null
    or auth.uid() = user_id
    or exists (
      select 1
      from public.loops l
      where l.id = loop_comments.loop_id
        and l.user_id = auth.uid()
    )
  );

create or replace function public.get_loop_comment_counts(p_loop_ids uuid[])
returns table (loop_id uuid, comment_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select c.loop_id, count(*)::bigint as comment_count
  from public.loop_comments c
  join public.loops l on l.id = c.loop_id and l.is_public = true
  where c.hidden_at is null
    and c.loop_id = any (p_loop_ids)
  group by c.loop_id;
$$;

revoke all on function public.get_loop_comment_counts(uuid[]) from public;
grant execute on function public.get_loop_comment_counts(uuid[]) to anon, authenticated;

-- Bootstrap seed comments (idempotent — skip loops that already have comments).
do $$
declare
  r record;
  slot int;
  pick int;
  seed_names text[] := array[
    'MayaBeats', 'trapkid.96', 'nightshift.prod', 'vhs.dreams',
    'lo_fi_darius', 'chrome.wav', 'beatsfromparis', 'westside.loop',
    'soul.crate', 'drillkid.uk', 'neon.room', 'focus.mode'
  ];
  seed_avatars int[] := array[2, 3, 7, 4, 5, 6, 1, 8, 9, 3, 6, 2];
  generic_pool text[] := array[
    'this bounce is crazy 🔥',
    'saved instantly, need to remix this vibe',
    'mix feels super clean for an 8 bar loop',
    'been looping this all morning ngl',
    'the pocket on this is wide open for vocals',
    'how is this free to listen??',
    'remixed this in my head already lol',
    'this hits different with headphones',
    'perfect length, no filler',
    'community feed is getting dangerous 👀'
  ];
  drill_pool text[] := array[
    'that slide pattern is nasty',
    'drill but still melodic, love it',
    '808s hit like a truck on this one',
    'need a feature on this asap',
    'this would go hard on a freestyle vid'
  ];
  trap_pool text[] := array[
    'those keys at 2am hit different',
    'melancholy but still hard 💯',
    'ethereal trap done right',
    'hi-hats are bouncing perfectly',
    'mood is exactly what the title says'
  ];
  rnb_pool text[] := array[
    'smooth af, instant save',
    'vocal pocket is right there',
    'this is R&B without trying too hard',
    'warm mix, love the low end',
    'would write to this tonight for sure'
  ];
  west_pool text[] := array[
    'car test passed first try',
    'west coast bounce without the clichés',
    'this goes stupid in the whip',
    'hyphy energy but still polished'
  ];
  chill_pool text[] := array[
    'perfect focus vibe while coding',
    'looped this for an hour straight',
    'soft but not boring at all',
    'great texture, feels alive',
    'ocean vibes without being generic'
  ];
  weird_pool text[] := array[
    'didn''t expect this combo to work but it slaps',
    'so much character in 8 bars',
    'the glitch texture is wild',
    'opera trap is a genre now apparently 😭🔥',
    'chrome tears is such a mood name'
  ];
  fr_pool text[] := array[
    'la vibe est insane 🔥',
    'direct dans mes saves',
    'le bounce est parfait pour un freestyle',
    'j''ai remixé ça direct dans ma tête',
    'propre, ça sonne fini'
  ];
  body text;
  genre_l text;
  days_ago int;
begin
  for r in
    select l.id, l.genre, l.name
    from public.loops l
    where l.is_public = true
      and not exists (
        select 1 from public.loop_comments c where c.loop_id = l.id
      )
    order by l.created_at desc
    limit 40
  loop
    genre_l := lower(coalesce(r.genre, '') || ' ' || coalesce(r.name, ''));

    for slot in 1..(1 + (abs(hashtext(r.id::text)) % 3)) loop
      pick := 1 + (abs(hashtext(r.id::text || slot::text)) % 12);

      if genre_l ~ '(drill|jerk)' then
        body := drill_pool[1 + (abs(hashtext(r.id::text || slot::text || 'd')) % array_length(drill_pool, 1))];
      elsif genre_l ~ '(trap|rap|hyphy|west coast|space|edit audio|chrome|ethereal|orchestral trap)' then
        body := trap_pool[1 + (abs(hashtext(r.id::text || slot::text || 't')) % array_length(trap_pool, 1))];
      elsif genre_l ~ '(r&b|soul|seductive|neon|cassette|ocean|nostalgic|vhs)' then
        body := rnb_pool[1 + (abs(hashtext(r.id::text || slot::text || 'r')) % array_length(rnb_pool, 1))];
      elsif genre_l ~ '(hyphy|west coast)' then
        body := west_pool[1 + (abs(hashtext(r.id::text || slot::text || 'w')) % array_length(west_pool, 1))];
      elsif genre_l ~ '(coding|ambient|ocean|chill)' then
        body := chill_pool[1 + (abs(hashtext(r.id::text || slot::text || 'c')) % array_length(chill_pool, 1))];
      elsif genre_l ~ '(glitch|opera|chrome|chopped|screwed|space)' then
        body := weird_pool[1 + (abs(hashtext(r.id::text || slot::text || 'x')) % array_length(weird_pool, 1))];
      elsif slot = 2 and (abs(hashtext(r.id::text)) % 5) = 0 then
        body := fr_pool[1 + (abs(hashtext(r.id::text || slot::text || 'f')) % array_length(fr_pool, 1))];
      else
        body := generic_pool[1 + (abs(hashtext(r.id::text || slot::text || 'g')) % array_length(generic_pool, 1))];
      end if;

      days_ago := 1 + (abs(hashtext(r.id::text || slot::text || 'age')) % 18);
      pick := 1 + (abs(hashtext(r.id::text || slot::text || 'n')) % array_length(seed_names, 1));

      insert into public.loop_comments (
        loop_id,
        user_id,
        body,
        author_name,
        author_avatar_id,
        is_seed,
        created_at
      ) values (
        r.id,
        null,
        body,
        seed_names[pick],
        seed_avatars[pick],
        true,
        now() - (days_ago || ' days')::interval - ((slot * 3 + pick) || ' hours')::interval
      );
    end loop;
  end loop;
end $$;
