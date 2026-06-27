import {
  normalizeBankTheme,
  themeBridgeLines,
  themeChorusLines,
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

function buildVerseLines(
  lineCount: number,
  bankTheme: BankLyricsTheme,
  lang: "en" | "fr",
  rng: () => number,
): string[] {
  const lines = themeVerseFillers(lang, bankTheme, rng);
  return lines.slice(0, lineCount);
}

function buildChorusLines(lineCount: number, bankTheme: BankLyricsTheme, lang: "en" | "fr", rng: () => number): string[] {
  const [a, b] = themeChorusLines(lang, bankTheme, rng);
  const base = [a, b].filter(Boolean);
  const out: string[] = [];
  for (let i = 0; i < lineCount; i += 1) {
    out.push(base[i % base.length]!);
  }
  return out;
}

function joinSections(sections: Array<{ tag: string; lines: string[] }>, lang: "en" | "fr"): string {
  const blocks: string[] = [`[intro]`, `[${lang}]`];
  for (const section of sections) {
    blocks.push("", section.tag, ...section.lines);
  }
  return blocks.join("\n").trim();
}

/** Paroles thématiques — le hook display inspire le thème, mais n'est pas chanté mot pour mot. */
export function buildSingableLyricsFromBankEntry(input: BuildBankLyricsInput): string {
  const bankTheme = normalizeBankTheme(input.theme);
  const rng = mulberry32(input.id * 9973 + input.display.length * 13);
  const verse1 = buildVerseLines(4, bankTheme, input.lang, rng);
  const verse2 = buildVerseLines(4, bankTheme, input.lang, rng);
  const chorus = buildChorusLines(4, bankTheme, input.lang, rng);
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
