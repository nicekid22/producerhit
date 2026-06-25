import {
  normalizeBankTheme,
  themeBridgeLines,
  themeOutroLines,
  themePreChorusLines,
  themeVerseFillers,
  type BankLyricsTheme,
} from "./bankLyricsThemes";

export type BuildBankLyricsInput = {
  display: string;
  lyrics_structure: string;
  lang: "en" | "fr";
  theme: string;
  id: number;
};

const PLACEHOLDER_RE =
  /\(storytelling|\(atmospheric intro|\(peak moment|\(emotional tension|\(deepen the narrative|\(fade into|\(atmospheric|\(build emotional|\(peak emotional|\(deepen the story|\(emotional climax|\(resolution\)/i;

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

function splitHookIntoLines(hook: string, lineCount: number, maxWords: number): string[] {
  const words = hook.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return Array.from({ length: lineCount }, () => "...");
  }
  if (words.length <= maxWords) {
    return [words.join(" ")];
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

function buildVerseLines(
  hook: string,
  lineCount: number,
  bankTheme: BankLyricsTheme,
  lang: "en" | "fr",
  rng: () => number,
  fillerOffset: number,
): string[] {
  const hookLines = splitHookIntoLines(hook, Math.min(2, lineCount), 7);
  const fillers = themeVerseFillers(lang, bankTheme, rng);
  const lines = [...hookLines];
  let fi = fillerOffset;
  while (lines.length < lineCount) {
    lines.push(fillers[fi % fillers.length]!);
    fi += 1;
  }
  return lines.slice(0, lineCount);
}

function buildChorusLines(hook: string, lineCount: number): string[] {
  const words = hook.split(/\s+/).filter(Boolean);
  if (words.length <= 6) {
    const half = Math.ceil(words.length / 2);
    const a = words.slice(0, half).join(" ");
    const b = words.slice(half).join(" ") || a;
    const base = [a, b].filter(Boolean);
    const out: string[] = [];
    for (let i = 0; i < lineCount; i += 1) {
      out.push(base[i % base.length]!);
    }
    return out;
  }
  return splitHookIntoLines(hook, lineCount, 6);
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

  const bankTheme = normalizeBankTheme(input.theme);
  const rng = mulberry32(input.id * 9973 + hook.length * 13);
  const verse1 = buildVerseLines(hook, 4, bankTheme, input.lang, rng, 0);
  const verse2 = buildVerseLines(hook, 4, bankTheme, input.lang, rng, 2);
  const chorus = buildChorusLines(hook, 4);
  const preChorus = themePreChorusLines(input.lang, bankTheme, rng);
  const bridge = themeBridgeLines(input.lang, bankTheme, rng);
  const outro = themeOutroLines(input.lang, bankTheme);

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
