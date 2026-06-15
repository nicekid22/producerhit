/**
 * Trend remix automation — trending song × genre → landscape YouTube full song.
 * Usage:
 *   npm run trend:run              # next pending slot today
 *   npm run trend:run -- run-all   # all pending slots (max 4/day)
 *   npm run trend:seed-week
 */
import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { generateTrendRemixTrack } from "../lib/trendRemixAceGenerate.mjs";
import { getViralBotAccessToken } from "../lib/viralBotAuth.mjs";
import { getNextTrendRemixPlan, markTrendRemixPlan, seedTrendRemixPlansForDay, dayKey } from "../lib/trendRemixPlanner.mjs";
import { persistTrendRemixLoop } from "../lib/trendRemixLoopPersist.mjs";
import { publishTrendRemixLoop } from "../lib/trendRemixPublish.mjs";
import { normalizeTrendRemixTheme } from "../lib/youtubeTrendRemixThemes.mjs";

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
const CRON_SECRET = (process.env.SOCIAL_PUBLISH_CRON_SECRET ?? "").trim();
const ACTION = (process.argv[2] ?? "run").trim().toLowerCase();
const AUTO_PUBLISH = process.env.TREND_REMIX_AUTO_PUBLISH === "1";
const THEME = normalizeTrendRemixTheme(process.env.TREND_REMIX_LANDSCAPE_THEME ?? "cinematic-glow");

async function processOnePlan(db) {
  const plan = await getNextTrendRemixPlan(db);
  if (!plan) return null;

  const catalog = plan.trend_remix_catalog;
  console.log(`\n🎬 [${plan.slot}] ${plan.display_title} → ${plan.target_youtube_account}`);
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
    console.log(`   Lyrics OK (${aceResult.lyricsAttempt ?? 1} attempt(s))`);

    const { loopId, displayTitle } = await persistTrendRemixLoop(db, { userId, plan, catalog, aceResult });
    console.log(`✅ Loop ${loopId} — ${displayTitle}`);

    const { assignTrendRemixPinterestCover } = await import("../lib/trendRemixPinterestCover.mjs");
    console.log("🖼 Pinterest cover…");
    const pin = await assignTrendRemixPinterestCover(db, {
      loopId,
      catalog,
      supabaseUrl: SUPABASE_URL,
      anonKey: ANON_KEY,
      accessToken: token,
    });
    console.log(pin.coverUrl ? `   Cover OK (${pin.source})` : `   ⚠ Cover fallback (${pin.error ?? "none"})`);

    const { data: loopRow } = await db
      .from("loops")
      .select("id,name,audio_url,cover_url,user_id,stems_url,genre")
      .eq("id", loopId)
      .maybeSingle();
    if (!loopRow) throw new Error("loop_row_missing");

    const { renderAndUploadTrendRemixVideo } = await import("../lib/trendRemixVideoRender.mjs");
    console.log(`🎬 Render + upload (${THEME}, full audio)…`);
    const uploaded = await renderAndUploadTrendRemixVideo(db, loopRow, { theme: THEME });
    console.log(`   ${(uploaded.bytes / 1024 / 1024).toFixed(2)} MB · ${uploaded.sec.toFixed(0)}s`);

    if (AUTO_PUBLISH) {
      if (!CRON_SECRET) throw new Error("missing_SOCIAL_PUBLISH_CRON_SECRET");
      console.log("📣 YouTube publish…");
      const pub = await publishTrendRemixLoop(db, {
        loopId,
        supabaseUrl: SUPABASE_URL,
        cronSecret: CRON_SECRET,
      });
      console.log(`   YouTube OK (${pub.status})`);
      await markTrendRemixPlan(db, plan.id, { status: "published", loop_id: loopId });
    } else {
      await markTrendRemixPlan(db, plan.id, { status: "ready", loop_id: loopId });
      console.log("⏸ TREND_REMIX_AUTO_PUBLISH≠1 — publish manuel:");
      console.log(`   npm run trend:approve -- ${loopId} ${THEME} --publish`);
    }

    return { loopId, planId: plan.id, slot: plan.slot };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await markTrendRemixPlan(db, plan.id, { status: "failed", last_error: msg.slice(0, 500) });
    throw e;
  }
}

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
    const result = await processOnePlan(db);
    if (!result) console.log("Nothing to generate — today's trend remix slots are done.");
    return;
  }

  if (ACTION === "run-all") {
    await seedTrendRemixPlansForDay(db);
    const max = Math.max(1, Math.min(4, Number(process.env.TREND_REMIX_DAILY_SLOTS ?? 4)));
    let done = 0;
    for (let i = 0; i < max; i += 1) {
      try {
        const result = await processOnePlan(db);
        if (!result) break;
        done += 1;
      } catch (e) {
        console.error("❌ slot failed:", e instanceof Error ? e.message : e);
      }
    }
    console.log(`\n✅ Done: ${done} trend remix slot(s) processed`);
    return;
  }

  throw new Error(`unknown_action:${ACTION}`);
}

main().catch((e) => {
  console.error("❌", e instanceof Error ? e.message : e);
  process.exit(1);
});
