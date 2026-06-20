/**
 * Copy Reddit « humain » — hooks, curiosité, questions (expert growth / prod music).
 */

import { isoWeekIndex } from "./redditScout.mjs";

const SITE = "https://www.producerhit.com";

export function utm(pathname, campaign) {
  const u = new URL(pathname.startsWith("http") ? pathname : `${SITE}${pathname}`);
  u.searchParams.set("utm_source", "reddit");
  u.searchParams.set("utm_medium", "social");
  u.searchParams.set("utm_campaign", campaign);
  return u.toString();
}

export function loopUrl(id, campaign = "human_beat") {
  return `${SITE}/loop/${encodeURIComponent(id)}?utm_source=reddit&utm_medium=social&utm_campaign=${campaign}`;
}

/** Loop beat (hip-hop / type beat). */
export function pickEngagementLoop(loops) {
  const scored = loops.map((l) => {
    const hay = `${l.name} ${l.genre}`.toLowerCase();
    let score = 0;
    if (/terror|plugg|hyperrage|drill|phonk|miami|bollywood|ndombolo|trap/i.test(hay)) score += 4;
    if (l.bpm && l.bpm < 85) score += 2;
    if (l.genre && l.genre !== "Auto") score += 2;
    if (/chanson|voix|vocal|ballad|acoustic|pop|rnb|soul/i.test(hay)) score -= 2;
    return { loop: l, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.loop ?? loops[0];
}

/** Loop / titre oriente chanson (mode Song). */
export function pickEngagementSong(loops) {
  const scored = loops.map((l) => {
    const hay = `${l.name} ${l.genre}`.toLowerCase();
    let score = 0;
    if (/chanson|song|voix|vocal|lyric|ballad|pop|rnb|soul|acoustic|melodic|indie|folk/i.test(hay)) score += 5;
    if (l.bpm && l.bpm >= 70 && l.bpm <= 130) score += 2;
    if (/trap|drill|phonk|808|plugg/i.test(hay)) score -= 2;
    return { loop: l, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.loop ?? loops[0];
}

/** Auto selon sub ou intent (beats vs chanson). */
export function pickEngagementContent(loops, { subreddit, intent } = {}) {
  const sr = (subreddit ?? "").toLowerCase();
  const songSubs = /songwriting|singing|composer|musicians|pop|indie|chanson/i;
  const beatSubs = /typebeat|trap|hiphop|beatmaker|futurebeat/i;
  const songIntent = /songwriting|song_mode|help|discussion/i.test(intent ?? "");
  if (songSubs.test(sr) || songIntent) return pickEngagementSong(loops);
  if (beatSubs.test(sr)) return pickEngagementLoop(loops);
  return pickEngagementLoop(loops);
}

function shortName(name) {
  return (name ?? "untitled").replace(/\s+#\d+$/, "").slice(0, 48);
}

function bpmLabel(loop) {
  return loop.bpm ? `${loop.bpm} BPM` : "unknown BPM";
}

/** Post lien r/Typebeats — titre = hook, commentaire #1 = contexte humain. */
export function typebeatsPost(loop) {
  const id = loop.id;
  const url = loopUrl(id, "typebeats_hook");
  const genre = loop.genre ?? "trap";
  const bpm = bpmLabel(loop);
  const label = shortName(loop.name);

  const hooks = {
    terror: {
      title: `[FREE] ${bpm} slow plugg sketch — "${label}" (raw before FL, roast the bounce?)`,
      firstComment: `name generator went feral on this one tbh

this is the **raw loop** before i swapped drums/808 in FL — kept it at ${bpm} on purpose bc slow plugg either hits different or i'm delusional

free for non-profit / tag if you use it. genuinely want to know: too sluggish or does it work?

${url}`,
    },
    miami: {
      title: `[FREE] ${bpm} soul/trap loop — late night sketch "${label}" (needs real drums imo)`,
      firstComment: `made this at like 2am when i should've been sleeping

it's ai-generated reference — i always redo hi-hats + 808 myself. this one has a warm chord thing i didn't expect

if anyone flips it i'd love to hear. free download:

${url}`,
    },
    bollywood: {
      title: `[FREE] weird one — bollywood x trap sitar pluck @ ${bpm} (does this work or nah?)`,
      firstComment: `honestly not sure if this genre fusion is genius or a crime

generated as an experiment (sitar pluck + tabla vibe over trap bounce). haven't mixed it for real yet

roast welcome. link:

${url}`,
    },
    default: {
      title: `[FREE] ${genre} @ ${bpm} — "${label}" (sketch, not a finished type beat)`,
      firstComment: `not posting this as a "fire beat" — it's a **starting loop** i pull into my daw and rebuild

took 2 min to generate, took longer to decide if it's worth developing lol

free to use. what would you change first — drums or melody?

${url}`,
    },
  };

  const hay = `${loop.name} ${loop.genre}`.toLowerCase();
  let variant = hooks.default;
  if (/terror|plugg/i.test(hay)) variant = hooks.terror;
  else if (/miami|soul/i.test(hay)) variant = hooks.miami;
  else if (/bollywood|sitar|fusion/i.test(hay)) variant = hooks.bollywood;

  return {
    subreddit: "Typebeats",
    kind: "link",
    title: variant.title,
    url,
    firstComment: variant.firstComment,
    timing: "Poster maintenant si audience US awake (12h–22h EST = plus de réponses)",
  };
}

/** r/aiMusic — discussion feed (SANS lien) + megathread (avec lien). */
export function aiMusicPosts(loop) {
  const site = utm("/", "aimusic_founder");
  const demo = loopUrl(loop.id, "aimusic_demo");
  const compare = utm("/suno-alternatives", "aimusic_compare");

  return {
    subreddit: "aiMusic",
    rulesNote:
      "r/aiMusic : pas de self-promo dans le feed principal → megathread épinglé. Discussion OK sans lien.",
    megathreadUrl: "https://www.reddit.com/r/aiMusic/search/?q=megathread&restrict_sr=1&sort=new",

    /** Post #1 — feed principal, 0 lien = survit aux mods */
    discussion: {
      title: "Solo dev — AI for beat loops AND song sketches (not another Suno clone). Am I solving a real problem?",
      selftext: `hey r/aiMusic — solo dev/producer, not a label. tired of the gap between "full AI songs" and actually making music.

**two workflows i kept mixing up:**
- **Type beat / loop mode** — 8-bar sketch in fixed BPM + key → DAW → redo drums/808/mix
- **Song mode** — melody + structure + vocal-ish sketch to unblock lyrics/arrangement (i still rewrite everything)

**what broke for me with Suno/Udio alone:**
- amazing for *finished songs*, awkward when i need a loop in one key for beat work
- song output is a demo, not my final vocal/lyrics
- BeatStars → hours of scrolling

**what i built (ProducerHit):**
- pick genre + BPM + key *before* generating
- switch **loop** vs **song** intent (not the same use case)
- seed variations → same mood, new idea
- export → human finishing required

**honest questions:**
1. do you use AI for loops, full songs, or both?
2. anyone actually using AI for *songwriting sketches* vs releasable vocals?
3. what would make you trust a tool vs "AI slop"?

no links in the feed — happy to discuss in comments.`,
      firstComment: `context: solo dev, free tier ~10 gens/month. built this for myself first, now trying to see if anyone else hits the same wall`,
    },

    /** Post #2 — megathread self-promo (lien OK) */
    megathreadComment: `Built **ProducerHit** — AI loop sketch tool for beatmakers (680+ genres, BPM/key lock, seed variations)

Not Suno-style songs — producer workflow: generate loop → export → redo drums in DAW

Free tier, solo dev, would love brutal feedback:
${site}

Demo loop (raw AI output): ${demo}

Suno vs producer tools comparison i wrote: ${compare}

what's the #1 thing you'd want in a tool like this?`,
  };
}

/** r/alphaandbetausers — early adopters, discussion fondateur (lien en commentaire si demandé). */
export function alphaBetaPost(loop) {
  void loop;
  return {
    subreddit: "alphaandbetausers",
    kind: "self",
    title: "[Beta] ProducerHit — AI loop + **song** sketches for producers (not another Suno clone)",
    selftext: `Solo dev / producer looking for early testers who use a DAW or write songs — not just one-click Suno tracks.

**Two modes, two problems:**
- **Loop / type beat** — lock BPM + key → sketch → redo drums in FL/Ableton
- **Song mode** — melody + structure sketch → rewrite lyrics → real vocal later

**The gap:** Suno ships a "finished song"; I needed ideation without pretending it's release-ready.

Free tier. Not replacing artists — sketch pad only.

**Questions:**
1. Beats, songs, or both in your workflow?
2. Would you try song-mode sketches or only full AI vocals?
3. Link in comments if you want to roast the landing page.`,
    firstComment: `link if useful: ${utm("/", "alpha_beta")} — brutal feedback welcome especially on whether the value prop is clear`,
  };
}

/** Self-post r/SideProject — curiosité fondateur, pas un ad beat. */
export function sideProjectPost(loop) {
  void loop;
  return {
    subreddit: "SideProject",
    kind: "self",
    title: "BeatStars scrolling was killing my sessions so I built a seed-based loop sketch tool (probably overbuilt it)",
    selftext: `Not another "AI will replace artists" pitch — I built this because I kept losing **hours** before I even opened FL.

**The annoying gap:**
- Suno/Udio → great for *finished songs*, useless when I need an 8-bar loop in **one BPM + key**
- BeatStars → infinite scroll, wrong vibe, wrong key
- Blank project → writer's block

**What I shipped (ProducerHit):**
- lock genre / BPM / key *before* generation
- seed variations → same mood, new melody (like rerolling an idea without starting over)
- export mp3 → I redo drums, 808, mix manually. AI = sketch pad only.

Solo dev. Free tier ~10 gens/month.

**Would love brutal feedback:**
1. Is this a fake problem or do you hit the same wall?
2. Landing page — clear or too "AI slop"?
3. What would make you actually try it once?

Not asking for upvotes — genuinely trying to figure out if I'm building for myself or for others. Link in comments if mods prefer.`,
    firstComment: `context: i'm the dev — ${utm("/", "sideproject")} if you want to poke holes in it`,
    timing: "SideProject répond bien le matin US (9h–12h EST)",
  };
}

/** r/WeAreTheMusicMakers — question workflow, zéro lien beat. */
export function watmmWorkflowPost(loop) {
  void loop;
  return {
    subreddit: "WeAreTheMusicMakers",
    kind: "self",
    title: "How do you use AI in your production workflow without it becoming a crutch?",
    selftext: `Genuine question from someone who's been experimenting (and overbuilding tools).

**What I've tried:**
- Full songs via Suno/Udio → fun demos, rarely becomes a beat I release
- Loop sketches with locked BPM/key → export to DAW, replace drums/808, treat as reference
- Ignoring AI entirely → best mixes, worst writer's block

**Where I'm stuck:**
- When does "reference sketch" become lazy?
- Do you disclose AI-assisted loops to collaborators/clients?
- Melodic ideas first or drums first when you're unblocking?

I'm not dropping links or beats here — just want to hear how **you** actually work in 2026.

What's your line between tool vs shortcut?`,
    firstComment: null,
    timing: "WATMM — poster dans un thread feedback si possible ; self-post = question ouverte only",
  };
}

/** r/Songwriting — mode chanson, lyrics/melody (pas type beat). */
export function songwritingDiscussionPost(loop) {
  void loop;
  return {
    subreddit: "Songwriting",
    kind: "self",
    title: "Anyone using AI for melody/structure sketches — without shipping raw vocals?",
    selftext: `Genuine question from someone who writes and produces.

**What I mean by "sketch":**
- rough melody or chord mood to unblock a verse
- "what if the chorus lifted here?" — not a finished release
- lyrics still mine; AI = demo tape i wouldn't upload

**What I don't mean:**
- dumping Suno output straight to Spotify
- pretending AI vocals are "my voice"

I built tools for both **beat loops** and **song mode** (same app, different intent). Still learning where the line is.

**Curious how songwriters here actually use AI in 2026:**
1. lyrics only?
2. melody/harmony ideas?
3. full demo vocals you'd refine?
4. not at all?

Not selling anything in this post — want real workflows, not hype.`,
    firstComment: `personally: song-mode demos → rewrite lyrics → re-sing or collab vocalist. beat-mode → separate workflow entirely`,
    timing: "r/Songwriting — ton vulnerable/honnete, pas promo",
  };
}

/** r/musicproduction — prod generale, beats + chansons. */
export function musicProductionDiscussionPost(loop) {
  void loop;
  return {
    subreddit: "musicproduction",
    kind: "self",
    title: "Do you separate 'AI for beats' and 'AI for songs' in your head — or same workflow?",
    selftext: `Noticed I treat these totally differently:

**Beat / loop workflow:** lock BPM + key → short sketch → replace drums in DAW → type beat or instrumental

**Song workflow:** melody + structure sketch → rewrite lyrics → my vocal (or collaborator) → real arrangement

Suno blurs the line because it ships a "finished song" in one click — but that's not how I release anything.

**Questions for this sub:**
- same tool for both or different tools?
- do you disclose AI-assisted sketches to clients/collabs?
- where's your "this is still mine" line?

Building in this space as a solo dev — trying not to be the AI slop guy. What's your actual setup?`,
    firstComment: null,
    timing: "musicproduction — question ouverte, pas de lien",
  };
}

/** r/composer — composition / arrangement. */
export function composerDiscussionPost(loop) {
  void loop;
  return {
    subreddit: "composer",
    kind: "self",
    title: "AI for harmonic ideas — tool or trap?",
    selftext: `Composer/producer hybrid here. Using AI more for **harmonic/melodic what-ifs** than finished pieces.

Example: generate 3 sketches same key/tempo → pick one → orchestrate/arrange manually. Feels closer to "messy piano demo" than "AI composition."

**Where it helps:** writer's block, exploring voicings, demoing a mood for a client

**Where it fails:** anything needing intentional voice-leading or long-form structure without heavy editing

Do other composers here use AI? For film/game/hybrid stuff especially — curious if anyone's found a sustainable workflow.`,
    firstComment: null,
    timing: "composer — petit sub, repondre a chaque commentaire",
  };
}

/** Post discussion hebdo pour le cron — rotation subs (beats + chanson). */
export function weeklyDiscussionForDay(dow, loop) {
  const aim = aiMusicPosts(loop);
  const week = isoWeekIndex();

  const wedPool = [
    { ...sideProjectPost(loop), kind: "side_project" },
    { ...songwritingDiscussionPost(loop), kind: "songwriting" },
    { ...watmmWorkflowPost(loop), kind: "watmm_workflow" },
  ];
  const friPool = [
    { ...alphaBetaPost(loop), kind: "alpha_beta" },
    { ...musicProductionDiscussionPost(loop), kind: "musicproduction" },
    { ...composerDiscussionPost(loop), kind: "composer" },
  ];

  const byDay = {
    1: {
      ...aim.discussion,
      kind: "aimusic_discussion",
      subreddit: aim.subreddit,
      postKind: "self",
    },
    3: { ...wedPool[week % wedPool.length], postKind: "self" },
    5: { ...friPool[week % friPool.length], postKind: "self" },
  };
  return byDay[dow] ?? null;
}

/** Megathread r/aiMusic — seul endroit auto avec lien (commentaire, pas post feed). */
export function aimusicMegathreadComment(loop) {
  return aiMusicPosts(loop).megathreadComment;
}

/** Post discussion principal pour l'agent manuel (défaut: SideProject). */
export function pickAgentDiscussionPost(loop, preferredSub) {
  const sub = (preferredSub ?? process.env.REDDIT_POST_SUBREDDIT ?? "SideProject").replace(/^r\//i, "");
  const catalog = {
    aiMusic: () => {
      const aim = aiMusicPosts(loop);
      return {
        subreddit: "aiMusic",
        subLabel: "r/aiMusic",
        subNote: aim.rulesNote,
        title: aim.discussion.title,
        selftext: aim.discussion.selftext,
        firstComment: aim.discussion.firstComment,
        kind: "self",
      };
    },
    SideProject: () => {
      const sp = sideProjectPost(loop);
      return {
        subreddit: sp.subreddit,
        subLabel: "r/SideProject",
        subNote: "Discussion fondateur — pas de beat, questions honnêtes",
        title: sp.title,
        selftext: sp.selftext,
        firstComment: sp.firstComment,
        kind: "self",
        timing: sp.timing,
      };
    },
    alphaandbetausers: () => {
      const ab = alphaBetaPost(loop);
      return {
        subreddit: ab.subreddit,
        subLabel: "r/alphaandbetausers",
        subNote: "Early adopters — feedback produit",
        title: ab.title,
        selftext: ab.selftext,
        firstComment: ab.firstComment,
        kind: "self",
      };
    },
    Songwriting: () => {
      const sw = songwritingDiscussionPost(loop);
      return {
        subreddit: sw.subreddit,
        subLabel: "r/Songwriting",
        subNote: "Mode chanson — lyrics/melody, pas type beat",
        title: sw.title,
        selftext: sw.selftext,
        firstComment: sw.firstComment,
        kind: "self",
        timing: sw.timing,
      };
    },
    musicproduction: () => {
      const mp = musicProductionDiscussionPost(loop);
      return {
        subreddit: mp.subreddit,
        subLabel: "r/musicproduction",
        subNote: "Beats + chansons — question workflow",
        title: mp.title,
        selftext: mp.selftext,
        firstComment: mp.firstComment,
        kind: "self",
        timing: mp.timing,
      };
    },
    composer: () => {
      const c = composerDiscussionPost(loop);
      return {
        subreddit: c.subreddit,
        subLabel: "r/composer",
        subNote: "Composition / arrangement — pas promo",
        title: c.title,
        selftext: c.selftext,
        firstComment: c.firstComment,
        kind: "self",
        timing: c.timing,
      };
    },
    WeAreTheMusicMakers: () => {
      const w = watmmWorkflowPost(loop);
      return {
        subreddit: w.subreddit,
        subLabel: "r/WeAreTheMusicMakers",
        subNote: w.timing,
        title: w.title,
        selftext: w.selftext,
        firstComment: w.firstComment,
        kind: "self",
      };
    },
  };
  const pick = catalog[sub] ?? catalog.SideProject;
  return pick();
}

/** r/MusicInTheMaking — WIP story. */
export function musicInMakingPost(loop) {
  const url = loopUrl(loop.id, "mim_wip");
  const bpm = bpmLabel(loop);
  return {
    subreddit: "MusicInTheMaking",
    kind: "self",
    title: `WIP: ${bpm} loop sketch — debating whether to develop or trash (${loop.genre ?? "trap"})`,
    selftext: `trying a workflow where i **don't** start from zero anymore

1. generate 3–4 loops same BPM/key different seeds (~2 min each)
2. pick least embarrassing one
3. replace drums/808 in FL, arrange, mix for real

this is step 0 output — raw reference:

${url}

**where i'm stuck:** melody feels ok but low end is mush until i redo it. do you develop sketches like this or is it a crutch?

looking for collab feedback not promo — what would you fix first?`,
    firstComment: null,
    timing: "Bon sub si tu engages les commentaires des autres avant",
  };
}

/**
 * Reponse subtile — participation d'abord, zero pitch.
 * Ex: r/aiMusic "does anyone actually make money from ai generated..."
 */
export function draftSubtleComment(post) {
  const intent = post.intent ?? "generic";
  const sub = (post.subreddit ?? "").toLowerCase();
  const onAiMusic = sub === "aimusic" || sub === "sunoai";

  const templates = {
    monetization: onAiMusic
      ? `honest take, not trying to sell you anything:

most "make money from ai music" threads are really 3 different games — streaming finished tracks (brutal margins + noise), leasing beats (still needs real mixing + branding), or selling workflow/tools to other creators (unsexy but real).

raw generator dumps rarely last. the people i still see doing *something* treat ai as sketch/reference, finish in a daw, or they build for producers instead of competing on spotify.

what lane are you actually aiming for? streaming, beats, or services? the answer matters more than which model you use.`
      : `real talk on the money side — dumping raw ai tracks to streaming is a race to zero from what i've seen.

where people last longer: finish in a daw (so it's defensibly yours), niche + consistency, or sell workflow to other producers instead of competing on spotify plays.

curious what you're trying to monetize — finished songs or producer workflow?`,

    discussion: `following this — been on both sides (trying to ship beats + building tools). the unsexy pattern is always the same: ai gets you to **draft fast**, money shows up after human finishing (mix, arrangement, brand).

what's your actual goal with this — side income or replace a day job?`,

    ethics: `think the debate splits weirdly — "ai music" as finished product vs ai as sketch pad for people who already produce.

i don't trust raw slop on spotify either. but reference loops → redo drums/808/mix yourself feels closer to sampling workflow than replacing artists.

where do you draw the line?`,

    ai_compare: onAiMusic
      ? `suno/udio excel at full songs. when i need an 8-bar loop in a fixed bpm/key for beat work, i ended up in a totally different workflow (sketch → daw → redo drums).

do you use ai for finished releases or mostly ideation?`
      : `suno wins for songs; for beat workflow i lock bpm/key first then treat output as reference only. still redo drums every time.

what's your split — full tracks or loops/sketches?`,

    workflow: `workflow that's been working: lock bpm/key → 3–4 ugly sketches → pick one → replace 100% of drums/808 in daw.

ai = reference, not the final beat. anyone else doing this or is it a crutch?`,

    help: `when i'm blocked i set a 15 min timer for "ugly loops only" — permission to trash everything. usually one sketch is worth developing.

what's your actual unblock ritual?`,

    type_beat: `stopped doom-scrolling beatstars for hours — same-key sketches then develop one in fl. not replacing real producers, just unblocking sessions.

anyone else or is that a slippery slope?`,

    songwriting: onAiMusic
      ? `songwriting angle — i split "beat loops" vs "song sketches" in my head completely.

song mode for me = melody/structure demo → rewrite lyrics → real vocal later. not shipping raw ai vocals.

curious if songwriters here use ai for hooks/lyrics or avoid it entirely?`
      : `for songwriting i use ai more like a messy voice memo — chord mood + melody idea, then i rewrite lyrics and ditch the ai vocal.

anyone else or is that still a line you won't cross?`,

    generic: `producer/songwriter take: ai works as **sketch** (loop or song idea) if you finish like a human — beats need new drums, songs need real lyrics/vocals.

curious what others are actually doing in 2026.`,
  };

  return templates[intent] ?? templates.generic;
}

/** Commentaires r/makinghiphop — zéro vibe marketing. */
export function mhhCommentVariants() {
  return [
    {
      label: "Thread monétisation AI (r/aiMusic style)",
      searchQuery: "make money ai",
      text: draftSubtleComment({ intent: "monetization", subreddit: "aiMusic" }),
    },
    {
      label: "Thread Suno / AI beats (le plus de trafic)",
      searchQuery: "suno",
      text: `real talk i went down a rabbit hole comparing suno vs "producer" ai tools

suno wins if you want a **song**. if you want a loop in a specific bpm/key to build in fl, suno fights you

curious what others do — sample youtube? splice? or actually use ai for reference loops?`,
    },
    {
      label: "Thread BeatStars / type beats",
      searchQuery: "beatstars",
      text: `beatstars search used to eat my whole evening. lately i generate 3–4 loop **sketches** same key/bpm, pick one, redo drums myself

not saying it's better than real producers — just unblocks me when i'm staring at an empty playlist

what's your actual workflow when you need inspiration fast?`,
    },
    {
      label: "Thread FL Studio / workflow",
      searchQuery: "fl studio workflow",
      text: `weird workflow that's been working: ai loop as reference → edison chop → replace 100% of drums/808 → treat original as demo not final

feels like cheating until you realize you're still doing arrangement + mix by hand

anyone else use reference loops this way or is it a slippery slope lol`,
    },
    {
      label: "Thread writer's block",
      searchQuery: "writers block beat",
      text: `when i'm blocked i set a timer: 15 min to make 3 ugly loops. permission to trash all of them

usually #2 is developable once i swap drums. the pressure of "finish something" was the actual problem

how do you unstick without doom-scrolling beatstars?`,
    },
  ];
}

/** Commentaires r/trapproduction. */
export function trapProductionComment(loop) {
  return {
    searchQuery: "type beat",
    text: `for trap sketches i've been locking bpm first (${loop.bpm ?? 140}) then generating variations on a seed — same pocket, different top line

still replace hi-hats and 808 every time. ai part is just "idea #2 when idea #1 sucks"

do you guys start melodic or drums first? always a debate in my head`,
  };
}

/** Posts X/Twitter bonus pour même session. */
export function twitterHotTake(loop) {
  const url = loopUrl(loop.id, "twitter_hook");
  return `hot take: AI beats aren't the problem — producers who ship them unmixed are

i use loops as 2-min sketches then redo drums in FL. here's a raw ${loop.bpm ?? 90}bpm one before i touched it 👇

${url}

wrong?`;
}

export function launchPlaybook() {
  const now = new Date();
  const utcH = now.getUTCHours();
  const estH = (utcH - 4 + 24) % 24;
  const window =
    estH >= 11 && estH <= 22
      ? "🟢 Fenêtre US active — poster dans les 30 min"
      : "🟡 Audience US faible — priorise commentaires sur posts récents (<2h)";

  return {
    window,
    estHour: estH,
    order: [
      "1. r/aiMusic — beats + **mode chanson** (discussion)",
      "2. r/Songwriting — melody/lyrics sketches (pas type beat)",
      "3. r/SideProject / r/musicproduction / r/composer — rotation hebdo",
      "4. Commenter 3–5 threads (prod, songwriting, AI — reponses subtiles)",
      "5. Megathread r/aiMusic — lien seulement si demande",
      "6. Repondre a chaque commentaire sous tes posts (<30 min)",
      "7. r/Typebeats [FREE] — manuel uniquement",
    ],
    rules: [
      "Fondateur > marketing : story perso, questions honnêtes",
      "Posts auto = discussion / questions — jamais [FREE] beat en cron",
      "r/aiMusic feed = pas de lien ; lien → megathread épinglé",
      "Ratio 9:1 — 9 commentaires utiles pour 1 post promo",
      "Répondre vite = algorithme Reddit boost",
      "Beats → r/Typebeats en manuel seulement",
    ],
  };
}
