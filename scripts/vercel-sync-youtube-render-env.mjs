/**
 * Push youtube-render env vars to Vercel production.
 * Usage: npm run vercel:sync-youtube-render-env
 */
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

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

const DEFAULTS = {
  YOUTUBE_COMMUNITY_TEMPLATE: "player",
  YOUTUBE_VIRAL_VISUAL: "cover",
  YOUTUBE_PREVIEW_SEC: "45",
  YOUTUBE_VIRAL_PREVIEW_SEC: "18",
};

const KEYS = [
  "SOCIAL_PUBLISH_CRON_SECRET",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_URL",
  "YOUTUBE_COMMUNITY_TEMPLATE",
  "YOUTUBE_VIRAL_VISUAL",
  "YOUTUBE_PLAYER_THEME",
  "YOUTUBE_PREVIEW_SEC",
  "YOUTUBE_VIRAL_PREVIEW_SEC",
  "PEXELS_API_KEY",
];

for (const key of KEYS) {
  const value =
    (process.env[key] ?? "").trim() ||
    (key === "SUPABASE_URL" ? (process.env.VITE_SUPABASE_URL ?? "").trim() : "") ||
    DEFAULTS[key] ||
    "";
  if (!value) {
    console.warn(`⏭️  ${key} manquant dans .env`);
    continue;
  }

  console.log(`Setting Vercel production env: ${key}`);
  const res = spawnSync("npx", ["vercel", "env", "add", key, "production", "--force"], {
    input: value,
    encoding: "utf8",
    shell: true,
  });
  if (res.stdout) process.stdout.write(res.stdout);
  if (res.stderr) process.stderr.write(res.stderr);
  if (res.status !== 0) {
    console.error(`❌ Failed: ${key}`);
    process.exit(1);
  }
}

console.log("\n✅ Vercel env synced. Redeploying production…");
const deploy = spawnSync("npx", ["vercel", "deploy", "--prod", "--yes"], {
  encoding: "utf8",
  shell: true,
  stdio: "inherit",
});
process.exit(deploy.status ?? 1);
