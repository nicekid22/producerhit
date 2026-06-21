import type { AppLocale } from "@/i18n/config";
import { hashString } from "@/lib/utils";

export type BeatNameGenre =
  | "trap"
  | "drill"
  | "lofi"
  | "house"
  | "rnb"
  | "phonk"
  | "afro"
  | "pop";

export type BeatNameMood = "dark" | "chill" | "hype" | "sad" | "dreamy" | "any";

const GENRES: { id: BeatNameGenre; labelEn: string; labelFr: string }[] = [
  { id: "trap", labelEn: "Trap", labelFr: "Trap" },
  { id: "drill", labelEn: "Drill", labelFr: "Drill" },
  { id: "lofi", labelEn: "Lo-fi", labelFr: "Lo-fi" },
  { id: "house", labelEn: "House", labelFr: "House" },
  { id: "rnb", labelEn: "R&B", labelFr: "R&B" },
  { id: "phonk", labelEn: "Phonk", labelFr: "Phonk" },
  { id: "afro", labelEn: "Afro", labelFr: "Afro" },
  { id: "pop", labelEn: "Pop", labelFr: "Pop" },
];

const MOODS: { id: BeatNameMood; labelEn: string; labelFr: string }[] = [
  { id: "any", labelEn: "Any", labelFr: "Tous" },
  { id: "dark", labelEn: "Dark", labelFr: "Sombre" },
  { id: "chill", labelEn: "Chill", labelFr: "Chill" },
  { id: "hype", labelEn: "Hype", labelFr: "Hype" },
  { id: "sad", labelEn: "Sad", labelFr: "Triste" },
  { id: "dreamy", labelEn: "Dreamy", labelFr: "Dreamy" },
];

const EN_PARTS = {
  adj: ["Midnight", "Neon", "Velvet", "Crystal", "Ghost", "Golden", "Frozen", "Electric", "Silent", "Cosmic", "Rogue", "Prism", "Hollow", "Savage", "Lunar"],
  noun: ["Pulse", "Wave", "Echo", "Drift", "Haze", "Storm", "Mirage", "Cipher", "Aura", "Vortex", "Phase", "Shadow", "Glow", "Ritual", "Frequency"],
  suffix: ["Type Beat", "Loop", "Pack", "Vol. 2", "Session", "Freestyle", "Instrumental"],
};

const FR_PARTS = {
  adj: ["Minuit", "Néon", "Velours", "Crystal", "Fantôme", "Doré", "Glacé", "Électrique", "Silencieux", "Cosmique", "Rogue", "Prisme", "Hollow", "Savage", "Lunaire"],
  noun: ["Pulse", "Vague", "Écho", "Drift", "Brume", "Tempête", "Mirage", "Cipher", "Aura", "Vortex", "Phase", "Ombre", "Glow", "Rituel", "Fréquence"],
  suffix: ["Type Beat", "Loop", "Pack", "Vol. 2", "Session", "Freestyle", "Instrumental"],
};

const MOOD_ADJ: Record<BeatNameMood, { en: string[]; fr: string[] }> = {
  any: { en: [], fr: [] },
  dark: { en: ["Dark", "Bleak", "Grim"], fr: ["Dark", "Sombre", "Grim"] },
  chill: { en: ["Soft", "Lazy", "Warm"], fr: ["Soft", "Lazy", "Warm"] },
  hype: { en: ["Turbo", "Rage", "Max"], fr: ["Turbo", "Rage", "Max"] },
  sad: { en: ["Lonely", "Broken", "Empty"], fr: ["Lonely", "Broken", "Empty"] },
  dreamy: { en: ["Dream", "Cloud", "Mist"], fr: ["Dream", "Cloud", "Mist"] },
};

export function beatNameGenreOptions(locale: AppLocale) {
  const isFr = locale === "fr";
  return GENRES.map((g) => ({ id: g.id, label: isFr ? g.labelFr : g.labelEn }));
}

export function beatNameMoodOptions(locale: AppLocale) {
  const isFr = locale === "fr";
  return MOODS.map((m) => ({ id: m.id, label: isFr ? m.labelFr : m.labelEn }));
}

function pick<T>(arr: readonly T[], seed: string, salt: string): T {
  return arr[hashString(`${seed}:${salt}`) % arr.length]!;
}

export function generateBeatNames(input: {
  locale: AppLocale;
  genre: BeatNameGenre;
  mood: BeatNameMood;
  count?: number;
  seed?: string;
}): string[] {
  const isFr = input.locale === "fr";
  const parts = isFr ? FR_PARTS : EN_PARTS;
  const genreLabel = GENRES.find((g) => g.id === input.genre);
  const genreWord = genreLabel ? (isFr ? genreLabel.labelFr : genreLabel.labelEn) : "Trap";
  const moodPool = MOOD_ADJ[input.mood] ?? MOOD_ADJ.any;
  const moodWords = isFr ? moodPool.fr : moodPool.en;
  const baseSeed = input.seed ?? `${Date.now()}:${input.genre}:${input.mood}`;
  const count = input.count ?? 8;
  const names = new Set<string>();

  for (let i = 0; names.size < count && i < count * 4; i++) {
    const seed = `${baseSeed}:${i}`;
    const moodAdj = moodWords.length ? pick(moodWords, seed, "mood") : pick(parts.adj, seed, "adj");
    const noun = pick(parts.noun, seed, "noun");
    const suffix = pick(parts.suffix, seed, "suffix");
    const name = `${moodAdj} ${noun} — ${genreWord} ${suffix}`.replace(/\s+/g, " ").trim();
    names.add(name);
  }

  return Array.from(names).slice(0, count);
}

/** Prompt court pour pré-remplir le générateur depuis un nom de beat. */
export function beatNameToGeneratorPrompt(name: string, genre: BeatNameGenre): string {
  return `${genre} type beat inspired by "${name}" — modern, radio-ready, strong drums`;
}
