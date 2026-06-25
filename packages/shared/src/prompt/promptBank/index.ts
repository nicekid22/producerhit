import type { AppLocale } from "../../i18n/locales";
import { guessGenreFromPromptBank } from "./genreFromCaption";
import { resolveBankLyrics } from "./buildBankLyrics";
import type { PromptBankEntry, PromptBankRoll } from "./types";

import v1 from "../../../data/prompt-bank/v1.json";
import v2 from "../../../data/prompt-bank/v2.json";

const BANK_V1 = v1 as PromptBankEntry[];
const BANK_V2 = v2 as PromptBankEntry[];
const BANK_ALL: readonly PromptBankEntry[] = [...BANK_V1, ...BANK_V2];

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

export function promptBankStats(): { total: number; v1: number; v2: number; en: number; fr: number } {
  const p = pools();
  return {
    total: BANK_ALL.length,
    v1: BANK_V1.length,
    v2: BANK_V2.length,
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

export function pickPromptBankRoll(uiLocale: AppLocale, seed?: number): PromptBankRoll {
  const pool = poolForLocale(uiLocale);
  const idx =
    typeof seed === "number"
      ? Math.abs(Math.floor(seed)) % pool.length
      : Math.floor(Math.random() * pool.length);
  const entry = pool[idx] ?? pool[0]!;
  const caption = entry.acestep.caption.trim();
  const lyricsStructure = bankLyricsForEntry(entry);
  return {
    id: entry.id,
    theme: entry.theme,
    display: entry.display.trim(),
    aceCaption: caption,
    lyricsStructure,
    lang: entry.lang,
    genre: guessGenreFromPromptBank(entry.display, caption),
  };
}

export function findPromptBankByDisplay(display: string, uiLocale: AppLocale): PromptBankRoll | null {
  const needle = display.trim().toLowerCase();
  if (!needle) return null;
  const hit = poolForLocale(uiLocale).find((e) => e.display.trim().toLowerCase() === needle);
  if (!hit) return null;
  const caption = hit.acestep.caption.trim();
  return {
    id: hit.id,
    theme: hit.theme,
    display: hit.display.trim(),
    aceCaption: caption,
    lyricsStructure: bankLyricsForEntry(hit),
    lang: hit.lang,
    genre: guessGenreFromPromptBank(hit.display, caption),
  };
}
