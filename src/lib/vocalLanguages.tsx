import { Globe, Languages } from "lucide-react";
import type { DropdownOption } from "@/components/ui/Dropdown";

const LANGUAGES: { value: string; en: string; fr: string }[] = [
  { value: "en", en: "English", fr: "Anglais" },
  { value: "fr", en: "French", fr: "Français" },
  { value: "es", en: "Spanish", fr: "Espagnol" },
  { value: "pt", en: "Portuguese", fr: "Portugais" },
  { value: "it", en: "Italian", fr: "Italien" },
  { value: "de", en: "German", fr: "Allemand" },
  { value: "ja", en: "Japanese", fr: "Japonais" },
  { value: "zh", en: "Chinese", fr: "Chinois" },
];

export function vocalLanguageDropdownOptions(locale: "en" | "fr"): DropdownOption[] {
  const isFr = locale === "fr";
  return LANGUAGES.map((l) => ({
    value: l.value,
    label: isFr ? l.fr : l.en,
    icon: <Languages className="h-4 w-4 text-pk-muted" aria-hidden />,
  }));
}

export function vocalLanguageAutoOption(locale: "en" | "fr"): DropdownOption {
  return {
    value: "auto",
    label: locale === "fr" ? "Auto (détection)" : "Auto (detect)",
    icon: <Globe className="h-4 w-4 text-cyan-400" aria-hidden />,
  };
}
