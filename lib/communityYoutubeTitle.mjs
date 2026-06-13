/**
 * Invente un titre Shorts à partir des paroles ACE (community loops).
 */

function hashId(id) {
  let h = 2166136261;
  const s = String(id ?? "x");
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function cleanLyricLine(line) {
  return String(line ?? "")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[♪♫…]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseLyricLines(lyrics) {
  return String(lyrics ?? "")
    .split(/\r?\n/)
    .map(cleanLyricLine)
    .filter((l) => l.length >= 4 && l.length <= 90 && !/^[\d\s\-–—]+$/.test(l));
}

function toTitleCase(s) {
  return String(s ?? "")
    .trim()
    .split(/\s+/)
    .map((w) => {
      const lower = w.toLowerCase();
      if (["a", "an", "the", "and", "or", "in", "on", "at", "to", "of", "for", "my", "your"].includes(lower)) {
        return lower;
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ")
    .replace(/^./, (c) => c.toUpperCase());
}

function isWeakHook(line) {
  const t = line.toLowerCase();
  if (t.length < 8) return true;
  if (/\b[a-z]\s+[a-z]{1,2}\s*$/i.test(line)) return true;
  if (/^(yeah|oh|uh|la|na|woah|ayy|boom|let's go|okay|intro|verse|chorus)\b/.test(t)) return true;
  if (/^(i don't know|don't know)/.test(t)) return true;
  return false;
}

/** Titre affiché sur la carte player + metadata YouTube. */
export function inventTitleFromLyrics(lyrics, { loopId = "", genre = "", fallbackName = "" } = {}) {
  const lines = parseLyricLines(lyrics);
  if (!lines.length) {
    const fb = String(fallbackName ?? "").trim();
    if (fb && !/^[\w\s#]+\d{2}$/i.test(fb)) return fb.slice(0, 42);
    return genre ? `${genre} AI Song` : "Midnight on Repeat";
  }

  const counts = new Map();
  for (const l of lines) {
    const key = l.toLowerCase();
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const chorus = lines.filter((l) => (counts.get(l.toLowerCase()) || 0) >= 2 && !isWeakHook(l));
  const verse = lines.filter((l) => !isWeakHook(l) && l.split(/\s+/).length >= 4);
  const pool = [...new Set([...chorus, ...verse, ...lines])].filter((l) => l.length <= 52);

  const h = hashId(loopId || lines[0]);
  const pick = pool[h % pool.length] || lines[0];
  return toTitleCase(pick.slice(0, 44));
}

export function extractAceLyrics(stemsUrl) {
  const ace = stemsUrl?.ace;
  if (!ace || typeof ace !== "object") return "";
  return String(ace.lyrics ?? "").trim();
}

export function loopHasUsableLyrics(stemsUrl) {
  const lyrics = extractAceLyrics(stemsUrl);
  if (lyrics.length < 40) return false;
  if (/^\[Instrumental\]/i.test(lyrics)) return false;
  return parseLyricLines(lyrics).length >= 2;
}

/** Extrait 2–4 lignes accrocheuses pour la description YouTube (SEO + engagement). */
export function lyricExcerptForDescription(lyrics, { maxLines = 4, loopId = "" } = {}) {
  const lines = parseLyricLines(lyrics);
  if (!lines.length) return "";

  const counts = new Map();
  for (const l of lines) counts.set(l.toLowerCase(), (counts.get(l.toLowerCase()) || 0) + 1);

  const chorus = lines.filter((l) => (counts.get(l.toLowerCase()) || 0) >= 2 && !isWeakHook(l));
  const strong = lines.filter((l) => !isWeakHook(l) && l.split(/\s+/).length >= 4);
  const pool = [...new Set([...chorus, ...strong, ...lines])].slice(0, 8);

  const h = hashId(loopId || pool[0]);
  const start = pool.length > maxLines ? h % Math.max(1, pool.length - maxLines + 1) : 0;
  const pick = pool.slice(start, start + maxLines);

  return pick.map((l) => `"${l}"`).join("\n");
}
