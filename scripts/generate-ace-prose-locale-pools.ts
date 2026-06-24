#!/usr/bin/env node
/**
 * Génère poolLocales.generated.ts — 250 song + 250 beat par locale (hors en).
 * Usage: npx tsx scripts/generate-ace-prose-locale-pools.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateUniqueAceProsePool } from "../packages/shared/src/prompt/aceProse/generate.ts";
import { optimizeAceProsePrompt } from "../packages/shared/src/prompt/aceProse/optimize.ts";
import {
  ACE_PROSE_LOCALE_SEEDS,
  listAceProseLocales,
  type AceProseLocale,
} from "../packages/shared/src/prompt/aceProse/locales/index.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../packages/shared/src/prompt/aceProse/poolLocales.generated.ts");

const COUNT = 250;
const locales = listAceProseLocales().filter((l) => l !== "en") as Exclude<AceProseLocale, "en">[];

const pools: Record<string, { song: string[]; beat: string[] }> = {};

for (const locale of locales) {
  const base = ACE_PROSE_LOCALE_SEEDS[locale];
  const songRaw = generateUniqueAceProsePool("song", COUNT, base, locale);
  const beatRaw = generateUniqueAceProsePool("beat", COUNT, base + 50_000, locale);
  const song = songRaw.map((p) => optimizeAceProsePrompt(p));
  const beat = beatRaw.map((p) => optimizeAceProsePrompt(p));

  if (song.length < COUNT || beat.length < COUNT) {
    console.error(`${locale}: song=${song.length}/${COUNT}, beat=${beat.length}/${COUNT}`);
    process.exit(1);
  }

  pools[locale] = { song, beat };
  console.log(`✓ ${locale}: ${song.length} song + ${beat.length} beat`);
}

const ts = `/** Auto-generated — npx tsx scripts/generate-ace-prose-locale-pools.ts */
import type { AceProseLocale } from "./locales";

export type AceProseLocalePools = Record<
  Exclude<AceProseLocale, "en">,
  { readonly song: readonly string[]; readonly beat: readonly string[] }
>;

export const ACE_PROSE_LOCALE_POOLS: AceProseLocalePools = ${JSON.stringify(pools, null, 2)} as const;
`;

fs.writeFileSync(OUT, ts, "utf8");
console.log(`Wrote → ${OUT}`);
