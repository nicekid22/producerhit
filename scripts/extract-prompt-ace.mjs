import fs from "fs";
import path from "path";

const src = fs.readFileSync("src/lib/promptBuilder.ts", "utf8");
const start = src.indexOf("function clean(s: string)");
const end = src.indexOf("export function buildRichPrompt");
let body = src.slice(start, end);
body = body.replace(/\.\.\.extendedGenreBpmMap\(\)/g, "...getExtendedBpmMap()");
body = body.replace(/\.\.\.extendedGenreAceTagMap\(\)/g, "...getExtendedAceTagMap()");
body = body.replace(/influenceMap\[/g, "resolveInfluenceMap()[");
body = body.replace(/moodMap\[/g, "resolveMoodMap()[");
body = body.replace(/energyMap\[/g, "ENERGY_MAP[");
body = body.replace(/reverbMap\[/g, "REVERB_MAP[");

const header = [
  "import type { GenerateParams } from './types';",
  "import { BASE_INFLUENCE_MAP, BASE_MOOD_MAP, ENERGY_MAP, REVERB_MAP } from './catalogMaps';",
  "import { getExtendedAceTagMap, getExtendedBpmMap, getInfluenceMap, getMoodMap } from './extendedRegistry';",
  "",
  "function resolveMoodMap(): Record<string, string> {",
  "  return { ...BASE_MOOD_MAP, ...getMoodMap() };",
  "}",
  "",
  "function resolveInfluenceMap(): Record<string, string> {",
  "  return { ...BASE_INFLUENCE_MAP, ...getInfluenceMap() };",
  "}",
  "",
].join("\n");

const out = path.join("packages/shared/src/generation/promptAce.ts");
fs.writeFileSync(out, header + body, "utf8");
console.log("wrote", out);
