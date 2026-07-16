#!/usr/bin/env node
/**
 * Comprehensive Supabase Database Backup Script
 *
 * Exports all important tables as JSON files into a timestamped backup directory,
 * creates a manifest, gzips the archive, and prunes backups older than 7 days.
 *
 * Usage:
 *   node scripts/backup-supabase.mjs                       # full backup
 *   node scripts/backup-supabase.mjs --dry-run             # list tables & row counts only
 *   node scripts/backup-supabase.mjs --table=loops         # backup only the "loops" table
 *   node scripts/backup-supabase.mjs --table=loops,profiles  # backup multiple specific tables
 *
 * Env:
 *   VITE_SUPABASE_URL          — Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY  — Service role key (full access)
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { createGzip } from "node:zlib";
import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";

// ─── Constants ───────────────────────────────────────────────────────
const PAGE_SIZE = 1000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const BACKUP_RETENTION_DAYS = 7;
const TODAY = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

// ─── Table definitions ───────────────────────────────────────────────
// Each entry: { name, dateColumn? }
// If dateColumn is set, only rows from the last 30 days are exported.
const TABLES = [
  { name: "profiles" },
  { name: "loops" },
  { name: "generation_jobs" },
  { name: "generation_usage_keys" },
  { name: "loop_ratings" },
  { name: "loop_comments" },
  { name: "profile_follows" },
  { name: "billing_stripe_prices" },
  { name: "billing_apple_subscriptions" },
  { name: "stripe_credit_pack_grants" },
  { name: "stripe_launch_bonus_grants" },
  { name: "producer_tags" },
  { name: "used_pinterest_covers" },
  { name: "client_events", dateColumn: "created_at" },
  { name: "growth_events", dateColumn: "created_at" },
  { name: "distribution_profiles" },
  { name: "distribution_releases" },
  { name: "distribution_outlet_status" },
  { name: "youtube_daily_plans" },
];

// ─── Helpers ─────────────────────────────────────────────────────────

function loadEnv() {
  const candidates = [
    resolve(process.cwd(), ".env"),
    resolve(process.cwd(), ".env.local"),
  ];
  const envPath = candidates.find((p) => existsSync(p));
  const env = { ...process.env };
  if (!envPath) return env;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    // strip surrounding quotes
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!(k in process.env)) env[k] = v;
  }
  return env;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const flags = {};
  for (const arg of args) {
    if (arg === "--dry-run") {
      flags.dryRun = true;
    } else if (arg.startsWith("--table=")) {
      const raw = arg.slice("--table=".length);
      flags.tableFilter = raw.split(",").map((t) => t.trim().toLowerCase());
    }
  }
  return flags;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Core: paginated export with retry ───────────────────────────────

async function fetchAllRows(db, tableName, dateColumn) {
  let from = 0;
  const allRows = [];
  const thirtyDaysAgo = dateColumn
    ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    : null;

  while (true) {
    let query = db.from(tableName).select("*");
    if (dateColumn && thirtyDaysAgo) {
      query = query.gte(dateColumn, thirtyDaysAgo);
    }
    query = query.range(from, from + PAGE_SIZE - 1);

    let lastError = null;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const { data, error } = await query;
      if (!error) {
        lastError = null;
        if (!data || data.length === 0) {
          // If this is the first page and empty, table might not exist or be empty
          // We still return empty array (the caller logs it)
          return allRows;
        }
        allRows.push(...data);
        if (data.length < PAGE_SIZE) {
          // Last page
          return allRows;
        }
        from += PAGE_SIZE;
        break; // success, move to next page
      }
      lastError = error;
      console.error(`  ⚠ Attempt ${attempt}/${MAX_RETRIES} failed for ${tableName} (offset ${from}): ${error.message}`);
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }

    if (lastError) {
      throw new Error(`Failed to fetch ${tableName} after ${MAX_RETRIES} retries: ${lastError.message}`);
    }
  }
}

async function countRows(db, tableName, dateColumn) {
  let query = db.from(tableName).select("*", { count: "exact", head: true });
  if (dateColumn) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte(dateColumn, thirtyDaysAgo);
  }
  const { count, error } = await query;
  if (error) {
    console.error(`  ⚠ Could not count ${tableName}: ${error.message}`);
    return null;
  }
  return count ?? 0;
}

// ─── Gzip helper ─────────────────────────────────────────────────────

async function gzipFile(srcPath, destPath) {
  return new Promise((resolve, reject) => {
    const src = createReadStream(srcPath);
    const dst = createWriteStream(destPath);
    const gz = createGzip({ level: 6 });
    pipeline(src, gz, dst).then(resolve).catch(reject);
  });
}

// ─── Prune old backups ───────────────────────────────────────────────

function pruneOldBackups(backupsDir) {
  if (!existsSync(backupsDir)) return 0;
  const entries = readdirSync(backupsDir, { withFileTypes: true });
  const dirs = entries
    .filter((e) => e.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(e.name))
    .map((e) => e.name)
    .sort();

  let removed = 0;
  if (dirs.length > BACKUP_RETENTION_DAYS) {
    const toRemove = dirs.slice(0, dirs.length - BACKUP_RETENTION_DAYS);
    for (const d of toRemove) {
      const dirPath = join(backupsDir, d);
      console.log(`  🗑  Removing old backup: ${d}`);
      rmSync(dirPath, { recursive: true, force: true });
      removed++;
    }
  }
  return removed;
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  const flags = parseArgs();
  const env = loadEnv();
  const supabaseUrl = (env.VITE_SUPABASE_URL ?? env.SUPABASE_URL ?? "").replace(/\/$/, "");
  const serviceKey = (env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

  if (!supabaseUrl || !serviceKey) {
    console.error("❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
  }

  // Filter tables if --table flag is set
  let tablesToBackup = TABLES;
  if (flags.tableFilter) {
    tablesToBackup = TABLES.filter((t) => flags.tableFilter.includes(t.name.toLowerCase()));
    if (tablesToBackup.length === 0) {
      console.error(`❌ No matching tables found for: ${flags.tableFilter.join(", ")}`);
      console.error(`   Available tables: ${TABLES.map((t) => t.name).join(", ")}`);
      process.exit(1);
    }
  }

  // Resolve output directory
  const repoRoot = resolve(process.cwd());
  const backupsDir = join(repoRoot, "backups");
  const backupDir = join(backupsDir, TODAY);
  if (!flags.dryRun) {
    mkdirSync(backupDir, { recursive: true });
  }

  // Create Supabase client (no auth session persistence)
  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Supabase Backup — ${TODAY}`);
  console.log(`  Project: ${supabaseUrl}`);
  console.log(`  Tables:  ${tablesToBackup.length}`);
  console.log(`  Mode:    ${flags.dryRun ? "DRY RUN (no files written)" : "LIVE BACKUP"}`);
  if (flags.tableFilter) {
    console.log(`  Filter:  ${flags.tableFilter.join(", ")}`);
  }
  console.log("═══════════════════════════════════════════════════════════\n");

  const manifest = {
    timestamp: new Date().toISOString(),
    supabaseUrl,
    date: TODAY,
    tables: {},
    totalRows: 0,
    totalFiles: 0,
    totalSizeBytes: 0,
    mode: flags.dryRun ? "dry-run" : "live",
  };

  // ── Count phase ──
  console.log("📊 Counting rows...\n");
  for (const table of tablesToBackup) {
    const label = table.dateColumn ? `${table.name} (last 30d)` : table.name;
    const count = await countRows(db, table.name, table.dateColumn);
    const countStr = count !== null ? count.toLocaleString() : "error";
    console.log(`  ${label.padEnd(42)} ${countStr}`);
    manifest.tables[table.name] = {
      rowCount: count,
      dateColumn: table.dateColumn ?? null,
      filtered: !!table.dateColumn,
    };
    manifest.totalRows += count ?? 0;
  }

  if (flags.dryRun) {
    console.log(`\n✅ Dry run complete. Total rows: ${manifest.totalRows.toLocaleString()}`);
    console.log(`   Run without --dry-run to export data.\n`);
    process.exit(0);
  }

  // ── Export phase ──
  console.log(`\n📦 Exporting tables to ${backupDir}\n`);
  for (const table of tablesToBackup) {
    const label = table.dateColumn ? `${table.name} (last 30d)` : table.name;
    process.stdout.write(`  ${label.padEnd(42)} `);

    try {
      const rows = await fetchAllRows(db, table.name, table.dateColumn);
      const filePath = join(backupDir, `${table.name}.json`);
      const json = JSON.stringify(rows, null, 2);
      writeFileSync(filePath, json, "utf8");
      const fileSize = statSync(filePath).size;
      manifest.tables[table.name].exportedRows = rows.length;
      manifest.tables[table.name].fileSize = fileSize;
      manifest.tables[table.name].file = `${table.name}.json`;
      manifest.totalFiles++;
      manifest.totalSizeBytes += fileSize;
      console.log(`${rows.length.toLocaleString().padStart(8)} rows  ${formatBytes(fileSize).padStart(10)}`);
    } catch (err) {
      manifest.tables[table.name].error = err.message;
      console.log(`ERROR: ${err.message}`);
    }
  }

  // ── Manifest ──
  const manifestPath = join(backupDir, "manifest.json");
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  manifest.totalFiles++; // count manifest itself
  manifest.totalSizeBytes += statSync(manifestPath).size;
  // Re-write with final sizes
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`\n  ✅ manifest.json written`);

  // ── Gzip archive ──
  console.log(`\n🗜  Creating gzipped archive...`);
  try {
    const tarGzPath = join(backupsDir, `supabase-backup-${TODAY}.tar.gz`);

    // Use node's built-in tar-like approach: we'll create the tar.gz by tarring the directory
    // Since we're on Windows and may not have system tar with gzip,
    // we'll create a tar using child_process and then gzip the whole directory
    // For maximum portability, we'll just gzip each JSON file into the archive
    // Actually, the simplest cross-platform approach: use node's zlib to gzip
    // a combined tar. But tar format is complex. Let's use the system tar if available,
    // otherwise just skip the archive step.

    const { execSync } = await import("node:child_process");

    // Try system tar first
    try {
      execSync(
        `tar -czf "${tarGzPath}" -C "${backupsDir}" "${TODAY}"`,
        { stdio: "pipe", timeout: 120_000 }
      );
      const archiveSize = statSync(tarGzPath).size;
      console.log(`  ✅ ${tarGzPath}`);
      console.log(`     ${formatBytes(archiveSize)}`);
    } catch {
      // System tar not available or failed — try PowerShell on Windows
      try {
        const tempDir = join(backupsDir, TODAY);
        // Create a .zip instead on Windows as fallback
        const zipPath = join(backupsDir, `supabase-backup-${TODAY}.zip`);
        execSync(
          `powershell -NoProfile -Command "Compress-Archive -Path '${tempDir}\\*' -DestinationPath '${zipPath}' -Force"`,
          { stdio: "pipe", timeout: 120_000 }
        );
        const archiveSize = statSync(zipPath).size;
        console.log(`  ✅ ${zipPath}  (zip fallback on Windows)`);
        console.log(`     ${formatBytes(archiveSize)}`);
      } catch (zipErr) {
        console.log(`  ⚠  Could not create archive (tar and zip both failed).`);
        console.log(`     Individual JSON files are still available in: ${backupDir}`);
        console.log(`     Error: ${zipErr.message}`);
      }
    }
  } catch (err) {
    console.log(`  ⚠  Archive creation failed: ${err.message}`);
  }

  // ── Prune old backups ──
  console.log(`\n🧹 Pruning backups older than ${BACKUP_RETENTION_DAYS} days...`);
  const pruned = pruneOldBackups(backupsDir);
  if (pruned > 0) {
    console.log(`  Removed ${pruned} old backup(s)`);
  } else {
    console.log(`  No old backups to remove`);
  }

  // ── Summary ──
  const successCount = Object.values(manifest.tables).filter((t) => !t.error).length;
  const errorCount = Object.values(manifest.tables).filter((t) => t.error).length;

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  Backup Complete");
  console.log(`  ✅ Tables exported: ${successCount}/${tablesToBackup.length}`);
  if (errorCount > 0) {
    console.log(`  ❌ Tables with errors: ${errorCount}`);
    for (const [name, t] of Object.entries(manifest.tables)) {
      if (t.error) console.log(`     - ${name}: ${t.error}`);
    }
  }
  console.log(`  📊 Total rows:      ${manifest.totalRows.toLocaleString()}`);
  console.log(`  📁 Total size:      ${formatBytes(manifest.totalSizeBytes)}`);
  console.log(`  📂 Backup location: ${backupDir}`);
  console.log("═══════════════════════════════════════════════════════════\n");

  process.exit(errorCount > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(`\n❌ Fatal error: ${err.message}`);
  console.error(err.stack);
  process.exit(2);
});
