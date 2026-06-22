import { Globe, Languages } from "lucide-react";
import type { DropdownOption } from "@/components/ui/Dropdown";

import type { AppLocale } from "@/i18n/config";
import { vocalCodeToPromptLocale } from "@/lib/resolveRandomPromptLocale";

const LANGUAGES: { value: string; en: string; fr: string }[] = [
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

const IT_PATTERN =
  /\b(io|tu|lui|lei|noi|voi|loro|il|lo|la|gli|le|un|una|che|per|con|non|sono|questo|questa|canzone|amore|notte|storia|sulle|degli|delle|nella|dalla|ritornello)\b/i;
const ES_PATTERN =
  /\b(yo|tú|tu|él|ella|nosotros|los|las|del|por|para|canción|cancion|corazón|corazon|amor|muy|más|mas|sobre|estribillo)\b/i;
const PT_PATTERN =
  /\b(eu|você|voce|ele|ela|nós|nos|os|as|do|da|canção|cancao|coração|coracao|muito|sobre)\b/i;
const FR_PATTERN =
  /\b(je|tu|il|elle|nous|vous|ils|elles|les|des|est|pas|que|qui|dans|avec|pour|mon|ton|ma|ta|sa|chanson|chansons|pourquoi|très|tres|moi|toi|chez|sans|comme|mais|où|aussi|encore|jamais|toujours|une chanson|un son)\b/i;
const DE_PATTERN = /\b(ich|du|er|sie|wir|ihr|der|die|das|und|nicht|mit|für|fur|ein|eine|ist|sind|lied|musik|über|uber)\b/i;

/** Détection heuristique — idée ou paroles (mode Auto). */
export function detectVocalLanguageFromText(text: string): string {
  const raw = text.trim();
  if (raw.length < 3) return "en";

  const lower = raw.toLowerCase();

  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(raw)) return "ja";
  if (/[\uac00-\ud7af]/.test(raw)) return "ko";
  if (/[\u4e00-\u9fff]/.test(raw)) return "zh";
  if (/[\u0600-\u06ff]/.test(raw)) return "ar";
  if (/[\u0400-\u04ff]/.test(raw)) return "ru";

  const regionHints: Array<{ re: RegExp; code: string }> = [
    { re: /\b(france|français|francais|francophone|paris)\b/i, code: "fr" },
    { re: /\b(spain|españa|espana|madrid|barcelona|español|espanol)\b/i, code: "es" },
    { re: /\b(brazil|brasil|portugal|português|portugues|rio)\b/i, code: "pt" },
    { re: /\b(italy|italia|italiano|milano|roma|canzone)\b/i, code: "it" },
    { re: /\b(germany|deutsch|deutschland|berlin)\b/i, code: "de" },
    { re: /\b(korea|korean|k-pop|kpop|seoul)\b/i, code: "ko" },
    { re: /\b(arabic|arab|khaleeji|mahraganat|middle east)\b/i, code: "ar" },
    { re: /\b(russia|russian|moscow|moskva)\b/i, code: "ru" },
  ];
  for (const { re, code } of regionHints) {
    if (re.test(lower)) return code;
  }

  if (IT_PATTERN.test(lower)) return "it";
  if (ES_PATTERN.test(lower)) return "es";
  if (PT_PATTERN.test(lower)) return "pt";
  if (/[àâäéèêëïîôùûüÿœæç]/i.test(raw) && FR_PATTERN.test(lower)) return "fr";
  if (FR_PATTERN.test(lower)) return "fr";
  if (DE_PATTERN.test(lower)) return "de";

  return "en";
}

export function resolveSongVocalLanguage(args: {
  mode: "auto" | "manual";
  manualCode: string;
  lyricsMode: "ai" | "manual";
  lyrics: string;
  songDescription: string;
  uiLocale?: AppLocale;
}): string {
  if (args.mode === "manual") return args.manualCode.trim().toLowerCase() || "en";
  const lyricsText = args.lyrics.trim();
  const ideaText = args.songDescription.trim();
  const source = args.lyricsMode === "manual" && lyricsText.length > 0 ? lyricsText : ideaText;
  const detected = detectVocalLanguageFromText(source);

  if (args.mode === "auto" && args.uiLocale) {
    const uiCode = vocalCodeToPromptLocale(args.uiLocale);
    if (uiCode !== "en" && detected === "en") return uiCode;
    if (uiCode === "it" && (detected === "es" || detected === "fr")) return "it";
  }

  return detected;
}

export function vocalLanguageDropdownOptions(locale: AppLocale): DropdownOption[] {
  const isFr = locale === "fr";
  return LANGUAGES.map((l) => ({
    value: l.value,
    label: isFr ? l.fr : l.en,
    icon: <Languages className="h-4 w-4 text-pk-muted" aria-hidden />,
  }));
}

export function vocalLanguageAutoOption(locale: AppLocale): DropdownOption {
  return {
    value: "auto",
    label: locale === "fr" ? "Auto (détection)" : "Auto (detect)",
    icon: <Globe className="pk-menu-icon-accent h-4 w-4" aria-hidden />,
  };
}

export function formatVocalLanguageLabel(code: string, locale: AppLocale): string {
  const c = code.trim().toLowerCase();
  if (!c || c === "auto") return locale === "fr" ? "Auto" : "Auto";
  const hit = LANGUAGES.find((l) => l.value === c);
  if (hit) return locale === "fr" ? hit.fr : hit.en;
  return c.toUpperCase();
}

export function extractLoopVocalLanguage(loop: {
  details?: { caption?: string } | null;
  stemsUrl?: Record<string, unknown> | null;
}): string | null {
  const ace = loop.stemsUrl?.ace;
  if (ace && typeof ace === "object") {
    const raw =
      (ace as Record<string, unknown>).vocalLanguage ?? (ace as Record<string, unknown>).vocal_language;
    if (typeof raw === "string" && raw.trim()) return raw.trim().toLowerCase();
  }
  const caption = typeof loop.details?.caption === "string" ? loop.details.caption : "";
  const m = caption.match(/vocal language\s+([a-z]{2}|auto)/i);
  return m?.[1]?.toLowerCase() ?? null;
}

export function isSongLoop(loop: {
  name: string;
  details?: { lyrics?: string } | null;
  stemsUrl?: Record<string, unknown> | null;
}): boolean {
  const ace = loop.stemsUrl?.ace;
  if (ace && typeof ace === "object" && (ace as Record<string, unknown>).isSong === true) return true;
  if (typeof loop.details?.lyrics === "string" && loop.details.lyrics.trim().length > 0) return true;
  return /\bsong\b/i.test(loop.name);
}
