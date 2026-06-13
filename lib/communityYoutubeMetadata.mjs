/**
 * Community YouTube SEO — titres, descriptions, tags optimisés algorithme 2026.
 */
import { lyricExcerptForDescription } from "./communityYoutubeTitle.mjs";
import { isCommunityYoutubeAccount } from "./communityYoutubeAccounts.mjs";

const SITE = "https://www.producerhit.com";
const AI_DISCLOSURE = "AI-generated music · Created on ProducerHit.";

function hashSeed(input) {
  let h = 2166136261;
  const s = String(input ?? "x");
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickVariant(seed, experiment, variants) {
  const idx = hashSeed(`${seed}:${experiment}`) % variants.length;
  return variants[idx];
}

function fillTemplate(template, vars) {
  return template
    .replace(/\{(\w+)\}/g, (_, key) => {
      const v = vars[key];
      if (v === null || v === undefined || v === "") return "";
      return String(v);
    })
    .replace(/\s+/g, " ")
    .trim();
}

function bpmSuffix(bpm) {
  return bpm && bpm > 0 ? ` ${bpm} BPM` : "";
}

function genreSlug(genre) {
  return String(genre ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 24);
}

function shareUrl(loopId, account) {
  const url = new URL(`${SITE}/loop/${encodeURIComponent(loopId)}`);
  url.searchParams.set("utm_source", "youtube");
  url.searchParams.set("utm_medium", account.startsWith("remix") ? "remix" : "shorts");
  url.searchParams.set("utm_campaign", account);
  return url.toString();
}

function homeUrl(account) {
  return `${SITE}?utm_source=youtube&utm_medium=channel&utm_campaign=${account}`;
}

function shortTitleVariants(account, kind) {
  const id = account.toLowerCase();

  if (id === "vibez") {
    return [
      '"{name}" — {genre} AI Song 🎧 #Shorts',
      "This {genre} AI song hits different #Shorts",
      "{genre} vibes · AI song with vocals #Shorts",
      "POV: you found a {genre} song that slaps #Shorts",
    ];
  }
  if (id === "market") {
    return [
      '[FREE] {genre} Type Beat "{name}"{bpm} #Shorts',
      "Would you rap on this {genre} beat? 🔥 #Shorts",
      "{genre} type beat — free to listen #Shorts",
      "Producers: this {genre} beat goes crazy{bpm} #Shorts",
    ];
  }
  if (id === "lowdey") {
    return [
      '"{name}" — {genre} AI track #Shorts',
      "Community drop · {genre} AI music #Shorts",
      "This {genre} song wasn't here yesterday #Shorts",
      "{genre} AI song · full vocals #Shorts",
    ];
  }
  if (id === "producerhitai") {
    return [
      "AI made this {genre} song in seconds 🎤 #Shorts",
      '"{name}" | {genre} AI Song (vocals) #Shorts',
      "Text to {genre} song — listen #Shorts",
      "Full AI vocals · {genre} song #Shorts",
    ];
  }
  if (id === "beatmakerunion") {
    return [
      '[FREE] {genre} Type Beat · "{name}"{bpm} #Shorts',
      "Beatmakers — would you use this {genre} beat? #Shorts",
      "{genre} AI beat · no DAW needed #Shorts",
      "Session skipped · {genre} type beat{bpm} #Shorts",
    ];
  }

  if (kind === "type_beat") {
    return ['[FREE] {genre} Type Beat "{name}"{bpm} #Shorts', "{genre} AI beat — free #Shorts"];
  }
  return ['"{name}" — {genre} AI Song #Shorts', "New {genre} AI music #Shorts"];
}

function longTitleVariants(account, kind) {
  if (kind === "type_beat" || kind === "instrumental") {
    return [
      "[FREE] {genre} Type Beat · {name} (Full){bpm} | AI Beat",
      "{genre} Type Beat — {name} · Full Track{bpm}",
      "Free {genre} Beat · {name} | AI Music Production",
    ];
  }
  return [
    '"{name}" | Full {genre} AI Song · Vocals & Lyrics',
    "{genre} AI Song — {name} (Complete Track)",
    "{name} · Complete {genre} AI Song | ProducerHit Community",
  ];
}

function hookLine(account, kind, genre, name) {
  const g = genre || "AI";
  const n = name ? `"${name}"` : "this track";
  const id = account.toLowerCase();

  if (id === "vibez") {
    return kind === "type_beat"
      ? `Community ${g} beat — ${n}. Would you rap on this?`
      : `${g} AI song with full vocals — ${n}. From the ProducerHit community feed.`;
  }
  if (id === "market" || id === "beatmakerunion") {
    return kind === "type_beat"
      ? `Free ${g} type beat — ${n}. Made with AI in minutes, not hours in the studio.`
      : `${g} AI track — ${n}. Listen free, then make your own.`;
  }
  if (id === "producerhitai") {
    return `Full AI song with vocals — ${g} · ${n}. Generated on ProducerHit.`;
  }
  if (kind === "type_beat") return `Free ${g} type beat — ${n}. Tag a rapper who needs this.`;
  return `New ${g} AI song — ${n}. Full vocals, community-made on ProducerHit.`;
}

function commentCta(account, kind) {
  const id = account.toLowerCase();
  if (id === "market" || id === "beatmakerunion") {
    return kind === "type_beat"
      ? "💬 Comment the artist you'd send this beat to 👇"
      : "💬 Would you rap or sing on this? Comment below 👇";
  }
  if (id === "vibez") return "💬 Comment 🔥 if you'd add this to your playlist 👇";
  if (id === "lowdey") return "💬 What genre does this feel like to you? Guess below 👇";
  return "💬 Comment if you'd make something like this on ProducerHit 👇";
}

function studioCta(account) {
  const id = account.toLowerCase();
  if (id === "market" || id === "beatmakerunion") {
    return "🎹 Make your own beats in 30 seconds (free to start):";
  }
  return "✨ Create your own AI songs & beats — free to start:";
}

function hashtagLine(account, genre, format) {
  const slug = genreSlug(genre);
  const genreTag = slug ? `#${slug}` : "#AIMusic";
  const base = ["#AIMusic", "#ProducerHit", genreTag];
  if (format === "short") base.unshift("#Shorts");
  if (account === "market" || account === "beatmakerunion") base.push("#TypeBeat", "#FreeBeat");
  if (account === "vibez") base.push("#Vibes", "#NewMusic");
  return [...new Set(base)].slice(0, 6).join(" ");
}

function buildTags(account, genre, kind, format) {
  const slug = genreSlug(genre);
  const tags = [
    format === "short" ? "shorts" : "full song",
    "ai music",
    "producerhit",
    slug,
    String(genre ?? "").trim().toLowerCase(),
  ];
  if (kind === "type_beat") tags.push("type beat", "free type beat", "hip hop beat");
  if (kind === "song") tags.push("ai song", "ai vocals", "new music");
  if (account === "vibez") tags.push("ai vibes", "mood music");
  if (account === "market") tags.push("beat maker", "instrumental");
  return [...new Set(tags.filter(Boolean))].slice(0, 12);
}

export function buildCommunityYouTubeMetadata(input) {
  const {
    loopId,
    account,
    displayTitle,
    genre = "AI",
    bpm = null,
    key = "",
    kind = "song",
    format = "short",
    lyrics = "",
    slot = 0,
  } = input;

  const name = String(displayTitle ?? "").trim().slice(0, 52);
  const g = String(genre ?? "AI").trim();
  const metaLine = [bpm ? `${bpm} BPM` : null, key || null, g].filter(Boolean).join(" · ");
  const vars = { name, genre: g, bpm: bpmSuffix(bpm), key: key || "" };

  const titlePool = format === "long" ? longTitleVariants(account, kind) : shortTitleVariants(account, kind);
  const titleTemplate = pickVariant(
    loopId,
    `title:${account}:${format}:${slot}`,
    titlePool.map((t, i) => ({ id: String(i), template: t })),
  ).template;
  const title = fillTemplate(titleTemplate, vars).slice(0, 100);

  const lyricBlock = lyricExcerptForDescription(lyrics, { maxLines: 4, loopId });
  const trackUrl = shareUrl(loopId, account);
  const home = homeUrl(account);

  const description = [
    hookLine(account, kind, g, name),
    lyricBlock ? `\n\n📝 Lyrics:\n${lyricBlock}` : "",
    metaLine ? `\n\n🎚 ${metaLine}` : "",
    "\n\n🎧 Full track (free):\n",
    trackUrl,
    `\n\n${studioCta(account)}\n`,
    home,
    `\n\n${commentCta(account, kind)}`,
    `\n\n${hashtagLine(account, g, format)}`,
    `\n\n${AI_DISCLOSURE}`,
  ]
    .join("")
    .slice(0, 4900);

  return {
    title,
    description,
    tags: buildTags(account, g, kind, format),
    shareUrl: trackUrl,
    homeUrl: home,
    hook: hookLine(account, kind, g, name),
    hashtags: hashtagLine(account, g, format),
  };
}

export function buildCommunityShareUrl(loopId, account) {
  return shareUrl(loopId, account);
}

export function isCommunityAccount(account) {
  return isCommunityYoutubeAccount(account);
}
