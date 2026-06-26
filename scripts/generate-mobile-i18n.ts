/**
 * Génère apps/mobile/lib/i18n/messages.generated.ts depuis le catalogue mobile EN/FR
 * + blocs L() du web (dashboardCatalog, settingsCatalog).
 *
 * Usage: npx tsx scripts/generate-mobile-i18n.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { UI_LOCALES, type AppLocale } from "../packages/shared/src/i18n/locales";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

type LBlock = Partial<Record<AppLocale, string>> & { en: string };

const WEB_KEY_MAP: Record<string, string> = {
  generateSong: "generateSong",
  generateBeat: "generateBeat",
  generating: "generating",
  loading: "loading",
  error: "error",
  genre: "genre",
  mood: "mood",
  lyrics: "lyrics",
  lyricsPlaceholder: "lyricsPlaceholder",
  language: "language",
  languageHint: "languageHint",
  contextChips: "contextChips",
  subscription: "subscription",
  upgrade: "upgrade",
  signOut: "signOut",
  email: "email",
  community: "community",
  themeLabel: "appearance",
  accountPreferences: "personalSpace",
  shareLink: "share",
  upgradePro: "upgrade",
  comparePlans: "comparePlans",
  delete: "delete",
  cancel: "cancel",
  retry: "retry",
  library: "library",
  typeBeat: "typeBeat",
  song: "songMode",
  tabCreate: "tabCreate",
  account: "tabAccount",
  studio: "studio",
  composing: "generating",
  composingSong: "generating",
  generatingBeat: "generating",
  signIn: "login",
  createAccount: "startFree",
  forgotPassword: "changePassword",
  password: "passwordPlaceholder",
  allGenre: "allGenres",
  filterAllGenres: "allGenres",
  promptLabel: "prompt",
  titleLabel: "title",
  variation: "newVariation",
  remix: "remixMode",
  downloadBeat: "download",
  publicTitle: "publicOnWeb",
  nowPlaying: "nowPlaying",
  openOnWeb: "openOnWeb",
  songIdea: "songIdea",
  songIdeaHint: "songIdeaHint",
  songIdeaRequired: "songIdeaRequired",
  ideaPromptHint: "ideaPromptHint",
  ideaPromptDiceHint: "ideaPromptDiceHint",
  acePreviewTitle: "acePreviewTitle",
  acePreviewNote: "acePreviewNote",
  acePreviewEnable: "acePreviewEnable",
  genLangAuto: "genLangAuto",
  genLangFr: "genLangFr",
  genLangEn: "genLangEn",
  diceAria: "diceAria",
  tabLibrary: "tabLibrary",
  tabExplore: "tabExplore",
  tabAccount: "tabAccount",
  legal: "legal",
  privacyPolicy: "privacy",
  termsOfService: "terms",
  playbackFailed: "playbackFailed",
  iapRequiresDevBuild: "iapRequiresDevBuild",
  iapPurchaseInProgress: "iapPurchaseInProgress",
  genErrorLimitReached: "genErrorLimitReached",
  genErrorRateLimit: "genErrorRateLimit",
  genErrorAuth: "genErrorAuth",
  genErrorTimeout: "genErrorTimeout",
  genErrorProvider: "genErrorProvider",
  genErrorGeneric: "genErrorGeneric",
  genVocalRegenerateHint: "genVocalRegenerateHint",
  purchaseFailed: "purchaseFailed",
  restoreFailed: "restoreFailed",
};

const LOCALE_NAV_MAP: Record<string, string> = {
  tabCreate: "app.tabCreate",
  tabLibrary: "app.library",
  tabExplore: "nav.community",
  tabAccount: "app.settings",
  library: "app.library",
  community: "nav.community",
  account: "app.settings",
  studio: "nav.studio",
  song: "landing.modeSong",
  typeBeat: "landing.modeBeat",
  generating: "landing.generating",
  composing: "landing.generating",
  composingSong: "landing.generating",
  generatingBeat: "landing.generating",
  signOut: "app.logout",
  signIn: "nav.login",
  createAccount: "nav.startFree",
  continue: "landing.create",
  getStarted: "nav.startFree",
  skip: "skip",
};

const WEB_FILES = [
  "src/i18n/dashboardCatalog.ts",
  "src/i18n/settingsCatalog.ts",
  "src/i18n/systemCatalog.ts",
  "src/i18n/loaderCatalog.ts",
  "src/i18n/remixStudioCatalog.ts",
  "src/i18n/loopCardCatalog.ts",
  "src/i18n/mobileAppCatalog.ts",
];

function unescapeString(s: string): string {
  return s
    .replace(/\\n/g, "\n")
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

function parseLBlocks(source: string): Map<string, LBlock> {
  const map = new Map<string, LBlock>();
  const keyRe = /^\s+(\w+):\s+L\(\{/gm;
  let match: RegExpExecArray | null;
  while ((match = keyRe.exec(source)) !== null) {
    const key = match[1]!;
    const start = match.index + match[0].length;
    let depth = 1;
    let i = start;
    while (i < source.length && depth > 0) {
      if (source[i] === "{") depth += 1;
      if (source[i] === "}") depth -= 1;
      i += 1;
    }
    const body = source.slice(start, i - 1);
    const block: LBlock = { en: "" };
    const localeRe = /(\w+):\s*"((?:\\.|[^"\\])*)"/g;
    let locMatch: RegExpExecArray | null;
    while ((locMatch = localeRe.exec(body)) !== null) {
      const loc = locMatch[1] as AppLocale;
      if ((UI_LOCALES as readonly string[]).includes(loc)) {
        block[loc] = unescapeString(locMatch[2]!);
      }
    }
    if (block.en) map.set(key, block);
  }
  return map;
}

function loadLocaleNavBlocks(): Map<string, LBlock> {
  const merged = new Map<string, LBlock>();
  const localesDir = path.join(root, "src/i18n/locales");
  if (!fs.existsSync(localesDir)) return merged;

  const blocksByPath = new Map<string, Partial<Record<AppLocale, string>>>();

  for (const loc of UI_LOCALES) {
    const file = path.join(localesDir, `${loc}.ts`);
    if (!fs.existsSync(file)) continue;
    const src = fs.readFileSync(file, "utf8");
    const sections = ["nav", "app", "landing"] as const;
    for (const section of sections) {
      const secRe = new RegExp(`${section}:\\s*\\{([^}]*(?:\\{[^}]*\\}[^}]*)*)\\}`, "s");
      const secMatch = src.match(secRe);
      if (!secMatch) continue;
      const body = secMatch[1]!;
      const propRe = /(\w+):\s*"((?:\\.|[^"\\])*)"/g;
      let m: RegExpExecArray | null;
      while ((m = propRe.exec(body)) !== null) {
        const pathKey = `${section}.${m[1]!}`;
        const entry = blocksByPath.get(pathKey) ?? {};
        entry[loc] = unescapeString(m[2]!);
        blocksByPath.set(pathKey, entry);
      }
    }
  }

  for (const [pathKey, partial] of blocksByPath) {
    if (!partial.en) continue;
    merged.set(pathKey, partial as LBlock);
  }
  return merged;
}

function loadWebBlocks(): Map<string, LBlock> {
  const merged = new Map<string, LBlock>();
  for (const rel of WEB_FILES) {
    const full = path.join(root, rel);
    if (!fs.existsSync(full)) continue;
    const src = fs.readFileSync(full, "utf8");
    for (const [k, v] of parseLBlocks(src)) {
      merged.set(k, v);
    }
  }
  for (const [k, v] of loadLocaleNavBlocks()) {
    merged.set(k, v);
  }
  return merged;
}

function parseMobileEnFr(): { en: Record<string, string>; fr: Record<string, string> } {
  const generatedPath = path.join(root, "apps/mobile/lib/i18n/messages.generated.ts");
  if (fs.existsSync(generatedPath)) {
    const src = fs.readFileSync(generatedPath, "utf8");
    const en: Record<string, string> = {};
    const fr: Record<string, string> = {};
    const keyRe = /^\s+(\w+):\s*\{/gm;
    let match: RegExpExecArray | null;
    while ((match = keyRe.exec(src)) !== null) {
      const key = match[1]!;
      const blockStart = match.index + match[0].length;
      const enM = src.slice(blockStart).match(/^\s+en:\s*"((?:\\.|[^"\\])*)"/m);
      const frM = src.slice(blockStart).match(/^\s+fr:\s*"((?:\\.|[^"\\])*)"/m);
      if (enM) en[key] = unescapeString(enM[1]!);
      if (frM) fr[key] = unescapeString(frM[1]!);
    }
    if (Object.keys(en).length > 0) return { en, fr };
  }

  const catalogPath = path.join(root, "apps/mobile/lib/i18n/catalog.ts");
  const src = fs.readFileSync(catalogPath, "utf8");
  const enMatch = src.match(/en:\s*\{([\s\S]*?)\n\s*\},\s*\n\s*fr:/);
  const frMatch = src.match(/fr:\s*\{([\s\S]*?)\n\s*\},\s*\n\}/);
  if (!enMatch || !frMatch) throw new Error("Could not parse mobile i18n source (catalog or messages.generated)");

  const parseObj = (body: string): Record<string, string> => {
    const out: Record<string, string> = {};
    const lineRe = /^\s+(\w+):\s*"((?:\\.|[^"\\])*)"/gm;
    let m: RegExpExecArray | null;
    while ((m = lineRe.exec(body)) !== null) {
      out[m[1]!] = unescapeString(m[2]!);
    }
    // multiline strings
    const multiRe = /^\s+(\w+):\s*\n\s*"((?:\\.|[^"\\])*)"/gm;
    while ((m = multiRe.exec(body)) !== null) {
      out[m[1]!] = unescapeString(m[2]!);
    }
    const concatRe = /^\s+(\w+):\s*\n\s*"((?:\\.|[^"\\])*)"\s*\+/gm;
    while ((m = concatRe.exec(body)) !== null) {
      const key = m[1]!;
      const restStart = m.index + m[0].length;
      const restEnd = body.indexOf('",', restStart);
      const rest = restEnd > restStart ? body.slice(restStart, restEnd) : "";
      const full = m[2]! + unescapeString(rest.replace(/^\s*"/, "").replace(/"\s*$/, ""));
      out[key] = full;
    }
    return out;
  };

  return { en: parseObj(enMatch[1]!), fr: parseObj(frMatch[1]!) };
}

function fillBlock(en: string, fr: string, web?: LBlock): Record<AppLocale, string> {
  const out = {} as Record<AppLocale, string>;
  for (const loc of UI_LOCALES) {
    if (web?.[loc]) {
      out[loc] = web[loc]!;
    } else if (loc === "fr") {
      out[loc] = fr;
    } else if (loc === "en") {
      out[loc] = en;
    } else {
      out[loc] = web?.en ?? en;
    }
  }
  return out;
}

function escapeTs(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

function main() {
  const web = loadWebBlocks();
  const { en, fr } = parseMobileEnFr();
  const keys = new Set(Object.keys(en));

  for (const [mobileKey, webKey] of Object.entries(WEB_KEY_MAP)) {
    keys.add(mobileKey);
    const webBlock = web.get(webKey);
    if (!webBlock) continue;
    if (!en[mobileKey]) en[mobileKey] = webBlock.en;
    if (!fr[mobileKey]) fr[mobileKey] = webBlock.fr ?? webBlock.en;
  }

  const sortedKeys = [...keys].sort();

  const lines: string[] = [
    `/* eslint-disable max-lines -- généré par scripts/generate-mobile-i18n.ts */`,
    `import type { AppLocale } from "@producerhit/shared";`,
    ``,
    `export type MobileMessages = Record<string, Record<AppLocale, string>>;`,
    ``,
    `export const MOBILE_MESSAGES: MobileMessages = {`,
  ];

  let mapped = 0;
  for (const key of sortedKeys) {
    const navPath = LOCALE_NAV_MAP[key];
    const webKey = WEB_KEY_MAP[key];
    const webBlock = navPath ? web.get(navPath) : webKey ? web.get(webKey) : undefined;
    if (webBlock) mapped += 1;
    const block = fillBlock(en[key]!, fr[key] ?? en[key]!, webBlock);
    lines.push(`  ${key}: {`);
    for (const loc of UI_LOCALES) {
      lines.push(`    ${loc}: "${escapeTs(block[loc])}",`);
    }
    lines.push(`  },`);
  }
  lines.push(`};`);
  lines.push(``);

  const outPath = path.join(root, "apps/mobile/lib/i18n/messages.generated.ts");
  fs.writeFileSync(outPath, lines.join("\n"), "utf8");
  console.log(`Wrote ${sortedKeys.length} keys (${mapped} mapped from web) → ${outPath}`);
}

main();
