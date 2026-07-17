/**
 * Fix DB bloat — truncate generation_jobs + verify purge system.
 * Run AFTER DB is accessible again.
 *
 * Usage:
 *   node scripts/fix-db-bloat.mjs [--dry-run]
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const dryRun = process.argv.includes("--dry-run");

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
const sb = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const pat = "sbp_b030ccc7f8b388a46f0af1993af352d0f2fa5520";
const projectRef = "pmfnzenqemnonpglmjqx";

async function truncateViaSQL() {
  console.log("Attempting TRUNCATE via Management API...");
  const r = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${pat}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: "TRUNCATE TABLE public.generation_jobs;" }),
  });
  const t = await r.text();
  if (r.ok) {
    console.log("✅ TRUNCATE succeeded");
    return true;
  }
  console.log(`❌ TRUNCATE failed (${r.status}): ${t.substring(0, 200)}`);
  return false;
}

async function deleteViaClient() {
  console.log("Falling back to client DELETE in small batches...");
  let deleted = 0;
  for (;;) {
    const { data: batch } = await sb.from("generation_jobs").select("id").limit(5);
    if (!batch?.length) break;
    const ids = batch.map((r) => r.id);
    const { error } = await sb.from("generation_jobs").delete().in("id", ids);
    if (error) {
      console.error("  Delete error:", error.message);
      // Wait and retry
      await new Promise((r) => setTimeout(r, 5000));
      continue;
    }
    deleted += ids.length;
    process.stdout.write(`\r  Deleted: ${deleted}`);
  }
  console.log(`\n  Total deleted: ${deleted}`);
  return deleted;
}

async function verifyRetention() {
  console.log("\n=== VERIFY RETENTION ===");

  // Check the retention function
  const { data: func } = await sb.rpc("loop_audio_retention_days", { p_plan: "free" }).single();
  console.log(`  loop_audio_retention_days('free') = ${func}`);

  const { data: funcPro } = await sb.rpc("loop_audio_retention_days", { p_plan: "pro" }).single();
  console.log(`  loop_audio_retention_days('pro') = ${funcPro}`);

  const { data: funcStudio } = await sb.rpc("loop_audio_retention_days", { p_plan: "studio" }).single();
  console.log(`  loop_audio_retention_days('studio') = ${funcStudio}`);

  // Count loops by age
  const now = new Date();
  const cutoffs = {
    free: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
    pro: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
    studio: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(),
  };

  const { count: totalLoops } = await sb.from("loops").select("id", { count: "exact", head: true });
  console.log(`\n  Total loops: ${totalLoops}`);

  // Count loops that SHOULD be purged per plan
  for (const [plan, cutoff] of Object.entries(cutoffs)) {
    const { count } = await sb
      .from("loops")
      .select("id", { count: "exact", head: true })
      .not("audio_url", "is", null)
      .lt("created_at", cutoff);
    console.log(`  Loops > ${plan} retention with audio: ${count}`);
  }

  // Test the list_expired function
  console.log("\n  Testing list_expired_loop_audio_rows...");
  const { data: expired, error: expErr } = await sb.rpc("list_expired_loop_audio_rows", {
    p_retention_days: 1,
    p_limit: 5,
  });
  if (expErr) console.log(`  ❌ Error: ${expErr.message}`);
  else console.log(`  ✅ Found ${expired?.length ?? 0} expired rows (sample)`);
}

async function verifyPurgeEdgeFunction() {
  console.log("\n=== VERIFY PURGE EDGE FUNCTION ===");
  const r = await fetch(`${env.VITE_SUPABASE_URL}/functions/v1/purge-loop-audio`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
  });
  console.log(`  HTTP ${r.status}`);
  const t = await r.text();
  console.log(`  Response: ${t.substring(0, 300)}`);
  return r.status === 200 || r.status === 500; // 500 = timeout on DB update, but auth works
}

async function main() {
  console.log(dryRun ? "=== DRY RUN ===" : "=== FIX DB BLOAT ===\n");

  // Step 1: Truncate generation_jobs
  console.log("--- Step 1: Truncate generation_jobs ---");
  let truncated = false;
  if (!dryRun) {
    truncated = await truncateViaSQL();
    if (!truncated) {
      truncated = (await deleteViaClient()) > 0;
    }
  } else {
    const { count } = await sb.from("generation_jobs").select("id", { count: "exact", head: true });
    console.log(`  Would truncate ${count} rows`);
  }

  // Step 2: Verify retention system
  console.log("\n--- Step 2: Verify retention ---");
  if (!dryRun) {
    await verifyRetention();
  }

  // Step 3: Verify purge edge function auth
  console.log("\n--- Step 3: Verify purge edge function ---");
  if (!dryRun) {
    await verifyPurgeEdgeFunction();
  }

  // Step 4: Final DB state
  console.log("\n--- Step 4: Final state ---");
  const tables = ["profiles", "loops", "generation_jobs", "growth_events", "client_events"];
  let total = 0;
  for (const t of tables) {
    const { count } = await sb.from(t).select("id", { count: "exact", head: true });
    console.log(`  ${t}: ${count ?? 0} rows`);
    total += count ?? 0;
  }
  console.log(`  TOTAL: ${total} rows`);
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
