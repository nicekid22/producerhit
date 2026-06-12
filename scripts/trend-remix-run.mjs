/**
 * Trend remix automation — trending song × genre → landscape YouTube full song.
 * Usage: npm run trend:run [-- seed|seed-week|generate|run]
 */
import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { generateTrendRemixTrack } from "../lib/trendRemixAceGenerate.mjs";
import { getViralBotAccessToken } from "../lib/viralBotAuth.mjs";
import { getNextTrendRemixPlan, markTrendRemixPlan, seedTrendRemixPlansForDay, dayKey } from "../lib/trendRemixPlanner.mjs";
import { persistTrendRemixLoop } from "../lib/trendRemixLoopPersist.mjs";

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

const SUPABASE_URL = (process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "").trim();
const ANON_KEY = (process.env.VITE_SUPABASE_ANON_KEY ?? "").trim();
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
const ACTION = (process.argv[2] ?? "run").trim().toLowerCase();

async function main() {
  if (!SUPABASE_URL || !ANON_KEY || !SERVICE_KEY) {
    throw new Error("missing_supabase_env");
  }

  const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  if (ACTION === "seed") {
    const n = await seedTrendRemixPlansForDay(db);
    console.log(`✅ Trend remix plans seeded: ${n.seeded} for ${n.day}`);
    return;
  }

  if (ACTION === "seed-week") {
    let total = 0;
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(Date.now() + i * 86400000);
      const r = await seedTrendRemixPlansForDay(db, dayKey(d));
      total += r.seeded;
    }
    console.log(`✅ Seeded ${total} trend remix plan(s) for next 7 days`);
    return;
  }

  if (ACTION === "generate" || ACTION === "run") {
    await seedTrendRemixPlansForDay(db);
    const plan = await getNextTrendRemixPlan(db);
    if (!plan) {
      console.log("Nothing to generate — today's trend remix slots are done.");
      return;
    }

    const catalog = plan.trend_remix_catalog;
    console.log(`🎬 [${plan.slot}] ${plan.display_title} → ${plan.target_youtube_account}`);
    console.log(`   Trend: "${catalog?.original_title}" by ${catalog?.original_artist} → ${catalog?.remix_genre}`);

    await markTrendRemixPlan(db, plan.id, { status: "generating", last_error: null });

    try {
      const { userId, token } = await getViralBotAccessToken(SUPABASE_URL, ANON_KEY, SERVICE_KEY);
      console.log("🎵 Generating ACE remix (full song)…");
      const aceResult = await generateTrendRemixTrack({
        supabaseUrl: SUPABASE_URL,
        anonKey: ANON_KEY,
        accessToken: token,
        plan,
        catalog,
      });
      console.log("💾 Saving loop + social queue…");
      const { loopId, displayTitle } = await persistTrendRemixLoop(db, { userId, plan, catalog, aceResult });
      console.log(`✅ Ready: ${displayTitle}`);
      console.log(`   Loop ${loopId} — landscape render + YouTube publish queued`);
      try {
        const { data: loopRow } = await db
          .from("loops")
          .select("id,name,audio_url,cover_url,user_id,stems_url")
          .eq("id", loopId)
          .maybeSingle();
        if (loopRow) {
          const { renderAndUploadYouTubeVideo } = await import("../lib/youtubePreRender.mjs");
          const uploaded = await renderAndUploadYouTubeVideo(db, loopRow);
          console.log(`🎬 Landscape video → social-videos (${(uploaded.bytes / 1024 / 1024).toFixed(2)} MB, ${uploaded.sec}s)`);
        }
      } catch (e) {
        console.warn("⚠️ Pre-render skipped:", e instanceof Error ? e.message : e);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await markTrendRemixPlan(db, plan.id, { status: "failed", last_error: msg.slice(0, 500) });
      throw e;
    }
    return;
  }

  throw new Error(`unknown_action:${ACTION}`);
}

main().catch((e) => {
  console.error("❌", e instanceof Error ? e.message : e);
  process.exit(1);
});
