import fs from "fs";
import path from "path";

const root = process.cwd();
const dash = fs.readFileSync(path.join(root, "src/pages/Dashboard.tsx"), "utf8");
const curated = fs.readFileSync(path.join(root, "src/lib/randomPromptIdeas/curatedDisplayPrompts.ts"), "utf8");

const chipsMatch = dash.match(/const genreInspirationChips[^=]+=\s*(\{[\s\S]*?\n\});/);
if (!chipsMatch) throw new Error("genreInspirationChips not found");

function extractArray(name) {
  const re = new RegExp(`const ${name}[^=]+=\\s*(\\[[\\s\\S]*?\\]);`);
  const m = curated.match(re);
  if (!m) throw new Error(`missing ${name}`);
  return m[1];
}

const out = `import { buildAceCaption } from "../generation/promptAce";
import type { GenerateParams } from "../generation/types";

export type PromptLocale = "en" | "fr";
export type PromptMode = "beat" | "song";

export const GENRE_INSPIRATION_CHIPS: Record<string, readonly string[]> = ${chipsMatch[1]};

export const DEFAULT_INSPIRATION_CHIPS = ["Dark", "Melodic", "Emotional", "Hard", "Smooth", "Atmospheric"] as const;

export function getInspirationChipsForGenre(genre: string): readonly string[] {
  return GENRE_INSPIRATION_CHIPS[genre] ?? DEFAULT_INSPIRATION_CHIPS;
}

export function toggleInspirationChip(current: string, chip: string): string {
  const trimmed = current.trim();
  const on = trimmed.includes(chip);
  if (on) {
    return trimmed
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== chip)
      .join(", ");
  }
  return trimmed ? \`\${trimmed}, \${chip}\` : chip;
}

const FR_SONG = ${extractArray("FR_SONG")};
const FR_BEAT = ${extractArray("FR_BEAT")};
const EN_SONG = ${extractArray("EN_SONG")};
const EN_BEAT = ${extractArray("EN_BEAT")};

const DISPLAY_POOLS = {
  en: { song: EN_SONG, beat: EN_BEAT },
  fr: { song: FR_SONG, beat: FR_BEAT },
} as const;

export function getDisplayPromptPool(locale: PromptLocale, mode: PromptMode): readonly string[] {
  return DISPLAY_POOLS[locale][mode];
}

export function pickRandomDisplayPrompt(locale: PromptLocale, mode: PromptMode): string {
  const pool = getDisplayPromptPool(locale, mode);
  return pool[Math.floor(Math.random() * pool.length)] ?? "";
}

export type MobileDiceRoll = {
  displayPrompt: string;
  acePrompt: string;
  genre?: string;
};

function matchGenreFromText(text: string, genres: readonly { value: string; label: string }[]): string | undefined {
  const lower = text.toLowerCase();
  for (const g of genres) {
    if (lower.includes(g.value.toLowerCase()) || lower.includes(g.label.toLowerCase())) return g.value;
  }
  return undefined;
}

export function pickMobileDiceRoll(
  locale: PromptLocale,
  mode: PromptMode,
  currentGenre: string,
  genreOptions: readonly { value: string; label: string }[],
): MobileDiceRoll {
  const displayPrompt = pickRandomDisplayPrompt(locale, mode);
  const matchedGenre = matchGenreFromText(displayPrompt, genreOptions) ?? currentGenre;
  const params: GenerateParams = {
    genre: matchedGenre,
    influence: "No Influence",
    key: "",
    scale: "",
    bpm: 0,
    loopLengthBars: mode === "song" ? 16 : 8,
    swing: 0,
    mood: "",
    energyLevel: "",
    reverb: "Medium",
    prompt: displayPrompt,
  };
  const acePrompt = buildAceCaption(params, {
    isSong: mode === "song",
    instrumental: mode === "beat",
    autoMeta: true,
    vocalLanguage: locale === "fr" ? "fr" : "en",
  });
  return { displayPrompt, acePrompt, genre: matchedGenre !== currentGenre ? matchedGenre : undefined };
}

export function pickRotatingPlaceholder(
  locale: PromptLocale,
  mode: PromptMode,
  index: number,
): { text: string; nextIndex: number } {
  const pool = getDisplayPromptPool(locale, mode);
  if (!pool.length) return { text: "", nextIndex: 0 };
  const next = (index + 1) % pool.length;
  return { text: pool[index % pool.length] ?? pool[0] ?? "", nextIndex: next };
}
`;

const target = path.join(root, "packages/shared/src/prompt/inspirationAndDice.ts");
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, out);
console.log("Wrote", target, out.length, "bytes");
