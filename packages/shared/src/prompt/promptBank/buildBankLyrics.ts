export type BuildBankLyricsInput = {
  display: string;
  lyrics_structure: string;
  lang: "en" | "fr";
  theme: string;
  id: number;
};

const PLACEHOLDER_RE =
  /\(storytelling|\(atmospheric intro|\(peak moment|\(emotional tension|\(deepen the narrative|\(fade into/i;

export function hasPlaceholderBankLyrics(lyrics: string): boolean {
  return PLACEHOLDER_RE.test(lyrics);
}

export function extractHookFromDisplay(display: string): string {
  const head = display.split(/\s[—–-]\s/)[0]?.trim() ?? display.trim();
  return head.replace(/,?\s*\d+\s*bpm$/i, "").trim();
}

export function extractHookFromPlaceholder(lyricsStructure: string): string | null {
  const m = lyricsStructure.match(/\(storytelling\s*—\s*([^)]+)\)/i);
  return m?.[1]?.trim() ?? null;
}

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(items: readonly T[], rng: () => number): T {
  return items[Math.floor(rng() * items.length)]!;
}

function splitHookIntoLines(hook: string, lineCount: number, maxWords: number): string[] {
  const words = hook.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return Array.from({ length: lineCount }, () => "...");
  }
  if (words.length <= maxWords) {
    const line = words.join(" ");
    return Array.from({ length: lineCount }, (_, i) => (i === 0 ? line : line));
  }

  const lines: string[] = [];
  let cursor = 0;
  for (let i = 0; i < lineCount; i += 1) {
    const remainingLines = lineCount - i;
    const remainingWords = words.length - cursor;
    const size = Math.min(maxWords, Math.max(3, Math.ceil(remainingWords / remainingLines)));
    const chunk = words.slice(cursor, cursor + size);
    cursor += size;
    lines.push(chunk.join(" "));
  }
  while (lines.length < lineCount) {
    lines.push(lines[lines.length - 1] ?? hook);
  }
  return lines;
}

function rotateLines(lines: string[], shift: number): string[] {
  if (!lines.length) return lines;
  const n = ((shift % lines.length) + lines.length) % lines.length;
  return [...lines.slice(n), ...lines.slice(0, n)];
}

function preChorusLines(lang: "en" | "fr", theme: string, rng: () => number): string[] {
  const en: Record<string, string[][]> = {
    love: [
      ["It's rising in my chest", "I can't catch my breath"],
      ["Every beat pulls me in", "Let the feeling begin"],
    ],
    party: [
      ["Hands up, feel the sound", "Feet leave the ground"],
      ["Turn it up, don't slow down", "Own the whole town"],
    ],
    default: [
      ["Something's shifting inside", "Can't run, can't hide"],
      ["Building up in my veins", "Breaking through the chains"],
    ],
  };
  const fr: Record<string, string[][]> = {
    love: [
      ["Ça monte dans ma poitrine", "Je perds mon équilibre"],
      ["Chaque souffle me rapproche", "Le cœur s'emballe encore"],
    ],
    party: [
      ["Les mains en l'air ce soir", "On danse jusqu'au jour"],
      ["Monte le son, plus fort", "On vit chaque accord"],
    ],
    default: [
      ["Quelque chose change en moi", "Je sens le tempo"],
      ["Ça gronde sous ma peau", "Jamais trop lent ni trop"],
    ],
  };
  const pool = (lang === "fr" ? fr : en)[theme] ?? (lang === "fr" ? fr.default : en.default);
  return pick(pool, rng);
}

function bridgeLines(lang: "en" | "fr", theme: string, rng: () => number): string[] {
  const en: Record<string, string[][]> = {
    love: [
      ["Maybe we don't need a map", "Just your heart on my lap"],
      ["If this is all we get tonight", "Hold me till the light"],
    ],
    default: [["Maybe this is all we need", "Stay right here with me"]],
  };
  const fr: Record<string, string[][]> = {
    love: [
      ["Peut-être qu'on n'a besoin de rien", "Juste ce moment à deux"],
      ["Si c'est tout ce qu'on a ce soir", "Garde-moi contre toi"],
    ],
    default: [["Peut-être que c'est assez", "Reste encore un peu"]],
  };
  const pool = (lang === "fr" ? fr : en)[theme] ?? (lang === "fr" ? fr.default : en.default);
  return pick(pool, rng);
}

function outroLines(lang: "en" | "fr"): string[] {
  return lang === "fr" ? ["On s'éteint doucement", "Dans le silence"] : ["Fade into the night", "Hold the moment tight"];
}

function joinSections(sections: Array<{ tag: string; lines: string[] }>, lang: "en" | "fr"): string {
  const blocks: string[] = [`[intro]`, `[${lang}]`];
  for (const section of sections) {
    blocks.push("", section.tag, ...section.lines);
  }
  return blocks.join("\n").trim();
}

/** Génère des paroles courtes chantables (4–7 mots/ligne) à partir du hook display. */
export function buildSingableLyricsFromBankEntry(input: BuildBankLyricsInput): string {
  const hook =
    extractHookFromDisplay(input.display) ||
    extractHookFromPlaceholder(input.lyrics_structure) ||
    (input.lang === "fr" ? "ce moment entre nous" : "this moment with you");

  const rng = mulberry32(input.id * 9973 + hook.length * 13);
  const verse1 = splitHookIntoLines(hook, 4, 7);
  const chorus = splitHookIntoLines(hook, 4, 6);
  const verse2 = rotateLines(verse1, 1 + Math.floor(rng() * 3));
  const preChorus = preChorusLines(input.lang, input.theme, rng);
  const bridge = bridgeLines(input.lang, input.theme, rng);
  const outro = outroLines(input.lang);

  return joinSections(
    [
      { tag: "[verse]", lines: verse1 },
      { tag: "[pre-chorus]", lines: preChorus },
      { tag: "[chorus]", lines: chorus },
      { tag: "[verse]", lines: verse2 },
      { tag: "[pre-chorus]", lines: preChorus },
      { tag: "[chorus]", lines: chorus },
      { tag: "[bridge]", lines: bridge },
      { tag: "[chorus]", lines: chorus },
      { tag: "[outro]", lines: outro },
    ],
    input.lang,
  );
}

export function resolveBankLyrics(input: BuildBankLyricsInput & { lyrics_structure: string }): string {
  const raw = input.lyrics_structure.trim();
  if (!raw || !hasPlaceholderBankLyrics(raw)) return raw;
  return buildSingableLyricsFromBankEntry(input);
}
