/** Node mirror of supabase/functions/_shared/youtubeSocial.ts */

export function inferTrackKind(stemsUrl, name) {
  const ace = stemsUrl && typeof stemsUrl === "object" ? stemsUrl.ace : null;
  if (ace && typeof ace === "object") {
    if (ace.isSong === true || ace.isSong === "true") return "song";
    if (ace.instrumental === true || ace.instrumental === "true") return "instrumental";
    const mode = typeof ace.mode === "string" ? ace.mode.toLowerCase() : "";
    if (mode === "song") return "song";
    if (mode === "beat") {
      return ace.instrumental === true || ace.instrumental === "true" ? "instrumental" : "type_beat";
    }
  }
  const n = String(name ?? "").trim();
  if (/\b(instrumental|instru)\b/i.test(n)) return "instrumental";
  if (/\btype beat\b/i.test(n)) return "type_beat";
  if (/\bsong\b/i.test(n)) return "song";
  return "song";
}

export function buildYouTubeTitle({ name, genre, bpm, kind }) {
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

export function buildYouTubeDescription({ name, genre, bpm, key, kind, shareUrl }) {
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

export function extractViralMeta(stemsUrl) {
  if (!stemsUrl || typeof stemsUrl !== "object") return null;
  const ace = stemsUrl.ace;
  if (!ace || typeof ace !== "object") return null;
  const viral = ace.viral;
  if (!viral || typeof viral !== "object") return null;
  if (typeof viral.series !== "string") return null;
  return viral;
}

export function extractTrendRemixMeta(stemsUrl) {
  if (!stemsUrl || typeof stemsUrl !== "object") return null;
  const ace = stemsUrl.ace;
  if (!ace || typeof ace !== "object") return null;
  const tr = ace.trendRemix;
  if (!tr || typeof tr !== "object") return null;
  if (typeof tr.originalTitle !== "string") return null;
  return tr;
}

/** Parse "Title — Melodic Trap AI Remix" → Melodic Trap */
export function parseRemixGenreFromLoopName(name) {
  const m = String(name ?? "").match(/\s—\s(.+?)\sAI Remix/i);
  return m?.[1]?.trim() ?? "";
}

/** Genre shown on video — always from the generated loop, not stale catalog defaults. */
export function resolveTrendRemixDisplayGenre(loop) {
  const fromColumn = String(loop?.genre ?? "").trim();
  if (fromColumn) return fromColumn;

  const fromName = parseRemixGenreFromLoopName(loop?.name);
  if (fromName) return fromName;

  const meta = extractTrendRemixMeta(loop?.stems_url);
  const fromMeta = String(meta?.remixGenre ?? "").trim();
  if (fromMeta) return fromMeta;

  return "AI Remix";
}

export function buildViralYouTubeTitle({ viral, name }) {
  const ep = viral.episodeNum ? ` Ep.${viral.episodeNum}` : "";
  const shortName = String(name ?? "").trim().slice(0, 48);
  if (viral.series === "comment_to_song") return `I turned a comment into a song${ep} #Shorts`.slice(0, 100);
  if (viral.series === "absurd_to_song") return `This shouldn't be a song — ${shortName} #Shorts`.slice(0, 100);
  return `Guess the AI music prompt${ep} #Shorts`.slice(0, 100);
}

export function buildViralYouTubeDescription({ viral, shareUrl }) {
  const homeUrl = "https://www.producerhit.com?utm_source=youtube&utm_medium=social&utm_campaign=viral_shorts";
  const source = String(viral.sourceText ?? "").trim();
  const cta = String(viral.hookCta ?? "What would YOU turn into a song?").trim();
  return [
    viral.hookOpen ?? "This song didn't exist 20 seconds ago.",
    source ? `\n\n"${source}"` : "",
    "\n\n🎧 Full track:",
    shareUrl,
    "\n\n✨ Turn your idea into music:",
    homeUrl,
    `\n\n${cta}`,
    "\n\n#Shorts #AIMusic #ProducerHit #Viral",
  ]
    .join("")
    .slice(0, 4900);
}

export function youtubeViralPreviewSec() {
  const raw = Number(process.env.YOUTUBE_VIRAL_PREVIEW_SEC ?? "18");
  return Math.max(12, Math.min(30, Number.isFinite(raw) ? Math.floor(raw) : 18));
}

export function buildYouTubeTags({ genre, kind }) {
  const genreSlug = String(genre ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
  const kindTags =
    kind === "song"
      ? ["shorts", "ai song", "ai music", "vocals", "new music"]
      : kind === "instrumental"
        ? ["shorts", "instrumental", "type beat", "beat", "ai music"]
        : ["shorts", "type beat", "free type beat", "beat", "ai beat"];
  return [...new Set([...kindTags, "producerhit", genreSlug].filter(Boolean))].slice(0, 12);
}

/** Long-form YouTube (16:9 full song) — pas de #Shorts. */
export function buildYouTubeLongTitle({ name, genre, bpm, kind }) {
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
