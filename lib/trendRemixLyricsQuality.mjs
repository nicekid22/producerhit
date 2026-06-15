/**
 * Quality gate — trend remix videos require full original lyrics (verse + chorus minimum).
 */
import { cleanLyricsForDisplay } from "./youtubeTrendRemixLyrics.mjs";

const META_PATTERNS = [
  /do not copy copyrighted/i,
  /original theme/i,
  /reimagine .+ energy/i,
  /new words, same emotion/i,
  /\[verse —/i,
  /placeholder/i,
];

const SECTION_RE = /\[(verse\s*\d*|chorus|hook|bridge|pre-chorus)\]/gi;

function lyricalLines(raw) {
  return String(raw ?? "")
    .split(/\r?\n/)
    .map((l) => l.replace(/^["']|["']$/g, "").trim())
    .filter((l) => l.length > 0 && !/^\[[^\]]+\]$/.test(l));
}

function hasSectionLabel(raw, kind) {
  const re = kind === "verse" ? /\[(verse\s*\d*|verse)\]/i : /\[(chorus|hook)\]/i;
  return re.test(String(raw ?? ""));
}

function hasRepeatedHook(raw) {
  const lines = lyricalLines(raw).map((l) => l.toLowerCase());
  const counts = new Map();
  for (const line of lines) {
    if (line.length < 12) continue;
    counts.set(line, (counts.get(line) ?? 0) + 1);
  }
  return [...counts.values()].some((c) => c >= 2);
}

/** @returns {{ ok: boolean, reason?: string, lineCount?: number, sections?: number }} */
export function validateTrendRemixLyrics(raw) {
  const text = String(raw ?? "").trim();
  if (text.length < 80) return { ok: false, reason: "too_short" };

  if (META_PATTERNS.some((p) => p.test(text))) {
    return { ok: false, reason: "meta_placeholder" };
  }

  const cleaned = cleanLyricsForDisplay(text);
  if (!cleaned || cleaned.length < 100) {
    return { ok: false, reason: "insufficient_content" };
  }

  const displayLines = cleaned.split(/\r?\n/).filter((l) => l.trim().length > 8);
  if (displayLines.length < 4) {
    return { ok: false, reason: "too_few_lines" };
  }

  const sections = (text.match(SECTION_RE) ?? []).length;
  const hasVerse = hasSectionLabel(text, "verse") || sections >= 2;
  const hasChorus = hasSectionLabel(text, "chorus") || hasRepeatedHook(text);

  if (!hasVerse) return { ok: false, reason: "no_verse", lineCount: displayLines.length, sections };
  if (!hasChorus) return { ok: false, reason: "no_chorus", lineCount: displayLines.length, sections };

  return { ok: true, lineCount: displayLines.length, sections };
}

export function assertTrendRemixLyrics(raw, context = "trend_remix") {
  const check = validateTrendRemixLyrics(raw);
  if (!check.ok) {
    throw new Error(`${context}_lyrics_invalid:${check.reason}`);
  }
  return check;
}
