import type { AppLocale } from "@/i18n/config";
import { legacyEnFr } from "@/i18n/config";
import { resolvePromptPools } from "@/lib/randomPromptIdeas/localePools";
import type { PromptMode } from "@/lib/randomPromptIdeas";

const STATIC_FALLBACK: Partial<Record<AppLocale, Record<PromptMode, string>>> = {
  es: {
    song: "ej. una canción pop sobre una noche de verano en la playa",
    beat: "ej. un beat trap melódico para una noche lluviosa",
  },
  pt: {
    song: "ex. uma música pop sobre uma noite de verão na praia",
    beat: "ex. um beat trap melódico para uma noite chuvosa",
  },
  de: {
    song: "z. B. ein Pop-Song über eine Sommernacht am Strand",
    beat: "z. B. ein melodischer Trap-Beat für eine regnerische Nacht",
  },
  it: {
    song: "es. una canzone pop su una notte d'estate in spiaggia",
    beat: "es. un beat trap melodico per una notte di pioggia",
  },
  nl: {
    song: "bijv. een popsong over een zomernacht op het strand",
    beat: "bijv. een melodische trap beat voor een regenachtige nacht",
  },
  ja: {
    song: "例：ビーチの夏の夜についてのポップソング",
    beat: "例：雨の夜向けのメロディックトラップビート",
  },
  ko: {
    song: "예: 해변의 여름밤에 대한 팝 송",
    beat: "예: 비 오는 밤을 위한 멜로딕 트랩 비트",
  },
  zh: {
    song: "例如：关于夏夜海滩的流行歌曲",
    beat: "例如：适合雨夜的旋律陷阱节拍",
  },
  ar: {
    song: "مثال: أغنية بوب عن ليلة صيف على الشاطئ",
    beat: "مثال: بيت تراب لحني لليلة ممطرة",
  },
  tr: {
    song: "ör. sahilde yaz gecesi hakkında bir pop şarkısı",
    beat: "ör. yağmurlu bir gece için melodik trap beat",
  },
  hi: {
    song: "उदा. समुद्र तट पर गर्मी की रात पर एक पॉप गाना",
    beat: "उदा. बारिश वाली रात के लिए मेलोडिक ट्रैप बीट",
  },
  th: {
    song: "เช่น เพลงป็อปเกี่ยวกับค่ำคืนฤดูร้อนที่ชายหาด",
    beat: "เช่น บีตแทรปเมโลดี้สำหรับคืนที่มีฝน",
  },
};

/** Placeholder statique quand le pool rotatif est vide. */
export function getLocaleIdeaFallback(locale: AppLocale, mode: PromptMode): string {
  const hero = resolvePromptPools(locale).hero;
  const fromHero = hero[0]?.trim();
  if (fromHero) return fromHero;

  const staticFallback = STATIC_FALLBACK[locale]?.[mode];
  if (staticFallback) return staticFallback;

  return mode === "song"
    ? legacyEnFr(locale, "e.g. a pop song about a summer night at the beach", "ex : une chanson pop sur une nuit d'été à la plage")
    : legacyEnFr(
        locale,
        "e.g. a melodic trap beat about a rainy late-night drive",
        "ex : un beat trap mélodique pour une nuit pluvieuse",
      );
}
