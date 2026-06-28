/** @deprecated Ne plus envoyer à l'API — composition via messages/caption uniquement. */
export const ACE_AI_COMPOSE_LYRICS_PLACEHOLDER = "[Verse]\n(lyrics)";

/** Valeur du champ `lyrics` envoyée à l'API ACE (pas le body client ni la DB). */
export function resolveAceLyricsApiField(args: {
  instrumental: boolean;
  lyricsTrimmed: string;
}): string {
  if (args.instrumental) return "[instrumental]";
  return args.lyricsTrimmed.trim();
}

const CAPTION_ECHO_SIGNALS = [
  /vocal style/i,
  /vocal language/i,
  /loopable \d+ bars/i,
  /\b\d{2,3}\s*bpm\b/i,
  /subtle room reverb/i,
  /storytelling english vocals/i,
  /clean studio vocal/i,
  /controlled delivery/i,
  /no vocals/i,
  /instrumental/i,
];

/** Paroles renvoyées par ACE qui reprennent le prompt style/genre — à ne pas afficher. */
export function looksLikeAceCaptionEchoLyrics(lyrics: string, caption: string): boolean {
  const l = lyrics.trim();
  if (!l) return false;
  if (l === ACE_AI_COMPOSE_LYRICS_PLACEHOLDER) return true;

  const c = caption.trim();
  if (c) {
    const lLower = l.toLowerCase();
    const cLower = c.toLowerCase();
    if (lLower === cLower) return true;
    const head = cLower.slice(0, Math.min(48, cLower.length));
    if (head.length >= 24 && lLower.includes(head)) return true;
  }

  const commaCount = (l.match(/,/g) ?? []).length;
  if (commaCount >= 3 && CAPTION_ECHO_SIGNALS.some((re) => re.test(l))) return true;
  return false;
}

const STRUCTURAL_LINE_RE =
  /^\[(?:\d{1,2}:\d{2}(?::\d{2})?|\s*(?:intro|outro|verse|chorus|bridge|pre-chorus|hook|break|interlude|section|instrumental|melodic|guitar|drum|solo)[^\]]*)\]/i;

/** Structure arrangement ACE (timestamps, intros instrumentales) — pas des paroles chantables. */
export function looksLikeAceStructuralLyrics(lyrics: string): boolean {
  const l = lyrics.trim();
  if (!l) return false;
  if (l === ACE_AI_COMPOSE_LYRICS_PLACEHOLDER) return true;
  if (/^\(lyrics\)$/i.test(l)) return true;

  if (/\[\d{1,2}:\d{2}(?::\d{2})?\]/i.test(l)) return true;

  const lines = l.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  if (lines.length === 0) return false;

  const isStructuralLine = (line: string) => {
    if (STRUCTURAL_LINE_RE.test(line)) return true;
    if (/^\[[^\]]+\](?:\s*\[[^\]]+\])?\s*$/i.test(line)) {
      return /intro|outro|section|instrumental|guitar|drum|melodic|break|solo|interlude|driving/i.test(line);
    }
    return false;
  };

  if (lines.every(isStructuralLine)) return true;

  const structuralCount = lines.filter(isStructuralLine).length;
  if (structuralCount >= 2 && structuralCount / lines.length >= 0.6) return true;

  return false;
}

/** Placeholders LM / squelette arrangement — pas des paroles chantables. */
export function looksLikeAcePlaceholderLyrics(lyrics: string): boolean {
  const t = lyrics.trim();
  if (!t) return false;
  if (
    /\(storytelling|\(atmospheric intro|\(build emotional|\(peak moment|\(fade into|\(deepen the narrative/i.test(
      t,
    )
  ) {
    return true;
  }
  const lines = t.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  if (lines.length === 0) return false;
  const placeholderOrSection = lines.filter(
    (line) => /^\([^)]+\)\s*$/.test(line) || /^\[[^\]]+\]\s*$/.test(line),
  ).length;
  return placeholderOrSection / lines.length >= 0.5;
}

/** Texte chantable (hors marqueurs de section vides). */
export function looksLikeSingableLyrics(lyrics: string): boolean {
  const l = lyrics.trim();
  if (!l) return false;
  if (looksLikeAcePlaceholderLyrics(l)) return false;
  if (looksLikeAceStructuralLyrics(l)) return false;
  if (looksLikeAceCaptionEchoLyrics(l, "")) return false;

  const body = l
    .replace(/\[(?:verse|chorus|bridge|pre-chorus|hook|outro|intro)[^\]]*\]/gi, "")
    .replace(/\(lyrics\)/gi, "")
    .trim();

  return /[a-zàâäéèêëïîôùûüç]{3,}/i.test(body);
}

/** Texte vocal phonétique ACE parfois renvoyé dans caption au lieu de lyrics. */
export function looksLikeAceVocalPhoneticCaption(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (/^\(spoken/i.test(t)) return true;
  if (/^\([^)]*\brap\s+tamil\b/i.test(t)) return true;
  if (t.startsWith("(") && (t.match(/,/g)?.length ?? 0) >= 2 && !/\bbpm\b/i.test(t)) return true;
  return false;
}

/** Extrait les paroles du texte markdown renvoyé par ACE chat/completions. */
export function extractLyricsFromAceResponseContent(content: string): string {
  const text = content.trim();
  if (!text) return "";
  const idx = text.toLowerCase().indexOf("## lyrics");
  if (idx >= 0) return text.slice(idx + "## lyrics".length).trim();
  const sectionMatch = text.match(/\[(?:Verse|Chorus|Bridge|Intro|Outro|Hook|Pre-Chorus|Pre Chorus)/i);
  if (sectionMatch?.index != null) return text.slice(sectionMatch.index).trim();
  return "";
}

/** Paroles à persister / afficher dans « Paroles » (jamais le prompt genre ni la structure ACE). */
export function resolveAceLyricsForMeta(args: {
  parsedLyrics?: string | null;
  userLyrics: string;
  caption: string;
  /** ACE peut mettre les phonétiques vocales dans prompt/caption au lieu de lyrics. */
  parsedPrompt?: string | null;
}): string {
  const user = args.userLyrics.trim();
  if (user && looksLikeSingableLyrics(user)) return user;

  const filtered = resolveAceLyricsForMetaInner(args);
  if (filtered) return filtered;

  const cap = args.caption.trim();
  if (cap && looksLikeAceVocalPhoneticCaption(cap)) return cap;

  const prompt = (args.parsedPrompt ?? "").trim();
  if (prompt && looksLikeAceVocalPhoneticCaption(prompt)) return prompt;

  return "";
}

function resolveAceLyricsForMetaInner(args: {
  parsedLyrics?: string | null;
  userLyrics: string;
  caption: string;
}): string {
  const user = args.userLyrics.trim();
  if (user && looksLikeSingableLyrics(user)) return user;

  const parsed = (args.parsedLyrics ?? "").trim();
  if (!parsed) return "";
  if (looksLikeAceCaptionEchoLyrics(parsed, args.caption)) return "";
  if (looksLikeAceStructuralLyrics(parsed)) return "";
  if (!looksLikeSingableLyrics(parsed)) return "";
  return parsed;
}
