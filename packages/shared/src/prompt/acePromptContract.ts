/**
 * ACE Step 1.5 prompt contract — single normalization path before API / LM.
 * Tags: comma-separated EN keywords, 8–14 tags, max 512 chars.
 */

export const ACE_CAPTION_MAX_CHARS = 512;
export const ACE_CAPTION_TAG_MAX = 14;

export const ACE_SONG_VOCAL_STABILITY_TAGS = [
  "clean studio vocal",
  "controlled delivery",
] as const;

export const ACE_BEAT_INSTRUMENTAL_TAGS = ["instrumental", "no vocals", "no lyrics"] as const;

const BEAT_VOCAL_TAG_RE =
  /\b(deep |breathy |smooth |raspy |airy )?(male|female) vocal\b|\bharmonies\b|\bchoir\b|\bspoken-word\b|\bvocal runs\b|\bclear lead vocals\b|\bvocals\b/gi;

const TEMPO_HINT_RE =
  /\b(very fast tempo|fast tempo|upbeat tempo|mid-tempo|slow tempo)\b/gi;

const BPM_TAG_RE = /\b\d{2,3}\s*bpm\b/gi;

const LYRICS_PLACEHOLDER_LINE_RE = /^\([^)]*\)\s*$/;
const LYRICS_LONG_LINE_WORDS = 12;

export type AceGenerationMode = "song" | "beat" | "melody";

export type AcePromptSource =
  | "manual"
  | "bank"
  | "dice"
  | "natural"
  | "catalog"
  | "prose";

export type NormalizeAcePayloadInput = {
  mode: AceGenerationMode;
  caption: string;
  lyrics?: string;
  instrumental?: boolean;
  bpm?: number | null;
  key?: string;
  scale?: string;
  vocalLanguage?: string;
  source?: AcePromptSource;
};

export type NormalizedAcePayload = {
  caption: string;
  lyrics: string;
  warnings: string[];
};

function clean(s: string): string {
  return s
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/,\s*,/g, ", ")
    .replace(/\s+\./g, ".")
    .replace(/,\s*$/g, "")
    .trim();
}

function limitChars(s: string, max: number): string {
  const t = clean(s);
  if (t.length <= max) return t;
  return t.slice(0, max).replace(/[,\s]+$/g, "").trim();
}

function parseTags(caption: string): string[] {
  return caption
    .split(",")
    .map((t) => clean(t))
    .filter(Boolean);
}

function uniqTags(tags: readonly string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of tags) {
    const t = clean(raw);
    if (!t) continue;
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
}

function hasSpecificVocalDeliveryTag(tags: readonly string[]): boolean {
  return tags.some((t) =>
    /\b(clean studio vocal|controlled delivery|steady pitch|male vocal|female vocal|vocal style)\b/i.test(
      t,
    ),
  );
}

function formatBpmTag(bpm: number): string {
  return `${Math.round(bpm)} bpm`;
}

function alignBpmTag(tags: string[], bpm: number | null | undefined, warnings: string[]): string[] {
  if (!bpm || !Number.isFinite(bpm) || bpm <= 0) {
    return tags;
  }
  const bpmTag = formatBpmTag(bpm);
  const withoutBpm = tags.filter((t) => !BPM_TAG_RE.test(t));
  const captionBpms = tags
    .map((t) => {
      const m = t.match(/^(\d{2,3})\s*bpm$/i);
      return m ? Number(m[1]) : null;
    })
    .filter((n): n is number => n != null);
  if (captionBpms.length > 0 && !captionBpms.some((n) => Math.abs(n - bpm) <= 2)) {
    warnings.push(`caption BPM (${captionBpms[0]}) aligned to param (${Math.round(bpm)})`);
  }
  return [...withoutBpm, bpmTag];
}

function stripTempoHintsWhenBpmPresent(tags: string[], bpm: number | null | undefined): string[] {
  if (!bpm || bpm <= 0) return tags;
  return tags.filter((t) => !TEMPO_HINT_RE.test(t));
}

function enforceTagLimit(tags: string[], warnings: string[]): string[] {
  if (tags.length <= ACE_CAPTION_TAG_MAX) return tags;
  warnings.push(`caption trimmed from ${tags.length} to ${ACE_CAPTION_TAG_MAX} tags`);
  return tags.slice(0, ACE_CAPTION_TAG_MAX);
}

export function normalizeAceCaption(
  caption: string,
  options: {
    mode: AceGenerationMode;
    instrumental?: boolean;
    bpm?: number | null;
    key?: string;
    scale?: string;
    vocalLanguage?: string;
  },
): { caption: string; warnings: string[] } {
  const warnings: string[] = [];
  const instrumental = options.instrumental ?? options.mode !== "song";
  const mode = options.mode === "melody" ? "melody" : instrumental ? "beat" : "song";

  let tags = uniqTags(parseTags(caption));

  if (mode === "beat" || mode === "melody") {
    tags = tags.map((t) => t.replace(BEAT_VOCAL_TAG_RE, "").trim()).filter(Boolean);
    tags = uniqTags([...tags, ...ACE_BEAT_INSTRUMENTAL_TAGS]);
    if (mode === "melody") {
      tags = tags.filter((t) => !/^no lyrics$/i.test(t));
    }
  } else {
    tags = tags.filter((t) => !/^instrumental$/i.test(t) && !/^no vocals$/i.test(t) && !/^no lyrics$/i.test(t));
    tags = tags.filter((t) => !/^vocals$/i.test(t));
    if (!hasSpecificVocalDeliveryTag(tags)) {
      tags = uniqTags([...tags, ...ACE_SONG_VOCAL_STABILITY_TAGS]);
    }
    const lang = (options.vocalLanguage || "").trim().toLowerCase();
    if (lang && !tags.some((t) => /^vocal language /i.test(t))) {
      tags.push(`vocal language ${lang}`);
    }
  }

  tags = stripTempoHintsWhenBpmPresent(tags, options.bpm);
  tags = alignBpmTag(tags, options.bpm, warnings);

  if (!options.bpm && options.key?.trim() && options.scale?.trim()) {
    const keyTag = `${options.key.trim()} ${options.scale.trim()}`;
    if (!tags.some((t) => t.toLowerCase() === keyTag.toLowerCase())) {
      tags.push(keyTag);
    }
  }

  tags = enforceTagLimit(tags, warnings);
  return { caption: limitChars(tags.join(", "), ACE_CAPTION_MAX_CHARS), warnings };
}

export function normalizeAceLyrics(
  lyrics: string,
  options: { instrumental?: boolean; vocalLanguage?: string } = {},
): { lyrics: string; warnings: string[] } {
  const warnings: string[] = [];
  if (options.instrumental) {
    return { lyrics: "[Instrumental]", warnings };
  }

  const raw = lyrics.trim();
  if (!raw) return { lyrics: "", warnings };

  const lines = raw.split(/\r?\n/);
  const out: string[] = [];
  let strippedPlaceholders = 0;
  let trimmedLongLines = 0;

  for (const line of lines) {
    const trimmed = line.trimEnd();
    if (!trimmed.trim()) {
      if (out.length > 0 && out[out.length - 1] !== "") out.push("");
      continue;
    }
    if (LYRICS_PLACEHOLDER_LINE_RE.test(trimmed.trim())) {
      strippedPlaceholders += 1;
      continue;
    }
    const words = trimmed.trim().split(/\s+/);
    if (words.length > LYRICS_LONG_LINE_WORDS && !/^\[/.test(trimmed.trim())) {
      trimmedLongLines += 1;
      out.push(words.slice(0, LYRICS_LONG_LINE_WORDS).join(" "));
      continue;
    }
    out.push(trimmed);
  }

  if (strippedPlaceholders > 0) {
    warnings.push(`removed ${strippedPlaceholders} lyrics placeholder line(s)`);
  }
  if (trimmedLongLines > 0) {
    warnings.push(`trimmed ${trimmedLongLines} long lyric line(s) to ${LYRICS_LONG_LINE_WORDS} words`);
  }

  let normalized = out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  const lang = (options.vocalLanguage || "").trim().toLowerCase();
  if (lang && normalized && !/\[(en|fr|es|it|de|pt|ja|ko|zh|ar|hi|th|tr|nl)\]/i.test(normalized)) {
    const firstSection = normalized.match(/^\[[^\]]+\]/);
    if (firstSection) {
      const insertAt = normalized.indexOf("\n", firstSection.index ?? 0);
      if (insertAt > 0) {
        normalized = `${normalized.slice(0, insertAt)}\n[${lang}]${normalized.slice(insertAt)}`;
      } else {
        normalized = `${normalized}\n[${lang}]`;
      }
    }
  }

  return { lyrics: normalized, warnings };
}

export function normalizeAceGenerationPayload(input: NormalizeAcePayloadInput): NormalizedAcePayload {
  const instrumental = input.instrumental ?? input.mode !== "song";
  const mode: AceGenerationMode =
    input.mode === "melody" ? "melody" : instrumental ? "beat" : "song";

  const captionResult = normalizeAceCaption(input.caption, {
    mode,
    instrumental,
    bpm: input.bpm,
    key: input.key,
    scale: input.scale,
    vocalLanguage: input.vocalLanguage,
  });

  const lyricsResult = normalizeAceLyrics(input.lyrics ?? "", {
    instrumental,
    vocalLanguage: input.vocalLanguage,
  });

  return {
    caption: captionResult.caption,
    lyrics: lyricsResult.lyrics,
    warnings: [...captionResult.warnings, ...lyricsResult.warnings],
  };
}
