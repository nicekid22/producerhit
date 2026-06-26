import type { AppLocale } from "../i18n/locales";

/** ACE Step 1.5 — le thème narratif va en tags EN mood, jamais en phrase locale brute. */

/** Sujet narratif avant le tiret long (banque 2000) : « Danser… — soul ballade, 65 bpm ». */
export function extractPromptBankSubject(display: string): string {
  const parts = display.split(/[—–]/);
  if (parts.length >= 2) return parts[0]?.trim() ?? "";
  return "";
}

const THEME_SUFFIX_PATTERNS: RegExp[] = [
  /\bsur\s+(.+)$/i,
  /\babout\s+(.+)$/i,
  /\bsobre\s+(.+)$/i,
  /\bsu\s+(.+)$/i,
  /\büber\s+(.+)$/i,
  /\bfor\s+(.+)$/i,
  /\bpour\s+(.+)$/i,
];

/** Thèmes dice exacts (normalisés) → tags ACE mood EN courts. */
const THEME_MOOD_TAGS: Record<string, string> = {
  "sur un matin lent sans urgence": "slow morning light, unhurried intimate mood, soft daylight calm",
  "about a slow morning with nowhere to be":
    "slow morning light, unhurried intimate mood, soft daylight calm",
  "sur un retour en ville apres des annees loin": "homecoming mood, city return nostalgia, bittersweet familiarity",
  "about coming back to your city after years away":
    "homecoming mood, city return nostalgia, bittersweet familiarity",
  "sur des retrouvailles qui font du bien": "warm reunion, healing connection, gentle joy",
  "about reuniting with people who still feel like home":
    "warm reunion, healing connection, gentle joy",
  "about a lazy sunday with no alarm":
    "slow sunday morning, unhurried intimate mood, soft daylight calm",
  "sobre un domingo sin despertador":
    "slow sunday morning, unhurried intimate mood, soft daylight calm",
  "sur avoir dit non au patron": "quiet rebellion, personal freedom mood, defiant relief",
  "about saying no to your boss for once": "quiet rebellion, personal freedom mood, defiant relief",
  "sur retrouver ton groupe de potes apres des annees":
    "reunion with old friends, nostalgic warmth, bittersweet joy",
  "about reuniting with old friends": "reunion with old friends, nostalgic warmth, bittersweet joy",
  "sur la panique avant ton premier live": "pre-show nerves, adrenaline tension, vulnerable anticipation",
  "about pre-show nerves before your first gig":
    "pre-show nerves, adrenaline tension, vulnerable anticipation",
  "sur une rupture douce-amere": "bittersweet breakup, tender heartache, emotional honesty",
  "about a bittersweet breakup": "bittersweet breakup, tender heartache, emotional honesty",
  "sur une romance sensuelle": "sensual romance, late-night intimacy, warm desire",
  "about a sensual romance": "sensual romance, late-night intimacy, warm desire",
  "sur une histoire nocturne": "nocturnal story mood, city lights haze, after-midnight feel",
  "about a nocturnal story": "nocturnal story mood, city lights haze, after-midnight feel",
  "sur une emotion brute": "raw emotional delivery, unfiltered honesty, visceral feeling",
  "about raw emotion": "raw emotional delivery, unfiltered honesty, visceral feeling",
  "sur un moment de verite": "moment of truth, candid vulnerability, stripped-back honesty",
  "about a moment of truth": "moment of truth, candid vulnerability, stripped-back honesty",
  "sur une vibe cinematique": "cinematic atmosphere, widescreen emotion, dramatic pacing",
  "about a cinematic vibe": "cinematic atmosphere, widescreen emotion, dramatic pacing",
};

function normalizeThemeKey(theme: string): string {
  return theme
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ");
}

function stripDiceShell(display: string): string {
  return display
    .trim()
    .replace(/^(une chanson|un beat|a [a-z0-9][\w\s\-'&]* song|a [a-z0-9][\w\s\-'&]* beat)\s+/i, "")
    .trim();
}

export function extractDiceThemePhrase(display: string): string {
  const t = display.trim();
  if (!t) return "";

  for (const re of THEME_SUFFIX_PATTERNS) {
    const m = t.match(re);
    if (m?.[1]) return m[1].replace(/[.!?]+$/g, "").trim();
  }
  return "";
}

function heuristicMoodFromTheme(theme: string, _locale: AppLocale): string {
  const raw = normalizeThemeKey(theme);
  if (!raw) return "";

  const bits: string[] = [];
  if (/\b(matin|morning|lent|slow)\b/.test(raw)) bits.push("slow morning light");
  if (/\b(alarme|alarm|despertador)\b/.test(raw)) bits.push("unhurried calm");
  if (/\b(nuit|night|nocturn|midnight|soir)\b/.test(raw)) bits.push("nocturnal mood");
  if (/\b(amour|love|romance|cœur|coeur|heart)\b/.test(raw)) bits.push("romantic emotional theme");
  if (/\b(rupture|breakup|heartbreak|desamor)\b/.test(raw)) bits.push("heartbreak atmosphere");
  if (/\b(ami|friends|potes|retrouver|reunion)\b/.test(raw)) bits.push("nostalgic reunion warmth");
  if (/\b(rue|street|banlieue|suburb)\b/.test(raw)) bits.push("street life atmosphere");
  if (/\b(fete|party|club|festival|perreo)\b/.test(raw)) bits.push("party energy");
  if (/\b(pluie|rain|pluvieu)\b/.test(raw)) bits.push("rainy atmospheric mood");
  if (/\b(voyage|journey|desert|tokyo|mer|beach|plage)\b/.test(raw)) bits.push("travel atmosphere");
  if (/\b(rebell|revolt|confiance|confidence)\b/.test(raw)) bits.push("defiant confidence");
  if (/\b(cinema|cinematic|film|noir|hero)\b/.test(raw)) bits.push("cinematic atmosphere");
  if (/\b(danser|dance|dancing|danse)\b/.test(raw)) bits.push("slow intimate dance feel");
  if (/\b(cuisine|kitchen)\b/.test(raw)) bits.push("domestic kitchen intimacy");
  if (/\b(2h|2 h|deux heures|3am|3 am|3h)\b/.test(raw)) bits.push("after-midnight hush");
  if (/\b(lent|lentement|slowly|slow)\b/.test(raw)) bits.push("unhurried tender pacing");
  if (/\b(pleurer|pleurant|crying|tears)\b/.test(raw)) bits.push("tearful emotional release");
  if (/\b(therapie|therapy|journal)\b/.test(raw)) bits.push("cathartic self-reflection mood");
  if (/\b(mamie|grandma|grandmother|enfance|childhood)\b/.test(raw)) bits.push("nostalgic family warmth");
  if (/\b(effacer|unsent|delete|envoyer|send)\b/.test(raw)) bits.push("unsent message tension");

  if (bits.length > 0) return [...new Set(bits)].slice(0, 4).join(", ");

  const words = raw
    .replace(/\b(un|une|le|la|les|des|du|de|d'|ton|ta|tes|mon|ma|mes|avec|sans|pour|sur|the|a|an|your|my)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter((w) => w.length > 2)
    .slice(0, 4);
  if (words.length === 0) return "";
  return `${words.join(" ")} mood`;
}

/** Thème banque 2000 (sujet avant —) → tags mood EN. */
export function themeAceTagsFromPromptBankDisplay(display: string, locale: AppLocale = "en"): string {
  const subject = extractPromptBankSubject(display);
  if (!subject) return "";
  return heuristicMoodFromTheme(subject, locale);
}

/** Convertit le thème d'un prompt dice/display en tags ACE mood EN (caption only). */
export function themeAceTagsFromDiceDisplay(display: string, locale: AppLocale = "en"): string {
  const trimmed = display.trim();
  if (!trimmed) return "";

  const bankSubject = extractPromptBankSubject(trimmed);
  if (bankSubject) return themeAceTagsFromPromptBankDisplay(trimmed, locale);

  const explicitTheme = extractDiceThemePhrase(trimmed);
  const themeKey = normalizeThemeKey(explicitTheme || stripDiceShell(trimmed));
  if (!themeKey) return "";

  const mapped = THEME_MOOD_TAGS[themeKey];
  if (mapped) return mapped;

  return heuristicMoodFromTheme(explicitTheme || themeKey, locale);
}

/** Rejette les tags qui ressemblent à une phrase locale (ne doit pas aller dans caption ACE). */
export function isNonEnglishCaptionTag(tag: string): boolean {
  const t = tag.trim();
  if (!t || t.length < 18) return false;
  if (
    /\b(une chanson|un beat|sur un|sur la|sur une|sur les|pour un|pour une|about a lazy|dimanche sans)\b/i.test(
      t,
    )
  ) {
    return true;
  }
  const frMarkers =
    (t.match(/\b(sur|une|un|des|les|pour|avec|sans|ton|ta|tes|mon|ma|mes|chanson|beat)\b/gi) ?? []).length;
  const enMarkers =
    (t.match(/\b(about|the|your|with|without|song|beat|for)\b/gi) ?? []).length;
  return frMarkers >= 2 && frMarkers > enMarkers;
}

export function stripNonEnglishCaptionTags(caption: string): string {
  const parts = caption.split(",").map((p) => p.trim()).filter(Boolean);
  const filtered = parts.filter((p) => !isNonEnglishCaptionTag(p));
  return filtered.join(", ");
}
