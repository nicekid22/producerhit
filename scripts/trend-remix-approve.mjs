/**
 * Approve trend remix theme → full render (+ optional YouTube publish).
 * Usage:
 *   npm run trend:approve -- <loopId> <theme> [--publish]
 *   theme: liquid-dark | liquid-light | liquid-warm
 */
import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { renderAndUploadTrendRemixVideo } from "../lib/trendRemixVideoRender.mjs";
import { publishTrendRemixLoop } from "../lib/trendRemixPublish.mjs";
import { normalizeTrendRemixTheme, TREND_REMIX_LANDSCAPE_THEMES } from "../lib/youtubeTrendRemixThemes.mjs";
import { extractTrendRemixMeta } from "../lib/youtubeSocial.mjs";

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

const argv = process.argv.slice(2);
const loopId = argv.find((a) => /^[0-9a-f-]{36}$/i.test(a))?.trim();
const themeArg = argv.find((a) => TREND_REMIX_LANDSCAPE_THEMES.includes(a.toLowerCase()));
const doPublish = argv.includes("--publish");
const theme = normalizeTrendRemixTheme(themeArg ?? process.env.TREND_REMIX_LANDSCAPE_THEME);
const SUPABASE_URL = (process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "").trim();
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
const CRON_SECRET = (process.env.SOCIAL_PUBLISH_CRON_SECRET ?? "").trim();

async function main() {
  if (!loopId) {
    throw new Error(`usage: npm run trend:approve -- <loopId> <${TREND_REMIX_LANDSCAPE_THEMES.join("|")}> [--publish]`);
  }
  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("missing_supabase_env");

  const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const { data: loop } = await db
    .from("loops")
    .select("id,name,audio_url,cover_url,user_id,stems_url,is_public")
    .eq("id", loopId)
    .maybeSingle();
  if (!loop?.audio_url) throw new Error("loop_not_found");
  if (!extractTrendRemixMeta(loop.stems_url)) throw new Error("not_a_trend_remix_loop");

  console.log(`✅ Theme validé: ${theme}`);
  console.log(`🎬 Render full + upload (${loop.name})…`);
  const uploaded = await renderAndUploadTrendRemixVideo(db, loop, { theme });
  console.log(`   ${(uploaded.bytes / 1024 / 1024).toFixed(2)} MB → social-videos`);

  await db
    .from("trend_remix_plans")
    .update({ status: "ready", updated_at: new Date().toISOString() })
    .eq("loop_id", loopId);

  if (!doPublish) {
    console.log("\nVidéo prête en storage. Pour publier YouTube :");
    console.log(`   npm run trend:approve -- ${loopId} ${theme} --publish`);
    return;
  }
  if (!CRON_SECRET) throw new Error("missing_SOCIAL_PUBLISH_CRON_SECRET");

  const pub = await publishTrendRemixLoop(db, {
    loopId,
    supabaseUrl: SUPABASE_URL,
    cronSecret: CRON_SECRET,
  });
  console.log(`\n📣 YouTube: ${pub.status}`, pub.body.slice(0, 300));

  await db
    .from("trend_remix_plans")
    .update({ status: "published", updated_at: new Date().toISOString() })
    .eq("loop_id", loopId);
}

main().catch((e) => {
  console.error("❌", e instanceof Error ? e.message : e);
  process.exit(1);
});
