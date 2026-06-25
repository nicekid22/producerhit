/**
 * Bake singable lyrics into prompt-bank JSON (replaces placeholder structures).
 * Runtime also resolves placeholders via resolveBankLyrics — this script is optional.
 *
 * Usage: npx tsx scripts/generate-prompt-bank-lyrics.ts [--write]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hasPlaceholderBankLyrics, resolveBankLyrics } from "../packages/shared/src/prompt/promptBank/buildBankLyrics";
import type { PromptBankEntry } from "../packages/shared/src/prompt/promptBank/types";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const write = process.argv.includes("--write");

for (const file of ["v1.json", "v2.json"]) {
  const filePath = path.join(root, "packages/shared/data/prompt-bank", file);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8")) as PromptBankEntry[];
  let changed = 0;
  let placeholders = 0;

  for (const entry of data) {
    const before = entry.acestep.lyrics_structure;
    if (!hasPlaceholderBankLyrics(before)) continue;
    placeholders += 1;
    const after = resolveBankLyrics({
      display: entry.display,
      lyrics_structure: before,
      lang: entry.lang,
      theme: entry.theme,
      id: entry.id,
    });
    if (after !== before) {
      entry.acestep.lyrics_structure = after;
      changed += 1;
    }
  }

  console.log(`${file}: ${changed}/${placeholders} placeholder entries baked (${data.length} total)`);
  if (write && changed > 0) {
    fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  }
}

if (!write) {
  console.log("Dry run — pass --write to save files.");
}
