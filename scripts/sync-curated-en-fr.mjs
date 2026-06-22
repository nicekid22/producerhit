import fs from "node:fs";

const src = fs.readFileSync("src/lib/randomPromptIdeas/curatedDisplayPrompts.ts", "utf8");
const start = src.indexOf("const FR_SONG");
const end = src.indexOf("const POOLS:");
const body = src.slice(start, end);
const out = `import type { LocalePromptPools } from "../localePools/types";

${body}
export const CURATED_EN: LocalePromptPools = { song: EN_SONG, beat: EN_BEAT, hero: [] };
export const CURATED_FR: LocalePromptPools = { song: FR_SONG, beat: FR_BEAT, hero: [] };
`;
fs.writeFileSync("packages/shared/src/prompt/curated/en-fr.ts", out, "utf8");
console.log("ok", out.length);
