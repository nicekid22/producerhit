/**
 * YouTube metadata for trend remix landscape uploads (no #Shorts).
 */
import { fillTemplate, pickAbVariant } from "./youtubeAbTesting.ts";
import { homeUrlForChannel } from "./youtubeChannelProfiles.ts";

const AI_DISCLOSURE =
  "AI-generated remix inspired by trending music. Original lyrics & production. Not an official release.";

type TitleVariant = { id: string; template: string; vars: Record<string, string> };

function titleVariants(originalTitle: string, remixGenre: string, artist: string): TitleVariant[] {
  const t = originalTitle.trim().slice(0, 42);
  const g = remixGenre.trim();
  const a = artist.trim().slice(0, 32);
  return [
    { id: "A", template: "{title} but {genre} | AI Remix", vars: { title: t, genre: g, artist: a } },
    { id: "B", template: "{artist} - {title} ({genre} AI Cover Remix)", vars: { title: t, genre: g, artist: a } },
    { id: "C", template: "{title} {genre} Version | AI Music Remix 2026", vars: { title: t, genre: g, artist: a } },
    { id: "D", template: "{title} AI Remix ({genre}) — Full Song", vars: { title: t, genre: g, artist: a } },
  ];
}

function buildKeywordLine(keywords: string[]): string {
  const list = keywords.slice(0, 6).map((k) => `#${String(k).replace(/\s+/g, "")}`);
  return [...new Set(["#AIMusic", "#AIRemix", "#MusicRemix", ...list])].slice(0, 8).join(" ");
}

export type TrendRemixUploadMetadata = {
  title: string;
  description: string;
  tags: string[];
  ab: { account: string; titleVariant: string; descVariant: string };
  displayTitle: string;
};

export function buildTrendRemixUploadMetadata(input: {
  loopId: string;
  originalTitle: string;
  originalArtist: string;
  remixGenre: string;
  displayTitle: string;
  shareUrl: string;
  accountId: string;
  trendKeywords?: string[];
  bpm?: number | null;
  key?: string;
}): TrendRemixUploadMetadata {
  const homeUrl = homeUrlForChannel(input.accountId);
  const titlePool = titleVariants(input.originalTitle, input.remixGenre, input.originalArtist);
  const picked = pickAbVariant(input.loopId, `trend_title:${input.accountId}`, titlePool);
  const title = fillTemplate(picked.template, picked.vars).slice(0, 100);

  const meta = [input.bpm ? `${input.bpm} BPM` : null, input.key || null, input.remixGenre]
    .filter(Boolean)
    .join(" · ");
  const hashtags = buildKeywordLine(input.trendKeywords ?? []);

  const description = [
    `${input.originalTitle} reimagined as a ${input.remixGenre} AI remix.`,
    `Inspired by ${input.originalArtist}. New vocals & production — not an official cover.`,
    meta ? `\n${meta}` : "",
    "\n\n🎧 Full track on ProducerHit:",
    input.shareUrl,
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
    input.remixGenre.toLowerCase(),
    input.originalTitle.toLowerCase().slice(0, 30),
    "producerhit",
    "ai music",
    "remix",
    ...(input.trendKeywords ?? []).slice(0, 3),
  ]
    .map((t) => String(t).trim().toLowerCase())
    .filter(Boolean);

  return {
    title,
    description,
    tags: [...new Set(tags)].slice(0, 12),
    ab: { account: input.accountId, titleVariant: picked.id, descVariant: "trend" },
    displayTitle: input.displayTitle,
  };
}
