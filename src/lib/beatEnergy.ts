import type { DropdownOption } from "@/components/ui/Dropdown";

import type { AppLocale } from "@/i18n/config";
/** Valeurs alignées sur `energyMap` dans promptBuilder.ts */
export const BEAT_ENERGY_OPTIONS: { value: string; labelEn: string; labelFr: string; groupEn: string; groupFr: string }[] = [
  { value: "Chill", labelEn: "Chill", labelFr: "Chill", groupEn: "Energy", groupFr: "Énergie" },
  { value: "Confident", labelEn: "Confident", labelFr: "Confident", groupEn: "Energy", groupFr: "Énergie" },
  { value: "Hype", labelEn: "Hype", labelFr: "Hype", groupEn: "Energy", groupFr: "Énergie" },
  { value: "Aggressive", labelEn: "Aggressive", labelFr: "Agressif", groupEn: "Energy", groupFr: "Énergie" },
  { value: "Happy", labelEn: "Happy", labelFr: "Joyeux", groupEn: "Mood", groupFr: "Humeur" },
  { value: "Sad", labelEn: "Sad", labelFr: "Triste", groupEn: "Mood", groupFr: "Humeur" },
  { value: "Romantic", labelEn: "Romantic", labelFr: "Romantique", groupEn: "Mood", groupFr: "Humeur" },
  { value: "Nostalgic", labelEn: "Nostalgic", labelFr: "Nostalgique", groupEn: "Mood", groupFr: "Humeur" },
];

export function beatEnergyDropdownOptions(locale: AppLocale): DropdownOption[] {
  const isFr = locale === "fr";
  return BEAT_ENERGY_OPTIONS.map((o) => ({
    value: o.value,
    label: isFr ? o.labelFr : o.labelEn,
    group: isFr ? o.groupFr : o.groupEn,
  }));
}
