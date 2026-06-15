/**
 * Push all YouTube secrets from .env to Supabase Edge (production cron).
 * Usage: npm run youtube:sync-secrets
 */
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { listYouTubeAccountIds, loadYouTubeAccount, resolveOAuthCredentials } from "../lib/youtubeAccounts.mjs";

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

const KEYS = [
  "YOUTUBE_ACCOUNTS",
  "YOUTUBE_CLIENT_ID",
  "YOUTUBE_CLIENT_SECRET",
  "YOUTUBE_REFRESH_TOKEN",
  "YOUTUBE_CHANNEL_URL",
  "YOUTUBE_MARKET_CLIENT_ID",
  "YOUTUBE_MARKET_CLIENT_SECRET",
  "YOUTUBE_MARKET_REFRESH_TOKEN",
  "YOUTUBE_MARKET_CHANNEL_URL",
  "YOUTUBE_LOWDEY_CLIENT_ID",
  "YOUTUBE_LOWDEY_CLIENT_SECRET",
  "YOUTUBE_LOWDEY_REFRESH_TOKEN",
  "YOUTUBE_LOWDEY_CHANNEL_URL",
  "YOUTUBE_PRODUCERHITAI_CLIENT_ID",
  "YOUTUBE_PRODUCERHITAI_CLIENT_SECRET",
  "YOUTUBE_PRODUCERHITAI_REFRESH_TOKEN",
  "YOUTUBE_PRODUCERHITAI_CHANNEL_URL",
  "YOUTUBE_BEATMAKERUNION_CLIENT_ID",
  "YOUTUBE_BEATMAKERUNION_CLIENT_SECRET",
  "YOUTUBE_BEATMAKERUNION_REFRESH_TOKEN",
  "YOUTUBE_BEATMAKERUNION_CHANNEL_URL",
  "TREND_REMIX_YOUTUBE_ACCOUNTS",
  "TREND_REMIX_AUTO_PUBLISH",
  "TREND_REMIX_LANDSCAPE_THEME",
  "TREND_REMIX_DURATION_SEC",
  "TREND_REMIX_MAX_SEC",
  "YOUTUBE_REMIX1_CLIENT_ID",
  "YOUTUBE_REMIX1_CLIENT_SECRET",
  "YOUTUBE_REMIX1_REFRESH_TOKEN",
  "YOUTUBE_REMIX1_CHANNEL_URL",
  "YOUTUBE_REMIX2_CLIENT_ID",
  "YOUTUBE_REMIX2_CLIENT_SECRET",
  "YOUTUBE_REMIX2_REFRESH_TOKEN",
  "YOUTUBE_REMIX2_CHANNEL_URL",
  "YOUTUBE_PRIVACY_STATUS",
  "YOUTUBE_PREVIEW_SEC",
  "YOUTUBE_VIRAL_PREVIEW_SEC",
  "YOUTUBE_MIN_INTERVAL_SEC",
  "YOUTUBE_GLOBAL_MIN_INTERVAL_SEC",
  "YOUTUBE_MAX_DAILY_PER_ACCOUNT",
  "SOCIAL_PUBLISH_QUEUE_BATCH",
  "SOCIAL_PUBLISH_PLATFORMS",
  "SOCIAL_PUBLISH_CRON_SECRET",
  "YOUTUBE_COMMUNITY_TEMPLATE",
  "YOUTUBE_PLAYER_THEME",
  "YOUTUBE_VIRAL_VISUAL",
  "PEXELS_API_KEY",
  "YOUTUBE_RENDER_URL",
];

const pairs = KEYS.map((k) => {
  const v = (process.env[k] ?? "").trim();
  return v ? `${k}=${v}` : null;
}).filter(Boolean);

if (!pairs.length) {
  console.error("No YouTube secrets in .env");
  process.exit(1);
}

console.log(`Sync ${pairs.length} secrets to Supabase…\n`);
const accounts = listYouTubeAccountIds();
const ready = accounts.filter((id) => loadYouTubeAccount(id));
console.log(`Accounts ready: ${ready.length}/${accounts.length} → ${ready.join(", ")}\n`);

const res = spawnSync("supabase", ["secrets", "set", ...pairs], {
  encoding: "utf8",
  shell: true,
});

if (res.stdout) process.stdout.write(res.stdout);
if (res.stderr) process.stderr.write(res.stderr);

if (res.status !== 0) {
  console.error("\n❌ supabase secrets set failed. Install CLI + supabase link, or set manually in dashboard.");
  process.exit(res.status ?? 1);
}

console.log("\n✅ Supabase secrets updated. Redeploy social-publish-cron if needed.");
