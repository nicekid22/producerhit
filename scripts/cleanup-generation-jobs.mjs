/**
 * Cleanup generation_jobs table.
 *
 * The table stores base64 audio (5 MB/row) in audio_url TEXT column.
 * Without cleanup, this table grows unbounded and kills the DB.
 *
 * Strategy: delete in small batches (5 rows at a time) with a
 * configurable retention (default 3 days for Plus, 1 day for others).
 * Uses Management API SQL to avoid Supabase client connection limits.
 *
 * Usage:
 *   node scripts/cleanup-generation-jobs.mjs [--dry-run] [--retention-days=3]
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const dryRun = process.argv.includes("--dry-run");
const retentionArg = process.argv.find((a) => a.startsWith("--retention-days="));
const RETENTION_DAYS = retentionArg ? parseInt(retentionArg.split("=")[1], 10) : 3;

const PROJECT_REF = "pmfnzenqemnonpglmjqx";
const PAT = process.env.SUPABASE_PAT || "sbp_b030ccc7f8b388a46f0af1993af352d0f2fa5520";

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
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = env.VITE_SUPABASE_URL;

async function sqlQuery(query) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAT}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`SQL ${r.status}: ${t.substring(0, 300)}`);
  return JSON.parse(t);
}

async function countRows() {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86400000).toISOString();
  const result = await sqlQuery(
    `SELECT count(*) as cnt FROM public.generation_jobs WHERE created_at < '${cutoff}'`
  );
  return Number(result?.[0]?.cnt ?? 0);
}

async function deleteBatch(cutoff) {
  // Delete 5 rows at a time — each row is ~5 MB so this keeps memory/connection safe
  const result = await sqlQuery(
    `DELETE FROM public.generation_jobs WHERE id IN (
      SELECT id FROM public.generation_jobs
      WHERE created_at < '${cutoff}'
      ORDER BY created_at ASC
      LIMIT 5
    ) RETURNING id`
  );
  return result?.length ?? 0;
}

async function deleteBatchViaClient(supabase, cutoff) {
  const { data: batch } = await supabase
    .from("generation_jobs")
    .select("id")
    .lt("created_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(5);
  if (!batch?.length) return 0;
  const ids = batch.map((r) => r.id);
  const { error } = await supabase.from("generation_jobs").delete().in("id", ids);
  if (error) throw error;
  return ids.length;
}

async function main() {
  console.log(dryRun ? "=== DRY RUN ===" : "=== CLEANUP GENERATION_JOBS ===");
  console.log(`Retention: ${RETENTION_DAYS} days`);

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86400000).toISOString();
  console.log(`Cutoff: ${cutoff}`);

  let toDelete = 0;
  try {
    toDelete = await countRows();
  } catch (e) {
    console.error(`Count failed (DB might be down): ${e.message}`);
    process.exit(1);
  }
  console.log(`Rows to delete: ${toDelete}`);

  if (toDelete === 0) {
    console.log("Nothing to clean.");
    return;
  }

  if (dryRun) {
    console.log(`Would delete ${toDelete} rows (${Math.round(toDelete * 5)} MB estimated)`);
    return;
  }

  let deleted = 0;
  let errors = 0;
  const MAX_BATCHES = 200; // Safety limit — 200 × 5 = 1000 rows = ~5 GB freed max per run
  let batchCount = 0;

  while (deleted < toDelete && batchCount < MAX_BATCHES) {
    try {
      const n = await deleteBatch(cutoff);
      if (n === 0) break;
      deleted += n;
      batchCount++;
      process.stdout.write(`\rDeleted: ${deleted}/${toDelete}`);
      // Small delay between batches to avoid overwhelming the DB
      await new Promise((r) => setTimeout(r, 500));
    } catch (e) {
      errors++;
      console.error(`\nBatch error: ${e.message}`);
      if (errors >= 3) {
        console.error("Too many errors, stopping.");
        break;
      }
      // Wait longer on error
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  console.log(`\nDone. Deleted ${deleted} rows (${batchCount} batches, ${errors} errors).`);

  // Final count
  try {
    const remaining = await countRows() + (toDelete - deleted);
    console.log(`Remaining old rows: ~${toDelete - deleted}`);
  } catch {
    // ignore
  }
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
