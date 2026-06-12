/**
 * Pre-render YouTube Short for a loop → social-videos bucket.
 * Usage: npm run youtube:prerender -- <loopId>
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

const loopId = process.argv[2]?.trim();
if (!loopId) {
  console.error("Usage: npm run youtube:prerender -- <loopId>");
  process.exit(1);
}

const db = createClient(
  (process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "").trim(),
  (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim(),
  { auth: { persistSession: false } },
);

const { data: loop } = await db
  .from("loops")
  .select("id,name,audio_url,cover_url,user_id,stems_url")
  .eq("id", loopId)
  .maybeSingle();

if (!loop?.audio_url) {
  console.error("loop_not_found");
  process.exit(1);
}

const r = await renderAndUploadYouTubeVideo(db, loop);
console.log(`✅ Uploaded ${r.storagePath} (${(r.bytes / 1024 / 1024).toFixed(2)} MB, ${r.sec}s)`);
