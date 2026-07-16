/**
 * Purge expired loop audio directly via Supabase client (bypasses edge function).
 * Respects plan retention: Free 1d, Pro 3d, Studio 7d, Plus excluded.
 *
 * Usage:
 *   node scripts/purge-expired-now.mjs [--dry-run] [--batch=50]
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const dryRun = process.argv.includes("--dry-run");
const batchArg = process.argv.find((a) => a.startsWith("--batch="));
const BATCH_SIZE = batchArg ? parseInt(batchArg.split("=")[1], 10) : 50;

function loadEnv() {
  const candidates = [resolve(process.cwd(), ".env"), resolve(process.cwd(), ".env.local")];
  const path = candidates.find((p) => existsSync(p));
  const env = { ...process.env };
  if (!path) return env;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    env[m[1]] = m[2].trim();
  }
  return env;
}

const env = loadEnv();
const url = env.VITE_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const sb = createClient(url, serviceKey, { auth: { persistSession: false } });

const AUDIO_BUCKET = "loop-audio";
const COVERS_BUCKET = "loop-covers";
const AUDIO_EXTS = ["mp3", "wav", "m4a", "ogg", "webm"];
const COVER_EXTS = ["jpg", "jpeg", "webp", "png", "mp4"];

/** Retention days per plan — mirrors loop_audio_retention_days() */
function retentionDays(plan) {
  switch ((plan || "free").toLowerCase()) {
    case "studio": return 7;
    case "pro": return 3;
    case "plus": return Infinity; // never purge
    default: return 1; // free
  }
}

function formatBytes(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + " GB";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + " MB";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + " KB";
  return n + " B";
}

async function removeFiles(bucket, paths) {
  if (!paths.length) return 0;
  let removed = 0;
  for (let i = 0; i < paths.length; i += 50) {
    const chunk = paths.slice(i, i + 50);
    const { error } = await sb.storage.from(bucket).remove(chunk);
    if (error) {
      console.warn(`  [${bucket}] remove error:`, error.message);
    } else {
      removed += chunk.length;
    }
  }
  return removed;
}

async function main() {
  console.log(dryRun ? "=== DRY RUN ===" : "=== LIVE PURGE ===");
  console.log(`Batch size: ${BATCH_SIZE}`);

  // 1. Get all non-plus users with their plans
  const { data: profiles, error: pErr } = await sb
    .from("profiles")
    .select("id, plan")
    .neq("plan", "plus")
    .limit(5000);
  if (pErr) { console.error("Profiles error:", pErr.message); process.exit(1); }
  console.log(`Non-plus profiles: ${profiles.length}`);

  let totalScanned = 0;
  let totalLoopsUpdated = 0;
  let totalAudioRemoved = 0;
  let totalCoversRemoved = 0;

  for (const profile of profiles) {
    const plan = profile.plan || "free";
    const days = retentionDays(plan);
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Fetch expired loops for this user
    let offset = 0;
    let userExpired = 0;

    for (;;) {
      const { data: loops, error: lErr } = await sb
        .from("loops")
        .select("id, audio_url, provider_audio_inline, created_at")
        .eq("user_id", profile.id)
        .lt("created_at", cutoff)
        .not("audio_url", "is", null)
        .range(offset, offset + BATCH_SIZE - 1);

      if (lErr) { console.warn(`  [${profile.id}] query error:`, lErr.message); break; }
      if (!loops?.length) break;

      const loopIds = [];
      const audioPaths = [];
      const coverPaths = [];

      for (const loop of loops) {
        loopIds.push(loop.id);

        // Audio paths
        for (const ext of AUDIO_EXTS) {
          audioPaths.push(`${profile.id}/${loop.id}.${ext}`);
        }
        // Cover paths
        for (const ext of COVER_EXTS) {
          coverPaths.push(`${profile.id}/covers/${loop.id}.${ext}`);
        }
      }

      if (!dryRun) {
        const aRemoved = await removeFiles(AUDIO_BUCKET, audioPaths);
        const cRemoved = await removeFiles(COVERS_BUCKET, coverPaths);
        totalAudioRemoved += aRemoved;
        totalCoversRemoved += cRemoved;

        // Update DB
        const { error: uErr } = await sb
          .from("loops")
          .update({ audio_url: null, provider_audio_inline: null, is_public: false })
          .in("id", loopIds);
        if (uErr) console.warn(`  [${profile.id}] update error:`, uErr.message);
        else totalLoopsUpdated += loopIds.length;
      }

      userExpired += loops.length;
      totalScanned += loops.length;

      if (loops.length < BATCH_SIZE) break;
      offset += BATCH_SIZE;
    }

    if (userExpired > 0) {
      console.log(`  [${plan}] ${profile.id}: ${userExpired} loops expired`);
    }
  }

  console.log("\n--- RESULTS ---");
  console.log(`Loops scanned (expired): ${totalScanned}`);
  if (dryRun) {
    console.log(`Would update: ${totalScanned} loops`);
    console.log(`Would remove: ~${totalScanned * AUDIO_EXTS.length} audio paths, ~${totalScanned * COVER_EXTS.length} cover paths`);
  } else {
    console.log(`Loops updated (audio_url null): ${totalLoopsUpdated}`);
    console.log(`Audio files removed: ${totalAudioRemoved}`);
    console.log(`Cover files removed: ${totalCoversRemoved}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
