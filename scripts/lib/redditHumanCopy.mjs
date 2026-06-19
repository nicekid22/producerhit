/**
 * Copy Reddit « humain » — hooks, curiosité, questions (expert growth / prod music).
 */

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

/** Beat le plus « scroll-stopping » pour Reddit hip-hop. */
export function pickEngagementLoop(loops) {
  const scored = loops.map((l) => {
    const hay = `${l.name} ${l.genre}`.toLowerCase();
    let score = 0;
    if (/terror|plugg|hyperrage|drill|phonk|miami|bollywood|ndombolo|trap/i.test(hay)) score += 4;
    if (l.bpm && l.bpm < 85) score += 2;
    if (l.genre && l.genre !== "Auto") score += 2;
    if (/chanson|voix|français|celtique|baroque/i.test(hay)) score -= 5;
    return { loop: l, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.loop ?? loops[0];
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

/** Self-post r/SideProject — curiosité fondateur, pas un ad beat. */
export function sideProjectPost(loop) {
  const demo = loopUrl(loop.id, "sideproject_demo");
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
- seed variations → same mood, new melody (like rerolling a idea without starting over)
- export mp3 → I redo drums, 808, mix manually. AI = sketch pad only.

Solo dev. Free tier ~10 gens/month. Already seeing random producers remix public loops which is wild.

**Demo loop** (raw AI output, not mixed): ${demo}

**Would love brutal feedback:**
1. Is this a fake problem or do you hit the same wall?
2. Landing page — clear or too "AI slop"?
3. What would make you actually try it once?

Not asking for upvotes — genuinely trying to figure out if I'm building for myself or for others. Stack questions welcome in comments.`,
    firstComment: `context: i'm the dev. happy to share traffic numbers / what surprised me in comments if anyone's curious`,
    timing: "SideProject répond bien le matin US (9h–12h EST) — bon pour clics dans les 2–6h",
  };
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

/** Commentaires r/makinghiphop — zéro vibe marketing. */
export function mhhCommentVariants() {
  return [
    {
      label: "Thread Suno / AI beats (le plus de trafic)",
      searchQuery: "suno",
      text: `real talk i went down a rabbit hole comparing suno vs "producer" ai tools

suno wins if you want a **song**. if you want a loop in a specific bpm/key to build in fl, suno fights you

i wrote up what i learned (not affiliate): ${utm("/suno-alternatives", "mhh_suno")}

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
      "1. r/Typebeats — post lien + commentaire #1 immédiat (roast me)",
      "2. r/makinghiphop — commenter thread chaud Suno/BeatStars (pas de post beat)",
      "3. r/SideProject — self-post fondateur (curiosité → site)",
      "4. Répondre à CHAQUE commentaire sous tes posts (<30 min)",
      "5. X — hot take + lien beat",
    ],
    rules: [
      "Répondre vite = algorithme Reddit boost",
      "Poser une question à la fin de chaque post",
      "Jamais « check out my tool » sans contexte story",
      "Upvote 5 posts d'autres avant de poster (karma naturel)",
    ],
  };
}
