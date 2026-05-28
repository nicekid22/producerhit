import type { Loop } from "@/types/loop";

const BASE_HASHTAGS = ["#aimusic", "#musicproducer", "#beatmaker", "#producerhit"];

const MOOD_TAGS: Record<string, string[]> = {
  dreamy: ["#dreamy", "#latenight", "#aesthetic"],
  dark: ["#darktrap", "#moody", "#underground"],
  energetic: ["#hype", "#banger", "#energy"],
  chill: ["#chill", "#lofi", "#vibes"],
  emotional: ["#emotional", "#sadboy", "#feels"],
};

function moodTags(mood: string): string[] {
  const key = mood.trim().toLowerCase();
  for (const [k, tags] of Object.entries(MOOD_TAGS)) {
    if (key.includes(k)) return tags;
  }
  return ["#vibes", "#newmusic", "#y2k"];
}

function genreTag(genre: string): string {
  const g = genre.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
  if (!g || g === "auto" || g === "remix") return "#typebeat";
  return `#${g.slice(0, 24)}`;
}

export function buildTikTokHashtags(loop: Loop): string[] {
  const tags = new Set<string>([...BASE_HASHTAGS, genreTag(loop.genre || ""), ...moodTags(loop.mood || "")]);
  return Array.from(tags).slice(0, 8);
}

export function buildTikTokCaption(loop: Loop, locale: "en" | "fr"): string {
  const name = (loop.name || "Untitled").trim();
  const genre = (loop.genre || "").trim();
  const mood = (loop.mood || "").trim();
  const bpm = loop.bpm && loop.bpm > 0 ? `${loop.bpm} BPM` : null;
  const tags = buildTikTokHashtags(loop).join(" ");

  if (locale === "fr") {
    const vibe = [mood, genre].filter(Boolean).join(" · ") || "dreamy";
    const meta = bpm ? ` · ${bpm}` : "";
    return `${name} — ${vibe}${meta}\nmade with ProducerHit ✨\n${tags}`;
  }

  const vibe = [mood, genre].filter(Boolean).join(" · ") || "dreamy";
  const meta = bpm ? ` · ${bpm}` : "";
  return `${name} — ${vibe}${meta}\nmade with ProducerHit ✨\n${tags}`;
}

export function buildShareMomentTitle(locale: "en" | "fr"): string {
  return locale === "fr" ? "Partage l'univers" : "Share the void";
}

export function buildShareMomentSubtitle(locale: "en" | "fr"): string {
  return locale === "fr"
    ? "Un son de ta library — visuel déjà prêt. Export mystérieux pour les réseaux."
    : "A track from your library — visual already rendered. Mysterious export for social.";
}
