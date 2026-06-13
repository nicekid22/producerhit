/**
 * YouTube daily automation — render + optional publish (49 videos/day target).
 *
 * Usage:
 *   npm run youtube:daily -- seed
 *   npm run youtube:daily -- run
 *   npm run youtube:daily -- run-all
 */
import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { renderCommunityYouTubeVideo } from "../lib/communityYoutubeRender.mjs";
import { publishCommunityYoutubePlan } from "../lib/communityYoutubePublish.mjs";
import {
  getNextYoutubeDailyPlans,
  markYoutubeDailyPlan,
  repairYoutubeDailyPlans,
  seedYoutubeDailyPlansForDay,
  planDisplayTitle,
  dayKey,
} from "../lib/youtubeDailyPlanner.mjs";
import { TOTAL_DAILY_YOUTUBE_VIDEOS } from "../lib/youtubeDailyCadence.mjs";
import { renderAndUploadTrendRemixVideo } from "../lib/trendRemixVideoRender.mjs";
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
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
const CRON_SECRET = (process.env.SOCIAL_PUBLISH_CRON_SECRET ?? "").trim();
const ACTION = (process.argv[2] ?? "run").trim().toLowerCase();
const AUTO_PUBLISH = process.env.COMMUNITY_YOUTUBE_AUTO_PUBLISH === "1" || process.env.YOUTUBE_DAILY_AUTO_PUBLISH === "1";
const REMIX_THEME = normalizeTrendRemixTheme(process.env.TREND_REMIX_LANDSCAPE_THEME ?? "cinematic-glow");
const BATCH = Math.max(1, Math.min(TOTAL_DAILY_YOUTUBE_VIDEOS, Number(process.env.YOUTUBE_DAILY_BATCH ?? "7")));

async function processPlan(db, plan) {
  const loop = plan.loop;
  if (!loop?.id) throw new Error("loop_missing");

  const displayTitle = planDisplayTitle(plan, loop);
  console.log(`\n▶ ${plan.account} · ${plan.format} · slot ${plan.slot_index} · ${displayTitle}`);

  await markYoutubeDailyPlan(db, plan.id, { status: "rendering", last_error: null, display_title: displayTitle });

  let storagePath;
  let sec;

  if (plan.content_source === "trend_remix" && plan.format === "long") {
    const uploaded = await renderAndUploadTrendRemixVideo(db, loop, { theme: REMIX_THEME });
    storagePath = uploaded.storagePath;
    sec = uploaded.sec;
  } else {
    const uploaded = await renderCommunityYouTubeVideo(db, { ...plan, display_title: displayTitle, loop });
    storagePath = uploaded.storagePath;
    sec = uploaded.sec;
  }

  console.log(`   ✅ render ${sec.toFixed(0)}s → ${storagePath}`);
  await markYoutubeDailyPlan(db, plan.id, { status: "rendered", storage_path: storagePath, display_title: displayTitle });

  if (AUTO_PUBLISH) {
    if (!CRON_SECRET) throw new Error("missing_SOCIAL_PUBLISH_CRON_SECRET");
    console.log("   📣 YouTube publish…");
    await publishCommunityYoutubePlan(db, { ...plan, display_title: displayTitle, storage_path: storagePath, loop }, {
      supabaseUrl: SUPABASE_URL,
      cronSecret: CRON_SECRET,
    });
    await markYoutubeDailyPlan(db, plan.id, { status: "published" });
    console.log("   Published OK");
  } else {
    await markYoutubeDailyPlan(db, plan.id, { status: "rendered" });
    console.log("   ⏸ auto-publish off (YOUTUBE_DAILY_AUTO_PUBLISH=1 to enable)");
  }

  return plan.id;
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("missing_supabase_env");
  const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  if (ACTION === "repair") {
    const r = await repairYoutubeDailyPlans(db);
    console.log(`✅ Repaired ${r.repaired} plan(s), skipped ${r.skipped} duplicate(s) across ${r.days} day(s)`);
    return;
  }

  if (ACTION === "seed") {
    const r = await seedYoutubeDailyPlansForDay(db);
    console.log(`✅ Seeded ${r.seeded} youtube_daily_plans for ${r.day}`);
    return;
  }

  if (ACTION === "seed-week") {
    let total = 0;
    for (let i = 0; i < 7; i += 1) {
      const d = dayKey(new Date(Date.now() + i * 86400000));
      const r = await seedYoutubeDailyPlansForDay(db, d);
      total += r.seeded;
    }
    console.log(`✅ Seeded ${total} plan rows (7 days)`);
    return;
  }

  const limit = ACTION === "run-all" ? BATCH : 1;
  const plans = await getNextYoutubeDailyPlans(db, { limit });
  if (!plans.length) {
    console.log("Nothing pending — backlog clear or loops not ready (run trend:run for remix long).");
    return;
  }
  console.log(`📅 Processing backlog day ${plans[0]?.day ?? dayKey()} (${plans.length} slot(s) this batch)`);

  let done = 0;
  for (const plan of plans) {
    try {
      await processPlan(db, plan);
      done += 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`   ❌ ${msg}`);
      await markYoutubeDailyPlan(db, plan.id, { status: "failed", last_error: msg.slice(0, 500) });
    }
  }
  console.log(`\n✅ Processed ${done}/${plans.length} plan(s)`);
}

main().catch((e) => {
  console.error("❌", e instanceof Error ? e.message : e);
  process.exit(1);
});
