/**
 * Health check — YouTube multi-channel + cadence policy.
 * Usage: npm run youtube:setup-check
 */
import { existsSync, readFileSync } from "node:fs";
import { listYouTubeAccountIds, loadYouTubeAccount, resolveOAuthCredentials } from "../lib/youtubeAccounts.mjs";
import { youtubePreviewSec } from "../lib/youtubeVideoRender.mjs";
import { playerThemeForAccount } from "../lib/youtubePlayerThemes.mjs";

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

const perChannelH = (Number(process.env.YOUTUBE_MIN_INTERVAL_SEC ?? "10800") / 3600).toFixed(1);
const globalH = (Number(process.env.YOUTUBE_GLOBAL_MIN_INTERVAL_SEC ?? "3600") / 3600).toFixed(1);
const daily = process.env.YOUTUBE_MAX_DAILY_PER_ACCOUNT ?? "6";
const accounts = listYouTubeAccountIds();
const ready = accounts.map((id) => loadYouTubeAccount(id)).filter(Boolean);

console.log("\n📺 ProducerHit — YouTube setup\n");
console.log(`Accounts configured : ${accounts.join(", ")}`);
console.log(`Accounts ready      : ${ready.length}/${accounts.length}`);
console.log(`Preview length      : ${youtubePreviewSec()}s (Shorts ≤59s)`);
console.log(`Cadence per channel : ${perChannelH}h min between posts`);
console.log(`Cadence global      : ${globalH}h min between any post`);
console.log(`Daily cap / channel : ${daily} uploads (UTC day)`);
console.log(`Queue batch         : ${process.env.SOCIAL_PUBLISH_QUEUE_BATCH ?? "1"} loop/cron tick`);
console.log(`Community template  : ${process.env.YOUTUBE_COMMUNITY_TEMPLATE ?? "player"}`);
console.log(`Player themes       : vibez→${playerThemeForAccount("vibez")} · market→${playerThemeForAccount("market")} · override=${process.env.YOUTUBE_PLAYER_THEME ?? "—"}`);
console.log(`Viral visual        : ${process.env.YOUTUBE_VIRAL_VISUAL ?? "cover"} (cover = art loop, stock = Pexels)`);
console.log(`Pexels (si stock)   : ${process.env.PEXELS_API_KEY?.trim() ? "✅ configured" : "— (mode cover par défaut)"}\n`);

for (const id of accounts) {
  const { clientId, channelUrl, refreshEnvKey } = resolveOAuthCredentials(id);
  const acc = loadYouTubeAccount(id);
  const tokenOk = acc ? "✅" : "❌";
  console.log(`${tokenOk} ${id.padEnd(8)} ${channelUrl || "—"}`);
  if (!clientId) console.log(`   ⚠ missing client id`);
  if (!acc) console.log(`   ⚠ set ${refreshEnvKey} (npm run youtube:oauth -- --account ${id})`);
}

console.log("\nPolicy (5 channels):");
console.log(`  ~${globalH}h between posts globally → max ~${Math.floor(24 / Number(globalH))}/day total`);
console.log(`  ~${daily}/day/channel max → ~${Number(daily) * ready.length}/day ceiling`);
console.log("\nViral series → channel:");
console.log("  comment_to_song  → @producerhitAI");
console.log("  absurd_to_song   → @BeatmakerUnion");
console.log("  guess_prompt     → @Lowdey\n");

if (ready.length < accounts.length) {
  process.exitCode = 1;
}
