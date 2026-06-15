/**
 * YouTube metadata for trend remix landscape uploads (no #Shorts).
 */
import { fillTemplate, pickAbVariant } from "./youtubeAbTesting.mjs";
import { homeUrlForChannel } from "./youtubeChannelProfiles.mjs";
import { lyricsExcerptForDescription } from "./youtubeTrendRemixLyrics.mjs";

const AI_DISCLOSURE =
  "AI-generated remix inspired by trending music. Original lyrics & production. Not an official release.";

function titleVariants(originalTitle, remixGenre, artist) {
  const t = originalTitle.trim().slice(0, 38);
  const g = remixGenre.trim().slice(0, 28);
  const a = artist.trim().slice(0, 28);
  return [
    { id: "A", template: "{artist} - {title} ({genre} AI Remix) | Full Song" },
    { id: "B", template: "{title} {genre} Remix — {artist} AI Cover (Full Version)" },
    { id: "C", template: "{title} but {genre} | {artist} AI Remix 2026" },
    { id: "D", template: "{artist} {title} {genre} AI Cover Remix — Listen Free" },
  ].map((v) => ({
    ...v,
    vars: { title: t, genre: g, artist: a },
  }));
}

function buildKeywordLine(keywords) {
  const list = (keywords ?? []).slice(0, 8).map((k) => `#${String(k).replace(/\s+/g, "")}`);
  return [...new Set(["#AIMusic", "#AIRemix", "#MusicRemix", ...list])].slice(0, 10).join(" ");
}

function buildSearchHook(searchQueries, trendKeywords) {
  const merged = [...(searchQueries ?? []), ...(trendKeywords ?? [])]
    .map((s) => String(s).trim())
    .filter(Boolean);
  const unique = [...new Set(merged)].slice(0, 5);
  if (!unique.length) return "";
  return `\n\n🔎 People also search: ${unique.join(" · ")}`;
}

export function buildTrendRemixUploadMetadata(input) {
  const {
    loopId,
    originalTitle,
    originalArtist,
    remixGenre,
    displayTitle,
    shareUrl,
    accountId,
    trendKeywords = [],
    searchQueries = [],
    bpm,
    key,
    lyrics,
    lyricsTheme,
  } = input;

  const homeUrl = homeUrlForChannel(accountId);
  const titlePool = titleVariants(originalTitle, remixGenre, originalArtist);
  const picked = pickAbVariant(loopId, `trend_title:${accountId}`, titlePool);
  const title = fillTemplate(picked.template, picked.vars).slice(0, 100);

  const meta = [bpm ? `${bpm} BPM` : null, key || null, remixGenre].filter(Boolean).join(" · ");
  const hashtags = buildKeywordLine([...searchQueries, ...trendKeywords]);
  const searchHook = buildSearchHook(searchQueries, trendKeywords);
  const lyricExcerpt = lyricsExcerptForDescription({ lyrics, lyricsTheme, maxLines: 3 });
  const lyricBlock = lyricExcerpt
    ? `\n\n📝 Lyrics preview:\n${lyricExcerpt}\n\n📖 Full lyrics + stems on the player card:`
    : "\n\n🎧 Listen to the full track (free):";

  const description = [
    `🎵 ${originalArtist} — "${originalTitle}" reimagined as a ${remixGenre} AI remix (full song).`,
    "New AI vocals & production. Not an official release.",
    meta ? `\n${meta}` : "",
    searchHook,
    lyricBlock,
    shareUrl,
    "\n\n✨ Create your own AI remix in seconds:",
    homeUrl,
    `\n\n${hashtags}`,
    `\n\n${AI_DISCLOSURE}`,
  ]
    .join("")
    .slice(0, 4900);

  const tags = [
    originalTitle.toLowerCase(),
    originalArtist.toLowerCase(),
    `${originalTitle.toLowerCase()} remix`,
    `${originalArtist.toLowerCase()} ai cover`,
    remixGenre.toLowerCase(),
    "ai remix",
    "ai cover",
    "full song",
    "producerhit",
    ...(searchQueries ?? []).slice(0, 3),
    ...(trendKeywords ?? []).slice(0, 3),
  ]
    .map((t) => String(t).trim().toLowerCase())
    .filter(Boolean);

  return {
    title,
    description,
    tags: [...new Set(tags)].slice(0, 15),
    ab: { account: accountId, titleVariant: picked.id, descVariant: "trend" },
    displayTitle,
  };
}
