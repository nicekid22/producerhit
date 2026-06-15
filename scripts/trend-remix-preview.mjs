/**
 * Preview trend remix — pro themes locally, NO YouTube upload.
 * Usage:
 *   npm run trend:preview -- [loopId]
 *   npm run trend:preview -- [loopId] --only cinematic-glow --refresh-cover
 */
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { renderTrendRemixVideo } from "../lib/trendRemixVideoRender.mjs";
import { TREND_REMIX_LANDSCAPE_THEMES, normalizeTrendRemixTheme } from "../lib/youtubeTrendRemixThemes.mjs";
import { extractTrendRemixMeta } from "../lib/youtubeSocial.mjs";
import { assignTrendRemixPinterestCover } from "../lib/trendRemixPinterestCover.mjs";
import { getViralBotAccessToken } from "../lib/viralBotAuth.mjs";

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

const loopId =
  process.argv.find((a) => /^[0-9a-f-]{36}$/i.test(a)) ??
  "1455337d-8555-426c-bc22-db70688d163b";
const refreshCover = process.argv.includes("--refresh-cover");
const onlyIdx = process.argv.indexOf("--only");
const onlyTheme = onlyIdx >= 0 ? normalizeTrendRemixTheme(process.argv[onlyIdx + 1]) : null;
const SUPABASE_URL = (process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "").trim();
const ANON_KEY = (process.env.VITE_SUPABASE_ANON_KEY ?? "").trim();
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
const outDir = join(process.cwd(), "previews", "trend-remix");
mkdirSync(outDir, { recursive: true });

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("missing_supabase_env");

  const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const { data: loop } = await db
    .from("loops")
    .select("id,name,audio_url,cover_url,user_id,stems_url")
    .eq("id", loopId)
    .maybeSingle();
  if (!loop?.audio_url) throw new Error("loop_not_found");
  if (!extractTrendRemixMeta(loop.stems_url)) throw new Error("not_a_trend_remix_loop");

  if (refreshCover) {
    const meta = extractTrendRemixMeta(loop.stems_url);
    const { token } = await getViralBotAccessToken(SUPABASE_URL, ANON_KEY, SERVICE_KEY);
    console.log("🖼 Refresh Pinterest cover…");
    const pin = await assignTrendRemixPinterestCover(db, {
      loopId,
      catalog: {
        remix_genre: meta?.remixGenre,
        mood: loop.name,
        original_artist: meta?.originalArtist,
        original_title: meta?.originalTitle,
        trend_keywords: meta?.trendKeywords,
      },
      supabaseUrl: SUPABASE_URL,
      anonKey: ANON_KEY,
      accessToken: token,
    });
    console.log(pin.coverUrl ? `   ✅ ${pin.source} — ${pin.coverUrl.slice(0, 72)}…` : `   ⚠ ${pin.error}`);
    const { data: refreshed } = await db
      .from("loops")
      .select("id,name,audio_url,cover_url,user_id,stems_url")
      .eq("id", loopId)
      .maybeSingle();
    if (refreshed) Object.assign(loop, refreshed);
  }

  const themes = onlyTheme ? [onlyTheme] : TREND_REMIX_LANDSCAPE_THEMES;

  console.log(`🎬 Preview trend remix: ${loop.name}`);
  console.log(`   Loop ${loopId}\n`);

  const outputs = [];
  for (const theme of themes) {
    const outPath = join(outDir, `${loopId}-${theme}.mp4`);
    process.stdout.write(`  → ${theme}… `);
    const t0 = Date.now();
    const { bytes, sec } = await renderTrendRemixVideo(loop, { theme, outPath });
    console.log(`OK (${(bytes / 1024 / 1024).toFixed(2)} MB, ${sec.toFixed(0)}s video, ${((Date.now() - t0) / 1000).toFixed(0)}s render)`);
    outputs.push(outPath);
  }

  console.log("\n✅ Previews prêtes (durée = audio) — ouvre le dossier et choisis un style :\n");
  for (const p of outputs) console.log(`   ${p}`);
  console.log("\nPour valider et publier :");
  console.log(`   npm run trend:approve -- ${loopId} cinematic-glow --publish`);
  console.log(`   npm run trend:approve -- ${loopId} dark-premium --publish`);
  console.log(`   npm run trend:approve -- ${loopId} neon-karaoke --publish`);
  console.log(`   npm run trend:approve -- ${loopId} letterbox-cinema --publish`);
}

main().catch((e) => {
  console.error("❌", e instanceof Error ? e.message : e);
  process.exit(1);
});
