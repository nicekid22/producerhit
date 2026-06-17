import type { Loop } from "@/types/loop";

import type { AppLocale } from "@/i18n/config";
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
  return Array.from(tags).slice(0, 5);
}

export function buildTikTokCaption(loop: Loop, locale: AppLocale): string {
  const name = (loop.name || "Untitled").trim();
  const bpm = loop.bpm && loop.bpm > 0 ? `${loop.bpm} BPM` : null;
  const tags = buildTikTokHashtags(loop).join(" ");
  const line1 = bpm ? `${name} · ${bpm}` : name;
  return `${line1}\nProducerHit\n${tags}`;
}

/** Caption + lien — prêt à coller dans TikTok / Reels. */
export function buildSocialKitText(caption: string, shareUrl: string): string {
  return `${caption.trim()}\n\n${shareUrl.trim()}`;
}

export function buildShareMomentTitle(locale: AppLocale): string {
  return locale === "fr" ? "Partager" : "Share";
}
