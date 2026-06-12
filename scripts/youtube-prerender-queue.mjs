/**
 * Pre-render YouTube MP4 for pending social_publish_queue items (GitHub Actions).
 * Usage: node scripts/youtube-prerender-queue.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { renderAndUploadYouTubeVideo } from "../lib/youtubePreRender.mjs";

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

const url = (process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "").trim();
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
if (!url || !key) {
  console.error("missing_supabase_credentials");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

async function hasStoredVideo(loop) {
  if (!loop?.user_id) return false;
  const folder = `${loop.user_id}/${loop.id}`;
  const { data: files } = await db.storage.from("social-videos").list(folder, { limit: 3 });
  return Boolean(files?.some((f) => f.name?.toLowerCase().endsWith(".mp4")));
}

const { data: rows } = await db
  .from("social_publish_queue")
  .select("loop_id")
  .in("status", ["pending", "failed"])
  .lt("attempts", 5)
  .order("created_at", { ascending: true })
  .limit(3);

const loopIds = [...new Set((rows ?? []).map((r) => r.loop_id).filter(Boolean))];
if (!loopIds.length) {
  console.log("No pending queue items — skip prerender");
  process.exit(0);
}

console.log(`Pre-render queue: ${loopIds.length} loop(s)`);

for (const loopId of loopIds) {
  const { data: loop } = await db
    .from("loops")
    .select("id,name,audio_url,cover_url,user_id,stems_url,is_public")
    .eq("id", loopId)
    .maybeSingle();

  if (!loop?.audio_url || !loop.is_public) {
    console.warn(`⏭️  ${loopId} — skip (missing or private)`);
    continue;
  }

  if (await hasStoredVideo(loop)) {
    console.log(`✓ ${loopId} — video already in social-videos`);
    continue;
  }

  try {
    console.log(`⏳ ${loopId} — rendering…`);
    const r = await renderAndUploadYouTubeVideo(db, loop);
    console.log(`✅ ${loopId} → ${r.storagePath} (${(r.bytes / 1024 / 1024).toFixed(2)} MB)`);
  } catch (e) {
    console.error(`❌ ${loopId}:`, e instanceof Error ? e.message : e);
  }
}
