/**
 * Génère v4.json — 200 prompts chanson « good vibes » supplémentaires (100 EN + 100 FR).
 * IDs 2101–2300. Thème good_vibes (même format que v3).
 *
 * Usage: npx tsx scripts/generate-prompt-bank-v4-good-vibes.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSingableLyricsFromBankEntry } from "../packages/shared/src/prompt/promptBank/buildBankLyrics";
import { goodVibesSpecFromHook } from "../packages/shared/src/prompt/promptBank/genreRotationGoodVibes";
import {
  GOOD_VIBES_HOOKS_EN_V4,
  GOOD_VIBES_HOOKS_FR_V4,
} from "../packages/shared/src/prompt/promptBank/singableHookPools";
import type { PromptBankEntry } from "../packages/shared/src/prompt/promptBank/types";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outPath = path.join(root, "packages/shared/data/prompt-bank/v4.json");

const THEME = "good_vibes";
const THEME_LABEL_EN = "Good Vibes & Happy Moments";
const THEME_LABEL_FR = "Bonnes ondes & moments heureux";

type Spec = ReturnType<typeof goodVibesSpecFromHook>;

function buildCaption(spec: Spec): string {
  return `${spec.captionGenre}, ${spec.mood}, ${spec.instruments}, ${spec.bpm} bpm, hi-fi, uplifting energy, polished studio mix`;
}

function buildDisplay(spec: Spec): string {
  return `${spec.hook} — ${spec.genre}, ${spec.bpm} bpm`;
}

function toEntry(id: number, lang: "en" | "fr", spec: Spec): PromptBankEntry {
  const display = buildDisplay(spec);
  const caption = buildCaption(spec);
  const lyrics_structure = buildSingableLyricsFromBankEntry({
    display,
    lyrics_structure: "",
    lang,
    theme: THEME,
    id,
  });
  return {
    id,
    theme: THEME,
    theme_label_en: THEME_LABEL_EN,
    theme_label_fr: THEME_LABEL_FR,
    lang,
    display,
    acestep: { caption, lyrics_structure },
  };
}

function specsFromHooks(hooks: readonly string[]): Spec[] {
  return hooks.map((hook, i) => goodVibesSpecFromHook(hook, i));
}

const entries: PromptBankEntry[] = [];
let id = 2101;
for (const spec of specsFromHooks(GOOD_VIBES_HOOKS_EN_V4)) {
  entries.push(toEntry(id++, "en", spec));
}
for (const spec of specsFromHooks(GOOD_VIBES_HOOKS_FR_V4)) {
  entries.push(toEntry(id++, "fr", spec));
}

if (GOOD_VIBES_HOOKS_EN_V4.length !== 100 || GOOD_VIBES_HOOKS_FR_V4.length !== 100) {
  throw new Error("v4 expects exactly 100 EN + 100 FR hooks");
}

fs.writeFileSync(outPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
console.log(`Wrote ${entries.length} entries to ${outPath} (ids ${entries[0]?.id}–${entries[entries.length - 1]?.id})`);
