/**
 * YouTube metadata for trend remix landscape uploads (no #Shorts).
 */
import { fillTemplate, pickAbVariant } from "./youtubeAbTesting.mjs";
import { homeUrlForChannel } from "./youtubeChannelProfiles.mjs";

const AI_DISCLOSURE =
  "AI-generated remix inspired by trending music. Original lyrics & production. Not an official release.";

function titleVariants(originalTitle, remixGenre, artist) {
  const t = originalTitle.trim().slice(0, 42);
  const g = remixGenre.trim();
  const a = artist.trim().slice(0, 32);
  return [
    { id: "A", template: "{title} but {genre} | AI Remix" },
    { id: "B", template: "{artist} - {title} ({genre} AI Cover Remix)" },
    { id: "C", template: "{title} {genre} Version | AI Music Remix 2026" },
    { id: "D", template: "{title} AI Remix ({genre}) — Full Song" },
  ].map((v) => ({
    ...v,
    vars: { title: t, genre: g, artist: a },
  }));
}

function buildKeywordLine(keywords) {
  const list = (keywords ?? []).slice(0, 6).map((k) => `#${String(k).replace(/\s+/g, "")}`);
  return [...new Set(["#AIMusic", "#AIRemix", "#MusicRemix", ...list])].slice(0, 8).join(" ");
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
    bpm,
    key,
  } = input;

  const homeUrl = homeUrlForChannel(accountId);
  const titlePool = titleVariants(originalTitle, remixGenre, originalArtist);
  const picked = pickAbVariant(loopId, `trend_title:${accountId}`, titlePool);
  const title = fillTemplate(picked.template, picked.vars).slice(0, 100);

  const meta = [bpm ? `${bpm} BPM` : null, key || null, remixGenre].filter(Boolean).join(" · ");
  const hashtags = buildKeywordLine(trendKeywords);

  const description = [
    `${originalTitle} reimagined as a ${remixGenre} AI remix.`,
    `Inspired by ${originalArtist}. New vocals & production — not an official cover.`,
    meta ? `\n${meta}` : "",
    "\n\n🎧 Full track on ProducerHit:",
    shareUrl,
    "\n\n✨ Make your own AI remix in seconds:",
    homeUrl,
    `\n\n${hashtags}`,
    `\n\n${AI_DISCLOSURE}`,
  ]
    .join("")
    .slice(0, 4900);

  const tags = [
    "ai remix",
    "ai cover",
    remixGenre.toLowerCase(),
    originalTitle.toLowerCase().slice(0, 30),
    "producerhit",
    "ai music",
    "remix",
    ...(trendKeywords ?? []).slice(0, 3),
  ]
    .map((t) => String(t).trim().toLowerCase())
    .filter(Boolean);

  return {
    title,
    description,
    tags: [...new Set(tags)].slice(0, 12),
    ab: { account: accountId, titleVariant: picked.id, descVariant: "trend" },
    displayTitle,
  };
}
