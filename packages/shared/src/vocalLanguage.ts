import type { AppLocale } from "./i18n/locales";
import { UI_LOCALES, vocalCodeToPromptLocale } from "./i18n/locales";
import { looksLikeStructuredDisplayIdea } from "./displayPromptPatterns";

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

const ACE_VOCAL_CODE_SET = new Set(VOCAL_LANGUAGES.map((l) => l.value));

export type VocalLanguagePreference = {
  mode: "auto" | "manual";
  manualCode: string;
};

/** UI locale ∈ intersection(UI_LOCALES, ACE vocal codes) → manual explicite ; sinon auto. */
export function defaultVocalLanguagePreference(uiLocale: AppLocale): VocalLanguagePreference {
  const code = uiLocale.trim().toLowerCase();
  if (ACE_VOCAL_CODE_SET.has(code) && (UI_LOCALES as readonly string[]).includes(code)) {
    return { mode: "manual", manualCode: code };
  }
  return { mode: "auto", manualCode: "en" };
}

/** Langue vocale ACE supportée — mappe les locales UI sans voix dédiée (nl, tr, hi, th). */
export function uiLocaleToAceVocalLanguage(uiLocale: AppLocale): string {
  const mapped = vocalCodeToPromptLocale(uiLocale);
  if (ACE_VOCAL_CODE_SET.has(mapped)) return mapped;
  return "en";
}

export function vocalLanguageLabel(code: string, uiLocale: AppLocale): string {
  const c = code.trim().toLowerCase();
  if (!c || c === "auto") {
    return uiLocale === "fr" ? "Auto" : uiLocale === "es" ? "Auto" : uiLocale === "de" ? "Auto" : "Auto";
  }
  const hit = VOCAL_LANGUAGES.find((l) => l.value === c);
  if (!hit) return c.toUpperCase();

  const localizedNames: Partial<Record<AppLocale, Record<string, string>>> = {
    fr: {
      en: "Anglais", fr: "Français", es: "Espagnol", pt: "Portugais", it: "Italien",
      de: "Allemand", ja: "Japonais", zh: "Chinois", ko: "Coréen", ar: "Arabe", ru: "Russe",
    },
    es: {
      en: "Inglés", fr: "Francés", es: "Español", pt: "Portugués", it: "Italiano",
      de: "Alemán", ja: "Japonés", zh: "Chino", ko: "Coreano", ar: "Árabe", ru: "Ruso",
    },
    pt: {
      en: "Inglês", fr: "Francês", es: "Espanhol", pt: "Português", it: "Italiano",
      de: "Alemão", ja: "Japonês", zh: "Chinês", ko: "Coreano", ar: "Árabe", ru: "Russo",
    },
    de: {
      en: "Englisch", fr: "Französisch", es: "Spanisch", pt: "Portugiesisch", it: "Italienisch",
      de: "Deutsch", ja: "Japanisch", zh: "Chinesisch", ko: "Koreanisch", ar: "Arabisch", ru: "Russisch",
    },
    it: {
      en: "Inglese", fr: "Francese", es: "Spagnolo", pt: "Portoghese", it: "Italiano",
      de: "Tedesco", ja: "Giapponese", zh: "Cinese", ko: "Coreano", ar: "Arabo", ru: "Russo",
    },
    nl: {
      en: "Engels", fr: "Frans", es: "Spaans", pt: "Portugees", it: "Italiaans",
      de: "Duits", ja: "Japans", zh: "Chinees", ko: "Koreaans", ar: "Arabisch", ru: "Russisch",
    },
    ja: {
      en: "英語", fr: "フランス語", es: "スペイン語", pt: "ポルトガル語", it: "イタリア語",
      de: "ドイツ語", ja: "日本語", zh: "中国語", ko: "韓国語", ar: "アラビア語", ru: "ロシア語",
    },
    ko: {
      en: "영어", fr: "프랑스어", es: "스페인어", pt: "포르투갈어", it: "이탈리아어",
      de: "독일어", ja: "일본어", zh: "중국어", ko: "한국어", ar: "아랍어", ru: "러시아어",
    },
    zh: {
      en: "英语", fr: "法语", es: "西班牙语", pt: "葡萄牙语", it: "意大利语",
      de: "德语", ja: "日语", zh: "中文", ko: "韩语", ar: "阿拉伯语", ru: "俄语",
    },
    ar: {
      en: "الإنجليزية", fr: "الفرنسية", es: "الإسبانية", pt: "البرتغالية", it: "الإيطالية",
      de: "الألمانية", ja: "اليابانية", zh: "الصينية", ko: "الكورية", ar: "العربية", ru: "الروسية",
    },
    tr: {
      en: "İngilizce", fr: "Fransızca", es: "İspanyolca", pt: "Portekizce", it: "İtalyanca",
      de: "Almanca", ja: "Japonca", zh: "Çince", ko: "Korece", ar: "Arapça", ru: "Rusça",
    },
    hi: {
      en: "अंग्रेज़ी", fr: "फ़्रेंच", es: "स्पेनिश", pt: "पुर्तगाली", it: "इतालवी",
      de: "जर्मन", ja: "जापानी", zh: "चीनी", ko: "कोरियाई", ar: "अरबी", ru: "रूसी",
    },
    th: {
      en: "อังกฤษ", fr: "ฝรั่งเศส", es: "สเปน", pt: "โปรตุเกส", it: "อิตาลี",
      de: "เยอรมัน", ja: "ญี่ปุ่น", zh: "จีน", ko: "เกาหลี", ar: "อาหรับ", ru: "รัสเซีย",
    },
  };

  const table = localizedNames[uiLocale];
  if (table?.[c]) return table[c]!;
  return uiLocale === "fr" ? hit.fr : hit.en;
}

const IT_PATTERN =
  /\b(io|tu|lui|lei|noi|voi|loro|il|lo|la|gli|le|un|una|che|per|con|non|sono|questo|questa|canzone|amore|notte|storia|sulle|degli|delle|nella|dalla|ritornello)\b/i;
const ES_PATTERN =
  /\b(yo|tú|tu|él|ella|nosotros|los|las|del|por|para|canción|cancion|corazón|corazon|amor|muy|más|mas|sobre|estribillo)\b/i;
const PT_PATTERN =
  /\b(eu|você|voce|ele|ela|nós|nos|os|as|do|da|canção|cancao|coração|coracao|muito|sobre)\b/i;
const FR_PATTERN =
  /\b(je|tu|il|elle|nous|vous|ils|elles|les|des|est|pas|que|qui|dans|avec|pour|mon|ton|ma|ta|sa|chanson|chansons|pourquoi|très|tres|moi|toi|chez|sans|comme|mais|où|aussi|encore|jamais|toujours|une chanson|un son)\b/i;
const DE_PATTERN = /\b(ich|du|er|sie|wir|ihr|der|die|das|und|nicht|mit|für|fur|ein|eine|ist|sind|lied|musik|über|uber)\b/i;

/** Détection heuristique — idée ou paroles (mode Auto). Aligné web vocalLanguages.ts */
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

  if (args.lyricsMode === "manual" && lyricsText.length > 0) {
    return detectVocalLanguageFromText(lyricsText);
  }

  const detected = detectVocalLanguageFromText(ideaText);

  if (args.uiLocale) {
    const uiCode = uiLocaleToAceVocalLanguage(args.uiLocale);
    if (looksLikeStructuredDisplayIdea(ideaText)) return uiCode;
    if (ideaText.length < 3) return uiCode;
    // Site non anglais : la langue UI prime (évite italien/espagnol résiduel après changement de langue).
    if (uiCode !== "en") return uiCode;
  }

  return detected;
}

export function buildSongUiPrompt(genre: string, description: string, vocalStyle?: string): string {
  return [genre.trim(), description.trim(), vocalStyle?.trim() ? `vocal style: ${vocalStyle.trim()}` : ""]
    .filter(Boolean)
    .join(", ");
}
