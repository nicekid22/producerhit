/**
 * Clean ACE lyrics for on-screen display (strip meta / copyright placeholders).
 */

const META_LINE =
  /^\[|\b(do not copy|copyright|original theme|reimagine .+ energy|new words, same emotion)\b/i;

const SITE_CTA = "Full lyrics on producerhit.com";

export function cleanLyricsForDisplay(raw) {
  const lines = String(raw ?? "")
    .split(/\r?\n/)
    .map((l) => l.replace(/^["']|["']$/g, "").trim())
    .filter((l) => l.length > 0 && !META_LINE.test(l));

  const text = lines.join("\n").trim();
  if (text.length >= 24) return text;
  return "";
}

function splitAtWords(text, maxLen = 42) {
  const words = String(text ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return [];

  const out = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > maxLen && cur) {
      out.push(cur);
      cur = w;
    } else {
      cur = next;
    }
  }
  if (cur) out.push(cur);
  return out;
}

function expandThemeToLines(lyricsTheme) {
  return String(lyricsTheme ?? "")
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 6)
    .flatMap((s) => splitAtWords(s, 42));
}

function dedupeLines(lines) {
  const seen = new Set();
  return lines.filter((line) => {
    const key = line.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function displayLinesForTrendRemix({ lyrics, trendKeywords = [], searchQueries = [], lyricsTheme = "" }) {
  let lines = [];
  const cleaned = cleanLyricsForDisplay(lyrics);
  if (cleaned) {
    lines = cleaned.split(/\r?\n/).flatMap((l) => splitAtWords(l, 42));
  }

  if (lines.length < 5 && lyricsTheme) {
    lines = dedupeLines([...lines, ...expandThemeToLines(lyricsTheme)]);
  }

  if (lines.length < 2) {
    const fromQueries = [...searchQueries, ...trendKeywords]
      .map((s) => String(s).trim())
      .filter(Boolean)
      .slice(0, 4)
      .map((q) => `♪ ${q.charAt(0).toUpperCase()}${q.slice(1)}`);
    if (fromQueries.length) lines = fromQueries;
  }

  if (lines.length < 2 && lyricsTheme) {
    lines = expandThemeToLines(lyricsTheme);
  }

  if (!lines.length) {
    lines = ["♪ AI remix · Full song", "♪ Create yours on ProducerHit"];
  }

  lines = dedupeLines(lines.filter((l) => !l.includes("producerhit.com")));
  lines.push(SITE_CTA);
  return lines.slice(0, 7);
}

/** Timed lyric segments — intro/outro reserved for title card + site CTA. */
export function buildLyricTimeline(lines, sec, { introSec = 11, outroSec = 7, maxBody = 5 } = {}) {
  const body = lines.filter((l) => !l.includes("producerhit.com")).slice(0, maxBody);
  const cta = lines.find((l) => l.includes("producerhit.com")) ?? SITE_CTA;
  const start = Math.min(introSec, sec * 0.18);
  const end = Math.max(start + 10, sec - outroSec);
  const span = Math.max(6, end - start);
  const n = Math.max(1, body.length);
  const chunk = span / n;

  const segments = body.map((text, i) => ({
    text,
    start: start + i * chunk,
    end: Math.min(end, start + (i + 1) * chunk),
  }));

  segments.push({ text: cta, start: Math.max(end, sec - outroSec), end: sec });
  return segments;
}

/** Short excerpt for YouTube description (partial lyrics + site hook). */
export function lyricsExcerptForDescription({ lyrics, lyricsTheme = "", maxLines = 3 }) {
  const lines = displayLinesForTrendRemix({ lyrics, lyricsTheme, trendKeywords: [], searchQueries: [] }).filter(
    (l) => !l.includes("producerhit.com") && !l.startsWith("♪"),
  );
  if (!lines.length) return "";
  return lines.slice(0, maxLines).map((l) => `• ${l}`).join("\n");
}
