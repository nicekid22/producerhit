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
    icon: <Globe className="pk-menu-icon-accent h-4 w-4" aria-hidden />,
  };
}

export function formatVocalLanguageLabel(code: string, locale: "en" | "fr"): string {
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
