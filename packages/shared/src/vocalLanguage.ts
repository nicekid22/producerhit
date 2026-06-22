import type { AppLocale } from "./i18n/locales";

/** Langues vocales ACE (génération chanson). */
export const VOCAL_LANGUAGES: { value: string; en: string; fr: string }[] = [
  { value: "en", en: "English", fr: "Anglais" },
  { value: "fr", en: "French", fr: "Français" },
  { value: "es", en: "Spanish", fr: "Espagnol" },
  { value: "pt", en: "Portuguese", fr: "Portugais" },
  { value: "it", en: "Italian", fr: "Italien" },
  { value: "de", en: "German", fr: "Allemand" },
  { value: "ja", en: "Japanese", fr: "Japonais" },
  { value: "zh", en: "Chinese", fr: "Chinois" },
  { value: "ko", en: "Korean", fr: "Coréen" },
  { value: "ar", en: "Arabic", fr: "Arabe" },
  { value: "ru", en: "Russian", fr: "Russe" },
];

export function vocalLanguageLabel(code: string, uiLocale: AppLocale): string {
  const c = code.trim().toLowerCase();
  if (!c || c === "auto") return uiLocale === "fr" ? "Auto" : "Auto";
  const hit = VOCAL_LANGUAGES.find((l) => l.value === c);
  if (hit) return uiLocale === "fr" ? hit.fr : hit.en;
  return c.toUpperCase();
}

/** Détection heuristique — idée ou paroles (mode Auto). Aligné web vocalLanguages.ts */
export function detectVocalLanguageFromText(text: string): string {  const raw = text.trim();
  if (raw.length < 3) return "en";

  const lower = raw.toLowerCase();

  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(raw)) return "ja";
  if (/[\uac00-\ud7af]/.test(raw)) return "ko";
  if (/[\u4e00-\u9fff]/.test(raw)) return "zh";
  if (/[\u0600-\u06ff]/.test(raw)) return "ar";
  if (/[\u0400-\u04ff]/.test(raw)) return "ru";
  if (/[àâäéèêëïîôùûüÿœæç]/i.test(raw)) return "fr";

  const regionHints: Array<{ re: RegExp; code: string }> = [
    { re: /\b(france|français|francais|francophone|paris|chanson|chansons)\b/i, code: "fr" },
    { re: /\b(spain|españa|espana|madrid|barcelona|español|espanol)\b/i, code: "es" },
    { re: /\b(brazil|brasil|portugal|português|portugues|rio)\b/i, code: "pt" },
    { re: /\b(italy|italia|italiano|milano|roma)\b/i, code: "it" },
    { re: /\b(germany|deutsch|deutschland|berlin)\b/i, code: "de" },
    { re: /\b(korea|korean|k-pop|kpop|seoul)\b/i, code: "ko" },
    { re: /\b(arabic|arab|khaleeji|mahraganat|middle east)\b/i, code: "ar" },
    { re: /\b(russia|russian|moscow|moskva)\b/i, code: "ru" },
  ];
  for (const { re, code } of regionHints) {
    if (re.test(lower)) return code;
  }

  const frPattern =
    /\b(je|tu|il|elle|nous|vous|ils|elles|le|la|les|un|une|des|et|est|pas|que|qui|dans|sur|avec|pour|mon|ton|son|ma|ta|sa|chanson|douce|doux|pourquoi|très|tres|bien|moi|toi|chez|sans|plus|tout|tous|toute|comme|mais|ou|où|aussi|encore|jamais|toujours)\b/i;
  const esPattern =
    /\b(yo|tú|tu|él|ella|nosotros|los|las|una|del|por|para|con|que|como|pero|este|esta|muy|más|mas|canción|cancion|amor|corazón|corazon)\b/i;
  const ptPattern =
    /\b(eu|você|voce|ele|ela|nós|nos|os|as|um|uma|do|da|por|para|com|que|como|mas|este|essa|muito|canção|cancao|amor|coração|coracao)\b/i;
  const itPattern = /\b(io|tu|lui|lei|noi|voi|loro|il|lo|la|gli|le|un|una|che|per|con|non|sono|questo|questa|canzone|amore)\b/i;
  const dePattern = /\b(ich|du|er|sie|wir|ihr|der|die|das|und|nicht|mit|für|fur|ein|eine|ist|sind|lied|musik)\b/i;

  if (frPattern.test(lower)) return "fr";
  if (esPattern.test(lower)) return "es";
  if (ptPattern.test(lower)) return "pt";
  if (itPattern.test(lower)) return "it";
  if (dePattern.test(lower)) return "de";

  return "en";
}

export function resolveSongVocalLanguage(args: {
  mode: "auto" | "manual";
  manualCode: string;
  lyricsMode: "ai" | "manual";
  lyrics: string;
  songDescription: string;
}): string {
  if (args.mode === "manual") return args.manualCode.trim().toLowerCase() || "en";
  const lyricsText = args.lyrics.trim();
  const ideaText = args.songDescription.trim();
  const source = args.lyricsMode === "manual" && lyricsText.length > 0 ? lyricsText : ideaText;
  return detectVocalLanguageFromText(source);
}

export function buildSongUiPrompt(genre: string, description: string, vocalStyle?: string): string {
  return [genre.trim(), description.trim(), vocalStyle?.trim() ? `vocal style: ${vocalStyle.trim()}` : ""]
    .filter(Boolean)
    .join(", ");
}
