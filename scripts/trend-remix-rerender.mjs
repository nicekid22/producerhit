/**
 * Re-render landscape trend remix video + optional YouTube republish.
 * Usage: npm run trend:rerender -- <loopId> [--publish]
 */
import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { renderAndUploadTrendRemixVideo, renderTrendRemixVideo } from "../lib/trendRemixVideoRender.mjs";
import { normalizeTrendRemixTheme } from "../lib/youtubeTrendRemixThemes.mjs";
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

const loopId = process.argv.find((a) => /^[0-9a-f-]{36}$/i.test(a))?.trim();
const doPublish = process.argv.includes("--publish");
const SUPABASE_URL = (process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "").trim();
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
const CRON_SECRET = (process.env.SOCIAL_PUBLISH_CRON_SECRET ?? "").trim();

async function main() {
  if (!loopId) throw new Error("usage: npm run trend:rerender -- <loopId> [--publish]");
  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("missing_supabase_env");

  const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const { data: loop, error } = await db
    .from("loops")
    .select("id,name,audio_url,cover_url,user_id,stems_url,is_public")
    .eq("id", loopId)
    .maybeSingle();
  if (error || !loop) throw new Error("loop_not_found");
  if (!extractTrendRemixMeta(loop.stems_url)) throw new Error("not_a_trend_remix_loop");

  console.log(`🎬 Re-render landscape: ${loop.name} (${loopId})`);
  const theme = normalizeTrendRemixTheme(process.env.TREND_REMIX_LANDSCAPE_THEME);
  const uploaded = await renderAndUploadTrendRemixVideo(db, loop, { theme });
  console.log(`✅ Video ${(uploaded.bytes / 1024 / 1024).toFixed(2)} MB → social-videos`);

  if (!doPublish) {
    console.log("Done (add --publish to republish YouTube)");
    return;
  }
  if (!CRON_SECRET) throw new Error("missing_SOCIAL_PUBLISH_CRON_SECRET");

  await db.from("social_publish_log").delete().eq("loop_id", loopId).eq("platform", "youtube");
  await db
    .from("social_publish_queue")
    .upsert(
      { loop_id: loopId, status: "pending", attempts: 0, last_error: null, updated_at: new Date().toISOString() },
      { onConflict: "loop_id" },
    );

  const res = await fetch(`${SUPABASE_URL}/functions/v1/social-publish-cron`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-social-cron-secret": CRON_SECRET,
    },
    body: JSON.stringify({ action: "process_loop", loop_id: loopId }),
  });
  const text = await res.text();
  console.log(`📣 YouTube publish: ${res.status}`, text);
}

main().catch((e) => {
  console.error("❌", e instanceof Error ? e.message : e);
  process.exit(1);
});
