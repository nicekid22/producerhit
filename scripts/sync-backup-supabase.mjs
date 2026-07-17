/**
 * Sync critical data from primary Supabase to backup project.
 * Runs daily via GitHub Action. Keeps backup in sync for fallback.
 *
 * Tables synced:
 *   - profiles (all rows)
 *   - loops (metadata only, no audio_url content)
 *   - generation_usage_keys (for idempotency)
 *
 * Usage:
 *   node scripts/sync-backup-supabase.mjs [--dry-run]
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
const primaryUrl = env.VITE_SUPABASE_URL;
const primaryKey = env.SUPABASE_SERVICE_ROLE_KEY;
const backupUrl = env.VITE_SUPABASE_BACKUP_URL;
const backupKey = env.VITE_SUPABASE_BACKUP_SERVICE_KEY;

if (!primaryUrl || !primaryKey) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (!backupUrl || !backupKey) {
  console.error("Missing VITE_SUPABASE_BACKUP_URL or VITE_SUPABASE_BACKUP_SERVICE_KEY");
  console.error("Set these in .env or GitHub Actions secrets before running sync.");
  process.exit(1);
}

const primary = createClient(primaryUrl, primaryKey, { auth: { persistSession: false } });
const backup = createClient(backupUrl, backupKey, { auth: { persistSession: false } });

const SYNC_BATCH = 500;

async function syncTable(tableName, columns, options = {}) {
  const { filter, modifyRow } = options;
  console.log(`\nSyncing ${tableName}...`);

  // Fetch all rows from primary
  let offset = 0;
  let totalRows = 0;
  let totalUpserted = 0;

  for (;;) {
    let query = primary.from(tableName).select(columns).range(offset, offset + SYNC_BATCH - 1);
    if (filter) query = filter(query);
    const { data: rows, error: fetchErr } = await query;
    if (fetchErr) {
      console.error(`  Fetch error: ${fetchErr.message}`);
      break;
    }
    if (!rows?.length) break;

    // Optional row transformation
    const transformed = modifyRow ? rows.map(modifyRow) : rows;

    if (!dryRun) {
      // Upsert to backup in chunks
      for (let i = 0; i < transformed.length; i += 100) {
        const chunk = transformed.slice(i, i + 100);
        const { error: upsertErr } = await backup.from(tableName).upsert(chunk, {
          onConflict: options.conflictColumn || "id",
          ignoreDuplicates: false,
        });
        if (upsertErr) {
          console.error(`  Upsert error (${tableName}): ${upsertErr.message}`);
        } else {
          totalUpserted += chunk.length;
        }
      }
    } else {
      totalUpserted += transformed.length;
    }

    totalRows += rows.length;
    process.stdout.write(`\r  Fetched: ${totalRows}, Upserted: ${totalUpserted}`);
    if (rows.length < SYNC_BATCH) break;
    offset += SYNC_BATCH;
  }

  console.log(`\n  Done: ${totalRows} rows fetched, ${totalUpserted} upserted`);
  return { fetched: totalRows, upserted: totalUpserted };
}

async function main() {
  console.log(dryRun ? "=== DRY RUN SYNC ===" : "=== LIVE SYNC ===");
  console.log(`Primary: ${primaryUrl}`);
  console.log(`Backup:  ${backupUrl}`);

  const results = {};

  // 1. Profiles — all columns
  results.profiles = await syncTable("profiles", "*", {
    conflictColumn: "id",
  });

  // 2. Loops — metadata only (strip audio_url to save backup storage)
  results.loops = await syncTable("loops", "*", {
    conflictColumn: "id",
    modifyRow: (row) => ({
      ...row,
      audio_url: null, // Don't sync audio URLs to backup
      provider_audio_inline: null, // Don't sync inline audio
      stems_url: null, // Don't sync stems
    }),
  });

  // 3. Generation usage keys — for idempotency
  results.generation_usage_keys = await syncTable("generation_usage_keys", "*", {
    conflictColumn: "user_id,key",
  });

  console.log("\n=== SYNC SUMMARY ===");
  let totalRows = 0;
  for (const [table, r] of Object.entries(results)) {
    console.log(`  ${table}: ${r.fetched} rows`);
    totalRows += r.fetched;
  }
  console.log(`  Total: ${totalRows} rows synced`);
  if (dryRun) console.log("  (dry run — nothing was written)");
}

main().catch((e) => {
  console.error("Sync failed:", e.message);
  process.exit(1);
});
