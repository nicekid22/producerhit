/**
 * Export web ALL_GENRE_OPTIONS → shared JSON for mobile + unified dice.
 * Run: npx tsx scripts/export-genre-catalog.ts
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ALL_GENRE_OPTIONS } from "../src/lib/genres/index.ts";
import { FROM_IDEA_GENRE_VALUE, RANDOM_GENRE_VALUE } from "../src/lib/genres/genrePickMode.ts";

const root = dirname(fileURLToPath(import.meta.url));
const outPath = join(root, "../packages/shared/src/genres/allGenreOptions.json");

const options = ALL_GENRE_OPTIONS.filter(
  (o) => o.value !== FROM_IDEA_GENRE_VALUE && o.value !== "Auto" && o.value !== RANDOM_GENRE_VALUE,
).map((o) => ({
  value: o.value,
  label: o.label ?? o.value,
  group: o.group ?? "Other",
}));

writeFileSync(outPath, JSON.stringify(options));
console.log(`Wrote ${options.length} genres → ${outPath}`);
