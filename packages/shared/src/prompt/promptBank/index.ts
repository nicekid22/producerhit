import type { AppLocale } from "../../i18n/locales";
import { guessGenreFromPromptBank } from "./genreFromCaption";
import { resolveBankLyrics } from "./buildBankLyrics";
import { enrichBankAceCaption } from "./enrichBankCaption";
import type { PromptBankEntry, PromptBankRoll } from "./types";

export type { PromptBankRoll };

import v1 from "../../../data/prompt-bank/v1.json";
import v2 from "../../../data/prompt-bank/v2.json";
import v3 from "../../../data/prompt-bank/v3.json";
import v4 from "../../../data/prompt-bank/v4.json";

const BANK_V1 = v1 as PromptBankEntry[];
const BANK_V2 = v2 as PromptBankEntry[];
const BANK_V3 = v3 as PromptBankEntry[];
const BANK_V4 = v4 as PromptBankEntry[];
const BANK_ALL: readonly PromptBankEntry[] = [...BANK_V1, ...BANK_V2, ...BANK_V3, ...BANK_V4];

let poolsByLang: { en: PromptBankEntry[]; fr: PromptBankEntry[] } | null = null;

function buildPoolsByLang(): { en: PromptBankEntry[]; fr: PromptBankEntry[] } {
  const en: PromptBankEntry[] = [];
  const fr: PromptBankEntry[] = [];
  for (const entry of BANK_ALL) {
    if (entry.lang === "fr") fr.push(entry);
    else en.push(entry);
  }
  return { en, fr };
}

function pools(): { en: PromptBankEntry[]; fr: PromptBankEntry[] } {
  if (!poolsByLang) poolsByLang = buildPoolsByLang();
  return poolsByLang;
}

/** Activé par défaut pour les tests — `EXPO_PUBLIC_PROMPT_BANK=0` ou `VITE_PROMPT_BANK=0` pour désactiver. */
export function isPromptBankEnabled(): boolean {
  const raw =
    (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_PROMPT_BANK) ||
    (typeof process !== "undefined" && process.env?.VITE_PROMPT_BANK) ||
    (typeof process !== "undefined" && process.env?.PROMPT_BANK) ||
    "1";
  const v = String(raw).trim().toLowerCase();
  return v !== "0" && v !== "false" && v !== "off";
}

export function promptBankStats(): {
  total: number;
  v1: number;
  v2: number;
  v3: number;
  v4: number;
  en: number;
  fr: number;
} {
  const p = pools();
  return {
    total: BANK_ALL.length,
    v1: BANK_V1.length,
    v2: BANK_V2.length,
    v3: BANK_V3.length,
    v4: BANK_V4.length,
    en: p.en.length,
    fr: p.fr.length,
  };
}

export function resolvePromptBankLang(uiLocale: AppLocale): "en" | "fr" {
  return uiLocale === "fr" ? "fr" : "en";
}

/** Banque curated EN/FR uniquement — autres locales utilisent les thèmes dice localisés. */
export function isPromptBankLocale(uiLocale: AppLocale): boolean {
  return uiLocale === "en" || uiLocale === "fr";
}

export function shouldUsePromptBank(uiLocale: AppLocale): boolean {
  return isPromptBankEnabled() && isPromptBankLocale(uiLocale);
}

function poolForLocale(uiLocale: AppLocale): PromptBankEntry[] {
  const p = pools();
  const primary = resolvePromptBankLang(uiLocale);
  const secondary = primary === "fr" ? "en" : "fr";
  return [...p[primary], ...p[secondary]];
}

/** Display strings pour placeholders rotatifs (song). */
export function getPromptBankDisplayPool(uiLocale: AppLocale): readonly string[] {
  return poolForLocale(uiLocale).map((e) => e.display);
}

function bankLyricsForEntry(entry: PromptBankEntry): string {
  return resolveBankLyrics({
    display: entry.display,
    lyrics_structure: entry.acestep.lyrics_structure,
    lang: entry.lang,
    theme: entry.theme,
    id: entry.id,
  });
}

function rollFromEntry(entry: PromptBankEntry, uiLocale: AppLocale): PromptBankRoll {
  const caption = entry.acestep.caption.trim();
  const genre = guessGenreFromPromptBank(entry.display, caption);
  const aceCaption = enrichBankAceCaption({
    display: entry.display.trim(),
    aceCaption: caption,
    locale: uiLocale,
    mode: "song",
    genre,
  });
  return {
    id: entry.id,
    theme: entry.theme,
    display: entry.display.trim(),
    aceCaption,
    lyricsStructure: bankLyricsForEntry(entry),
    lang: entry.lang,
    genre,
  };
}

function pickFromEntries(entries: PromptBankEntry[], uiLocale: AppLocale, seed?: number): PromptBankRoll {
  const idx =
    typeof seed === "number"
      ? Math.abs(Math.floor(seed)) % entries.length
      : Math.floor(Math.random() * entries.length);
  const entry = entries[idx] ?? entries[0]!;
  return rollFromEntry(entry, uiLocale);
}

export function getPromptBankEntriesByTheme(uiLocale: AppLocale, theme: string): readonly PromptBankEntry[] {
  return poolForLocale(uiLocale).filter((e) => e.theme === theme);
}

/** Display strings pour un thème (ex. good_vibes). */
export function getPromptBankDisplayPoolByTheme(uiLocale: AppLocale, theme: string): readonly string[] {
  return getPromptBankEntriesByTheme(uiLocale, theme).map((e) => e.display);
}

export function pickPromptBankRoll(uiLocale: AppLocale, seed?: number): PromptBankRoll {
  return pickFromEntries(poolForLocale(uiLocale), uiLocale, seed);
}

export function pickPromptBankRollByTheme(
  uiLocale: AppLocale,
  theme: string,
  seed?: number,
): PromptBankRoll | null {
  const filtered = getPromptBankEntriesByTheme(uiLocale, theme);
  if (!filtered.length) return null;
  return pickFromEntries(filtered, uiLocale, seed);
}

export function findPromptBankByDisplay(display: string, uiLocale: AppLocale): PromptBankRoll | null {
  const needle = display.trim().toLowerCase();
  if (!needle) return null;
  const hit = poolForLocale(uiLocale).find((e) => e.display.trim().toLowerCase() === needle);
  if (!hit) return null;
  return rollFromEntry(hit, uiLocale);
}
