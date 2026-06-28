import fs from "node:fs";
import { execSync } from "node:child_process";

const src = execSync("git show HEAD:packages/shared/src/generation/promptAce.ts", { encoding: "utf8" });
const lines = src.split(/\n/);
let beat = lines
  .slice(130, 225)
  .join("\n")
  .replace("const aceGenreTagsBeat", "export const ACE_GENRE_TAGS_BEAT")
  .replace(/\s*\.\.\.getExtendedAceTagMap\(\),?\s*$/m, "");
let song = lines
  .slice(226, 256)
  .join("\n")
  .replace("const aceGenreTagsSong", "export const ACE_GENRE_TAGS_SONG")
  .replace(/\s*\.\.\.aceGenreTagsBeat,\s*\n/, "\n");

const tail = `export function getAceGenreTagLine(genreKey: string, isSong: boolean): string {
  if (!genreKey || genreKey === "Auto") return "";
  const beat = { ...ACE_GENRE_TAGS_BEAT, ...getExtendedAceTagMap() };
  const song = { ...beat, ...ACE_GENRE_TAGS_SONG };
  const maps = isSong ? song : beat;
  return maps[genreKey] || genreKey;
}
`;

const out = `import { getExtendedAceTagMap } from "./extendedRegistry";

${beat};

${song};

${tail}
`;

fs.writeFileSync("packages/shared/src/generation/aceGenreTagMaps.ts", out);
