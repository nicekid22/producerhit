/** Placeholder ACE — compose les paroles côté modèle (ne pas afficher en UI). */
export const ACE_AI_COMPOSE_LYRICS_PLACEHOLDER = "[Verse]\n(lyrics)";

export function resolveAceLyricsApiField(args: {
  instrumental: boolean;
  lyricsTrimmed: string;
}): string {
  if (args.instrumental) return "[instrumental]";
  const trimmed = args.lyricsTrimmed.trim();
  if (trimmed) return trimmed;
  return ACE_AI_COMPOSE_LYRICS_PLACEHOLDER;
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

export function resolveAceLyricsForMeta(args: {
  parsedLyrics?: string | null;
  userLyrics: string;
  caption: string;
}): string {
  const user = args.userLyrics.trim();
  if (user) return user;

  const parsed = (args.parsedLyrics ?? "").trim();
  if (!parsed) return "";
  if (looksLikeAceCaptionEchoLyrics(parsed, args.caption)) return "";
  return parsed;
}
