/**
 * Viral Shorts automation — seed daily plans, generate ACE track, enqueue publish.
 * Usage: npm run viral:run [-- seed|generate|run]
 */
import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { generateViralTrack } from "../lib/viralAceGenerate.mjs";
import { getViralBotAccessToken } from "../lib/viralBotAuth.mjs";
import { getNextViralPlan, markPlan, seedViralPlansForDay, dayKey } from "../lib/viralContentPlanner.mjs";
import { persistViralLoop } from "../lib/viralLoopPersist.mjs";

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
    const r = await seedViralPlansForDay(db);
    console.log(`✅ Seeded ${r.seeded} plan(s) for ${r.day}`);
    return;
  }

  if (ACTION === "seed-week") {
    let total = 0;
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(Date.now() + i * 86400000);
      const r = await seedViralPlansForDay(db, dayKey(d));
      total += r.seeded;
    }
    console.log(`✅ Seeded ${total} plan(s) for next 7 days`);
    return;
  }

  if (ACTION === "generate" || ACTION === "run") {
    await seedViralPlansForDay(db);
    const plan = await getNextViralPlan(db);
    if (!plan) {
      console.log("Nothing to generate — all slots done for today.");
      return;
    }

    console.log(`🎬 [${plan.series}] ${plan.display_name} (${plan.slot})`);
    console.log(`   Source: "${plan.source_text}"`);

    await markPlan(db, plan.id, { status: "generating", last_error: null });

    try {
      const { userId, token } = await getViralBotAccessToken(SUPABASE_URL, ANON_KEY, SERVICE_KEY);
      console.log("🎵 Generating via ACE…");
      const aceResult = await generateViralTrack({
        supabaseUrl: SUPABASE_URL,
        anonKey: ANON_KEY,
        accessToken: token,
        plan,
      });
      console.log("💾 Saving public loop + social queue…");
      const { loopId } = await persistViralLoop(db, { userId, plan, aceResult });
      console.log(`✅ Ready: loop ${loopId} — social publish queue pending`);
      console.log(`   Preview render: npm run youtube:render-preview -- ${loopId}`);
      try {
        const { data: loopRow } = await db
          .from("loops")
          .select("id,name,audio_url,cover_url,user_id,stems_url")
          .eq("id", loopId)
          .maybeSingle();
        if (loopRow) {
          const { renderAndUploadYouTubeVideo } = await import("../lib/youtubePreRender.mjs");
          const uploaded = await renderAndUploadYouTubeVideo(db, loopRow);
          console.log(`🎬 Pre-rendered YouTube video → social-videos (${(uploaded.bytes / 1024 / 1024).toFixed(2)} MB)`);
        }
      } catch (e) {
        console.warn("⚠️ Pre-render skipped:", e instanceof Error ? e.message : e);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await markPlan(db, plan.id, { status: "failed", last_error: msg.slice(0, 500) });
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
