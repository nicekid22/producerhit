#!/usr/bin/env node
/**
 * Génère pool500.json — 250 chansons + 250 beats ACE prose uniques.
 * Usage: npx tsx scripts/generate-ace-prose-pool.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateUniqueAceProsePool } from "../packages/shared/src/prompt/aceProse/generate.ts";
import { optimizeAceProsePrompt } from "../packages/shared/src/prompt/aceProse/optimize.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../packages/shared/src/prompt/aceProse/pool500.generated.ts");

const SONG_COUNT = 250;
const BEAT_COUNT = 250;

const songRaw = generateUniqueAceProsePool("song", SONG_COUNT, 42);
const beatRaw = generateUniqueAceProsePool("beat", BEAT_COUNT, 9001);

const song = songRaw.map((p) => optimizeAceProsePrompt(p));
const beat = beatRaw.map((p) => optimizeAceProsePrompt(p));

const uniqueSong = [...new Set(song)];
const uniqueBeat = [...new Set(beat)];

if (uniqueSong.length < SONG_COUNT || uniqueBeat.length < BEAT_COUNT) {
  console.error(`Pool incomplet: song=${uniqueSong.length}/${SONG_COUNT}, beat=${uniqueBeat.length}/${BEAT_COUNT}`);
  process.exit(1);
}

const payload = {
  version: 1,
  generatedAt: new Date().toISOString(),
  song: uniqueSong.slice(0, SONG_COUNT),
  beat: uniqueBeat.slice(0, BEAT_COUNT),
};

const ts = `/** Auto-generated — npx tsx scripts/generate-ace-prose-pool.ts */
export const ACE_PROSE_SONG_POOL: readonly string[] = ${JSON.stringify(payload.song, null, 2)} as const;

export const ACE_PROSE_BEAT_POOL: readonly string[] = ${JSON.stringify(payload.beat, null, 2)} as const;
`;

fs.writeFileSync(OUT, ts, "utf8");
console.log(`Wrote ${payload.song.length} song + ${payload.beat.length} beat prompts → ${OUT}`);
