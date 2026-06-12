/**
 * Render all 3 community player themes for comparison.
 * Usage: npm run youtube:render-preview-themes -- [loopId]
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PLAYER_THEME_IDS } from "../lib/youtubePlayerThemes.mjs";

function loadDotEnv() {
  if (!existsSync(".env")) return;
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (!(k in process.env)) process.env[k] = v;
  }
}

loadDotEnv();

const LOOP_ID = (process.argv[2] ?? "1bca92cd-8c6f-454c-b532-693063de8231").trim();
const script = join(process.cwd(), "scripts", "youtube-render-preview.mjs");

for (const theme of PLAYER_THEME_IDS) {
  console.log(`\n——— ${theme} ———`);
  await new Promise((resolve, reject) => {
    const proc = spawn(process.execPath, ["--use-system-ca", script, LOOP_ID, theme], {
      stdio: "inherit",
      env: process.env,
    });
    proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`theme_${theme}_failed`))));
  });
}

console.log("\nDone:");
for (const theme of PLAYER_THEME_IDS) {
  console.log(`  tmp-youtube-${theme}-preview.mp4`);
}
