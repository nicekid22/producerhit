/**
 * YouTube metadata for trend remix landscape uploads (no #Shorts).
 */
import { fillTemplate, pickAbVariant } from "./youtubeAbTesting.ts";
import { homeUrlForChannel } from "./youtubeChannelProfiles.ts";

const META_LINE =
  /^\[|\b(do not copy|copyright|original theme|reimagine .+ energy|new words, same emotion)\b/i;

function cleanLyricsForDisplay(raw: string | undefined): string {
  const lines = String(raw ?? "")
    .split(/\r?\n/)
    .map((l) => l.replace(/^["']|["']$/g, "").trim())
    .filter((l) => l.length > 0 && !META_LINE.test(l));
  const text = lines.join("\n").trim();
  return text.length >= 24 ? text : "";
}

function splitAtWords(text: string, maxLen = 42): string[] {
  const words = String(text ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return [];
  const out: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > maxLen && cur) {
      out.push(cur);
      cur = w;
    } else {
      cur = next;
    }
  }
  if (cur) out.push(cur);
  return out;
}

function expandThemeToLines(lyricsTheme: string): string[] {
  return String(lyricsTheme ?? "")
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 6)
    .flatMap((s) => splitAtWords(s, 42));
}

function dedupeLines(lines: string[]): string[] {
  const seen = new Set<string>();
  return lines.filter((line) => {
    const key = line.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function lyricsExcerptForDescription(input: { lyrics?: string; lyricsTheme?: string; maxLines?: number }): string {
  let lines: string[] = [];
  const cleaned = cleanLyricsForDisplay(input.lyrics);
  if (cleaned) lines = cleaned.split(/\r?\n/).flatMap((l) => splitAtWords(l, 42));
  if (lines.length < 5 && input.lyricsTheme) {
    lines = dedupeLines([...lines, ...expandThemeToLines(input.lyricsTheme)]);
  }
  lines = dedupeLines(lines).filter((l) => !l.includes("producerhit.com") && !l.startsWith("♪"));
  if (!lines.length) return "";
  return lines.slice(0, input.maxLines ?? 3).map((l) => `• ${l}`).join("\n");
}

const AI_DISCLOSURE =
  "AI-generated remix inspired by trending music. Original lyrics & production. Not an official release.";

type TitleVariant = { id: string; template: string; vars: Record<string, string> };

function titleVariants(originalTitle: string, remixGenre: string, artist: string): TitleVariant[] {
  const t = originalTitle.trim().slice(0, 38);
  const g = remixGenre.trim().slice(0, 28);
  const a = artist.trim().slice(0, 28);
  return [
    { id: "A", template: "{artist} - {title} ({genre} AI Remix) | Full Song", vars: { title: t, genre: g, artist: a } },
    { id: "B", template: "{title} {genre} Remix — {artist} AI Cover (Full Version)", vars: { title: t, genre: g, artist: a } },
    { id: "C", template: "{title} but {genre} | {artist} AI Remix 2026", vars: { title: t, genre: g, artist: a } },
    { id: "D", template: "{artist} {title} {genre} AI Cover Remix — Listen Free", vars: { title: t, genre: g, artist: a } },
  ];
}

function buildKeywordLine(keywords: string[]): string {
  const list = keywords.slice(0, 8).map((k) => `#${String(k).replace(/\s+/g, "")}`);
  return [...new Set(["#AIMusic", "#AIRemix", "#MusicRemix", ...list])].slice(0, 10).join(" ");
}

function buildSearchHook(searchQueries: string[], trendKeywords: string[]): string {
  const merged = [...searchQueries, ...trendKeywords].map((s) => String(s).trim()).filter(Boolean);
  const unique = [...new Set(merged)].slice(0, 5);
  if (!unique.length) return "";
  return `\n\n🔎 People also search: ${unique.join(" · ")}`;
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
  searchQueries?: string[];
  bpm?: number | null;
  key?: string;
  lyrics?: string;
  lyricsTheme?: string;
}): TrendRemixUploadMetadata {
  const homeUrl = homeUrlForChannel(input.accountId);
  const titlePool = titleVariants(input.originalTitle, input.remixGenre, input.originalArtist);
  const picked = pickAbVariant(input.loopId, `trend_title:${input.accountId}`, titlePool);
  const title = fillTemplate(picked.template, picked.vars).slice(0, 100);

  const meta = [input.bpm ? `${input.bpm} BPM` : null, input.key || null, input.remixGenre]
    .filter(Boolean)
    .join(" · ");
  const hashtags = buildKeywordLine([...(input.searchQueries ?? []), ...(input.trendKeywords ?? [])]);
  const searchHook = buildSearchHook(input.searchQueries ?? [], input.trendKeywords ?? []);
  const lyricExcerpt = lyricsExcerptForDescription({
    lyrics: input.lyrics,
    lyricsTheme: input.lyricsTheme,
    maxLines: 3,
  });
  const lyricBlock = lyricExcerpt
    ? `\n\n📝 Lyrics preview:\n${lyricExcerpt}\n\n📖 Full lyrics + stems on the player card:`
    : "\n\n🎧 Listen to the full track (free):";

  const description = [
    `🎵 ${input.originalArtist} — "${input.originalTitle}" reimagined as a ${input.remixGenre} AI remix (full song).`,
    "New AI vocals & production. Not an official release.",
    meta ? `\n${meta}` : "",
    searchHook,
    lyricBlock,
    input.shareUrl,
    "\n\n✨ Create your own AI remix in seconds:",
    homeUrl,
    `\n\n${hashtags}`,
    `\n\n${AI_DISCLOSURE}`,
  ]
    .join("")
    .slice(0, 4900);

  const tags = [
    input.originalTitle.toLowerCase(),
    input.originalArtist.toLowerCase(),
    `${input.originalTitle.toLowerCase()} remix`,
    `${input.originalArtist.toLowerCase()} ai cover`,
    input.remixGenre.toLowerCase(),
    "ai remix",
    "ai cover",
    "full song",
    "producerhit",
    ...(input.searchQueries ?? []).slice(0, 3),
    ...(input.trendKeywords ?? []).slice(0, 3),
  ]
    .map((t) => String(t).trim().toLowerCase())
    .filter(Boolean);

  return {
    title,
    description,
    tags: [...new Set(tags)].slice(0, 15),
    ab: { account: input.accountId, titleVariant: picked.id, descVariant: "trend" },
    displayTitle: input.displayTitle,
  };
}
