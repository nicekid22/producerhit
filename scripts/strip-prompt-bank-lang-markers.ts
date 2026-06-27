/**
 * Retire les marqueurs langue ajoutés manuellement dans lyrics_structure
 * (ex. [fr], [en] après [intro]) — sans toucher au runtime ACE / normalizeAceLyrics.
 *
 * Usage: npx tsx scripts/strip-prompt-bank-lang-markers.ts [--write]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const write = process.argv.includes("--write");

/** Ligne seule = tag langue ACE ajouté à la main dans la banque. */
const STANDALONE_LANG_LINE = /^\[(fr|en|es|de|it|pt|ja|ko|zh|ar|ru|nl|pl|sv|tr|vi|id|hi|th|uk|cs|da|fi|el|he|hu|no|ro|sk|bg|hr|lt|lv|sl|et|ms|fil|sw|af|ca|eu|gl|is|ga|cy|mt|sq|mk|sr|bs|be|kk|uz|az|hy|ka|mn|ne|si|ta|te|bn|gu|kn|ml|mr|pa|ur|fa|ps|ku|am|yo|ig|ha|zu|xh|st|tn|sn|rw|mg|so|om|ti|lg|ny|sm|to|mi|haw|fj|ty|co|lb|fy|gd|br|oc|sc|an|ast|ext|vec|fur|lad|rm|wa|fo|kl|se|sma|smj|smn|sms|bs|cnr)\]$/i;

export function stripManualLangMarkersFromLyrics(lyrics: string): string {
  if (!lyrics.trim()) return lyrics;

  const lines = lyrics.split("\n");
  const filtered = lines.filter((line) => !STANDALONE_LANG_LINE.test(line.trim()));
  return filtered
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

for (const file of ["v1.json", "v2.json", "v3.json", "v4.json"]) {
  const filePath = path.join(root, "packages/shared/data/prompt-bank", file);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8")) as Array<{
    id: string;
    acestep: { lyrics_structure: string };
  }>;
  let changed = 0;

  for (const entry of data) {
    const before = entry.acestep.lyrics_structure;
    const after = stripManualLangMarkersFromLyrics(before);
    if (after !== before) {
      entry.acestep.lyrics_structure = after;
      changed += 1;
    }
  }

  console.log(`${file}: ${changed}/${data.length} entries cleaned`);
  if (write && changed > 0) {
    fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  }
}

if (!write) {
  console.log("Dry run — pass --write to save files.");
}
