export type TrackKind = "song" | "type_beat" | "instrumental";

export function inferTrackKind(stemsUrl: unknown, name: string): TrackKind {
  const ace =
    stemsUrl && typeof stemsUrl === "object" ? (stemsUrl as Record<string, unknown>).ace : null;
  if (ace && typeof ace === "object") {
    const a = ace as Record<string, unknown>;
    if (a.isSong === true || a.isSong === "true") return "song";
    if (a.instrumental === true || a.instrumental === "true") return "instrumental";
    const mode = typeof a.mode === "string" ? a.mode.toLowerCase() : "";
    if (mode === "song") return "song";
    if (mode === "beat") {
      return a.instrumental === true || a.instrumental === "true" ? "instrumental" : "type_beat";
    }
  }
  const n = name.trim();
  if (/\b(instrumental|instru)\b/i.test(n)) return "instrumental";
  if (/\btype beat\b/i.test(n)) return "type_beat";
  if (/\bsong\b/i.test(n)) return "song";
  return "song";
}

export function buildYouTubeTitle(input: {
  name: string;
  genre: string;
  bpm: number | null;
  kind: TrackKind;
}): string {
  const { name, genre, bpm, kind } = input;
  const bpmSuffix = bpm && bpm > 0 ? ` ${bpm} BPM` : "";
  const quoted = `"${name}"`;

  if (kind === "song") {
    return `${quoted} | ${genre} AI Song (Vocals) #Shorts`.slice(0, 100);
  }
  if (kind === "instrumental") {
    return `${genre} Instrumental ${quoted}${bpmSuffix} | AI Music #Shorts`.slice(0, 100);
  }
  return `[FREE] ${genre} Type Beat ${quoted}${bpmSuffix} #Shorts`.slice(0, 100);
}

export function buildYouTubeDescription(input: {
  name: string;
  genre: string;
  bpm: number | null;
  key: string;
  kind: TrackKind;
  shareUrl: string;
}): string {
  const { name, genre, bpm, key, kind, shareUrl } = input;
  const hook =
    kind === "song"
      ? `New ${genre} AI song with vocals — "${name}".`
      : kind === "instrumental"
        ? `${genre} instrumental — "${name}".`
        : `Free ${genre} type beat — "${name}".`;
  const meta = [bpm ? `${bpm} BPM` : null, key || null].filter(Boolean).join(" · ");
  const homeUrl = "https://www.producerhit.com?utm_source=youtube&utm_medium=social&utm_campaign=shorts";
  const tags =
    kind === "song"
      ? "#Shorts #AIMusic #AISong #NewMusic #ProducerHit"
      : kind === "instrumental"
        ? "#Shorts #Instrumental #TypeBeat #BeatMaker #ProducerHit"
        : "#Shorts #TypeBeat #FreeBeat #BeatMaker #ProducerHit";

  return [
    hook,
    meta ? `\n${meta}` : "",
    "\n\n🎧 Listen to the full track (free):",
    shareUrl,
    "\n\n✨ Create your own beats & songs with AI:",
    homeUrl,
    `\n\n${tags}`,
  ]
    .join("")
    .slice(0, 4900);
}

export function buildYouTubeTags(input: { genre: string; kind: TrackKind }): string[] {
  const genreSlug = input.genre.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
  const kindTags =
    input.kind === "song"
      ? ["shorts", "ai song", "ai music", "vocals", "new music"]
      : input.kind === "instrumental"
        ? ["shorts", "instrumental", "type beat", "beat", "ai music"]
        : ["shorts", "type beat", "free type beat", "beat", "ai beat"];
  return [...new Set([...kindTags, "producerhit", genreSlug].filter(Boolean))].slice(0, 12);
}

export function buildYouTubeHashtags(kind: TrackKind, genre: string): string[] {
  const slug = genre.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
  const genreTag = slug ? `#${slug.slice(0, 24)}` : "#newmusic";
  if (kind === "song") return ["#shorts", "#aimusic", "#aisong", "#producerhit", genreTag];
  if (kind === "instrumental") return ["#shorts", "#instrumental", "#typebeat", "#producerhit", genreTag];
  return ["#shorts", "#typebeat", "#freebeat", "#producerhit", genreTag];
}

/** Long-form YouTube (16:9) — pas de #Shorts. */
export function buildYouTubeLongTitle(input: {
  name: string;
  genre: string;
  bpm: number | null;
  kind: TrackKind;
}): string {
  const { name, genre, bpm, kind } = input;
  const bpmSuffix = bpm && bpm > 0 ? ` ${bpm} BPM` : "";
  const quoted = `"${name}"`;
  if (kind === "song") {
    return `${quoted} | ${genre} AI Song (Full Track)`.slice(0, 100);
  }
  if (kind === "instrumental") {
    return `${genre} Instrumental ${quoted}${bpmSuffix} | AI Music`.slice(0, 100);
  }
  return `[FREE] ${genre} Type Beat ${quoted}${bpmSuffix} | AI Beat`.slice(0, 100);
}

/** Shorts preview length (max 59 s for Shorts shelf). */
export function youtubePreviewSec(): number {
  const raw = Number(Deno.env.get("YOUTUBE_PREVIEW_SEC") ?? "45");
  return Math.max(15, Math.min(59, Number.isFinite(raw) ? Math.floor(raw) : 45));
}

/** Min delay between uploads on the same channel (default 3 h). */
export function youtubeMinIntervalSec(): number {
  const raw = Number(Deno.env.get("YOUTUBE_MIN_INTERVAL_SEC") ?? "10800");
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 10800;
}

/** Min delay between any upload across all channels (default 1 h). */
export function youtubeGlobalMinIntervalSec(): number {
  const raw = Number(Deno.env.get("YOUTUBE_GLOBAL_MIN_INTERVAL_SEC") ?? "3600");
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 3600;
}

/** Hard cap uploads per channel per UTC day (default 7 = 5 Shorts + 2 long). */
export function youtubeMaxDailyPerAccount(): number {
  const raw = Number(Deno.env.get("YOUTUBE_MAX_DAILY_PER_ACCOUNT") ?? "7");
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 7;
}

export function socialPublishQueueBatch(): number {
  const raw = Number(Deno.env.get("SOCIAL_PUBLISH_QUEUE_BATCH") ?? "1");
  return Number.isFinite(raw) && raw > 0 ? Math.min(5, Math.floor(raw)) : 1;
}

export type ViralMeta = {
  series: string;
  episodeNum?: number;
  conceptId?: string;
  hookOpen?: string;
  hookReveal?: string;
  hookCta?: string;
  sourceText?: string;
  aceCaption?: string;
  preferredAccount?: string;
  revealPrefix?: string;
};

export function extractViralMeta(stemsUrl: unknown): ViralMeta | null {
  if (!stemsUrl || typeof stemsUrl !== "object") return null;
  const ace = (stemsUrl as Record<string, unknown>).ace;
  if (!ace || typeof ace !== "object") return null;
  const viral = (ace as Record<string, unknown>).viral;
  if (!viral || typeof viral !== "object") return null;
  const v = viral as Record<string, unknown>;
  if (typeof v.series !== "string") return null;
  return {
    series: v.series,
    episodeNum: typeof v.episodeNum === "number" ? v.episodeNum : undefined,
    conceptId: typeof v.conceptId === "string" ? v.conceptId : undefined,
    hookOpen: typeof v.hookOpen === "string" ? v.hookOpen : undefined,
    hookReveal: typeof v.hookReveal === "string" ? v.hookReveal : undefined,
    hookCta: typeof v.hookCta === "string" ? v.hookCta : undefined,
    sourceText: typeof v.sourceText === "string" ? v.sourceText : undefined,
    aceCaption: typeof v.aceCaption === "string" ? v.aceCaption : undefined,
    revealPrefix: typeof v.revealPrefix === "string" ? v.revealPrefix : undefined,
    preferredAccount: typeof v.preferredAccount === "string" ? v.preferredAccount : undefined,
  };
}

export type TrendRemixMeta = {
  kind?: string;
  planId?: string;
  catalogId?: string;
  originalTitle: string;
  originalArtist: string;
  trendKeywords?: string[];
  searchQueries?: string[];
  remixGenre: string;
  preferredAccount?: string;
  displayTitle?: string;
  videoFormat?: string;
  lyricsTheme?: string;
};

export function extractTrendRemixMeta(stemsUrl: unknown): TrendRemixMeta | null {
  if (!stemsUrl || typeof stemsUrl !== "object") return null;
  const ace = (stemsUrl as Record<string, unknown>).ace;
  if (!ace || typeof ace !== "object") return null;
  const tr = (ace as Record<string, unknown>).trendRemix;
  if (!tr || typeof tr !== "object") return null;
  const t = tr as Record<string, unknown>;
  if (typeof t.originalTitle !== "string") return null;
  return {
    kind: typeof t.kind === "string" ? t.kind : undefined,
    planId: typeof t.planId === "string" ? t.planId : undefined,
    catalogId: typeof t.catalogId === "string" ? t.catalogId : undefined,
    originalTitle: t.originalTitle,
    originalArtist: typeof t.originalArtist === "string" ? t.originalArtist : "",
    trendKeywords: Array.isArray(t.trendKeywords) ? (t.trendKeywords as string[]) : [],
    searchQueries: Array.isArray(t.searchQueries) ? (t.searchQueries as string[]) : [],
    remixGenre: typeof t.remixGenre === "string" ? t.remixGenre : "AI Remix",
    preferredAccount: typeof t.preferredAccount === "string" ? t.preferredAccount : undefined,
    displayTitle: typeof t.displayTitle === "string" ? t.displayTitle : undefined,
    videoFormat: typeof t.videoFormat === "string" ? t.videoFormat : undefined,
    lyricsTheme: typeof t.lyricsTheme === "string" ? t.lyricsTheme : undefined,
  };
}

/** Full-length trend remix render (landscape, not Shorts). */
export function youtubeTrendRemixMaxSec(): number {
  const raw = Number(Deno.env.get("TREND_REMIX_MAX_SEC") ?? Deno.env.get("TREND_REMIX_DURATION_SEC") ?? "120");
  return Math.max(60, Math.min(180, Number.isFinite(raw) ? Math.floor(raw) : 120));
}

export function buildViralYouTubeTitle(input: { viral: ViralMeta; name: string }): string {
  const ep = input.viral.episodeNum ? ` Ep.${input.viral.episodeNum}` : "";
  const name = input.name.trim().slice(0, 48);
  if (input.viral.series === "comment_to_song") {
    return `I turned a comment into a song${ep} #Shorts`.slice(0, 100);
  }
  if (input.viral.series === "absurd_to_song") {
    return `This shouldn't be a song — ${name} #Shorts`.slice(0, 100);
  }
  return `Guess the AI music prompt${ep} #Shorts`.slice(0, 100);
}

export function buildViralYouTubeDescription(input: { viral: ViralMeta; shareUrl: string }): string {
  const homeUrl = "https://www.producerhit.com?utm_source=youtube&utm_medium=social&utm_campaign=viral_shorts";
  const source = (input.viral.sourceText ?? "").trim();
  const cta = (input.viral.hookCta ?? "What would YOU turn into a song?").trim();
  return [
    input.viral.hookOpen ?? "This song didn't exist 20 seconds ago.",
    source ? `\n\n"${source}"` : "",
    "\n\n🎧 Full track:",
    input.shareUrl,
    "\n\n✨ Turn your idea into music:",
    homeUrl,
    `\n\n${cta}`,
    "\n\n#Shorts #AIMusic #ProducerHit #Viral",
  ]
    .join("")
    .slice(0, 4900);
}

/** Viral Shorts render length (12–30 s). */
export function youtubeViralPreviewSec(): number {
  const raw = Number(Deno.env.get("YOUTUBE_VIRAL_PREVIEW_SEC") ?? "18");
  return Math.max(12, Math.min(30, Number.isFinite(raw) ? Math.floor(raw) : 18));
}
