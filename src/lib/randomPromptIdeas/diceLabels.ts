import type { AppLocale } from "@/i18n/config";

/** Libellé bouton dé — toutes les langues UI. */
export const DICE_PROMPT_LABELS: Record<AppLocale, string> = {
  en: "Random prompt",
  fr: "Prompt aléatoire",
  es: "Prompt aleatorio",
  pt: "Prompt aleatório",
  de: "Zufälliger Prompt",
  it: "Prompt casuale",
  nl: "Willekeurige prompt",
  ar: "اقتراح عشوائي",
  ja: "ランダムプロンプト",
  ko: "랜덤 프롬프트",
  tr: "Rastgele prompt",
  hi: "रैंडम प्रॉम्प्ट",
  zh: "随机提示",
  th: "ไอเดียสุ่ม",
};

export function dicePromptLabel(locale: AppLocale): string {
  return DICE_PROMPT_LABELS[locale] ?? DICE_PROMPT_LABELS.en;
}
