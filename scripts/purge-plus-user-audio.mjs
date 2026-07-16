/**
 * Purge ALL audio files + covers for a specific Plus plan user.
 *
 * Usage:
 *   node scripts/purge-plus-user-audio.mjs                  # live purge
 *   node scripts/purge-plus-user-audio.mjs --dry-run         # preview only
 *
 * Target user:
 *   info.producemarket@gmail.com
 *   7ce66a37-8b7e-49a4-a38b-a120a5074b71
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// ─── Config ──────────────────────────────────────────────────────────
const USER_ID = "7ce66a37-8b7e-49a4-a38b-a120a5074b71";
const USER_EMAIL = "info.producemarket@gmail.com";
const STORAGE_BATCH = 50; // files per delete request
const DB_BATCH = 100; // rows per update/delete request

// ─── Env loader ──────────────────────────────────────────────────────
function loadEnv() {
  const candidates = [
    resolve(process.cwd(), ".env"),
    resolve(process.cwd(), ".env.local"),
  ];
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

// ─── Helpers ─────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function chunks(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ─── Main ────────────────────────────────────────────────────────────
const dryRun = process.argv.includes("--dry-run");
const env = loadEnv();
const supabaseUrl = (env.VITE_SUPABASE_URL ?? "").replace(/\/$/, "");
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!supabaseUrl || !serviceKey) {
  console.error(
    "❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env"
  );
  process.exit(1);
}

const apiHeaders = {
  Authorization: `Bearer ${serviceKey}`,
  apikey: serviceKey,
  "Content-Type": "application/json",
};

// ─── Storage helpers ─────────────────────────────────────────────────

/** List ALL files in a bucket for a given prefix (paginated) */
async function listStorageFiles(bucket, prefix) {
  const files = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const res = await fetch(
      `${supabaseUrl}/storage/v1/object/list/${bucket}`,
      {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({
          prefix: prefix,
          limit,
          offset,
          sortBy: { column: "name", order: "asc" },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error(`  ⚠ Failed to list ${bucket}/${prefix} (offset ${offset}): ${res.status} ${errText}`);
      break;
    }

    const data = await res.json();
    if (!data || data.length === 0) break;

    // Filter out folder entries (no id means it's a folder)
    for (const item of data) {
      if (item.id) {
        files.push(`${prefix}${item.name}`);
      }
    }

    if (data.length < limit) break;
    offset += limit;
  }

  return files;
}

/** Delete files from storage in batches */
async function deleteStorageFiles(bucket, filePaths) {
  let deleted = 0;
  let errors = 0;

  for (const batch of chunks(filePaths, STORAGE_BATCH)) {
    const res = await fetch(
      `${supabaseUrl}/storage/v1/object/${bucket}`,
      {
        method: "DELETE",
        headers: apiHeaders,
        body: JSON.stringify({ prefixes: batch }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error(`  ⚠ Batch delete failed in ${bucket}: ${res.status} ${errText}`);
      errors += batch.length;
    } else {
      deleted += batch.length;
      process.stdout.write(`  ✓ Deleted ${deleted}/${filePaths.length} from ${bucket}\r`);
    }
  }

  return { deleted, errors };
}

// ─── DB helpers ──────────────────────────────────────────────────────

/** Get all loop IDs for this user */
async function getUserLoopIds() {
  const ids = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/loops?id=user_id&select=id&user_id=eq.${USER_ID}&offset=${offset}&limit=${limit}`,
      { headers: { ...apiHeaders, Prefer: "return=representation" } }
    );

    if (!res.ok) {
      // Try standard select
      const res2 = await fetch(
        `${supabaseUrl}/rest/v1/loops?select=id&user_id=eq.${USER_ID}&offset=${offset}&limit=${limit}`,
        { headers: { ...apiHeaders, Prefer: "return=representation" } }
      );

      if (!res2.ok) {
        const errText = await res2.text();
        console.error(`  ⚠ Failed to fetch loop IDs: ${res2.status} ${errText}`);
        break;
      }

      const data = await res2.json();
      if (!data || data.length === 0) break;
      ids.push(...data.map((r) => r.id));
      if (data.length < limit) break;
      offset += limit;
    } else {
      const data = await res.json();
      if (!data || data.length === 0) break;
      ids.push(...data.map((r) => r.id));
      if (data.length < limit) break;
      offset += limit;
    }
  }

  return ids;
}

/** Update loops in batches by ID to avoid statement timeouts */
async function updateLoops(loopIds) {
  let totalUpdated = 0;

  for (const batch of chunks(loopIds, DB_BATCH)) {
    const filter = `id=in.(${batch.join(",")})`;
    const res = await fetch(
      `${supabaseUrl}/rest/v1/loops?${filter}`,
      {
        method: "PATCH",
        headers: {
          ...apiHeaders,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          audio_url: null,
          provider_audio_inline: null,
          is_public: false,
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error(`  ⚠ Failed to update batch: ${res.status} ${errText}`);
    } else {
      totalUpdated += batch.length;
      process.stdout.write(`  ✓ Updated ${totalUpdated}/${loopIds.length} loops\r`);
    }
  }

  return totalUpdated;
}

/** Delete used_pinterest_covers for this user's loops (in batches) */
async function deletePinterestCovers(loopIds) {
  let totalDeleted = 0;

  for (const batch of chunks(loopIds, DB_BATCH)) {
    const filter = `loop_id=in.(${batch.join(",")})`;
    const res = await fetch(
      `${supabaseUrl}/rest/v1/used_pinterest_covers?${filter}`,
      {
        method: "DELETE",
        headers: {
          ...apiHeaders,
          Prefer: "return=minimal",
        },
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error(`  ⚠ Failed to delete Pinterest covers batch: ${res.status} ${errText}`);
    } else {
      totalDeleted += batch.length; // approximate
    }
  }

  return totalDeleted;
}

// ─── RUN ─────────────────────────────────────────────────────────────
async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║  PURGE PLUS USER AUDIO — info.producemarket@gmail.com     ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log(`  User ID : ${USER_ID}`);
  console.log(`  Email   : ${USER_EMAIL}`);
  console.log(`  Mode    : ${dryRun ? "🔍 DRY RUN (no changes)" : "🔴 LIVE PURGE"}`);
  console.log("");

  // ── 1. List files in loop-audio ────────────────────────────────
  console.log("━━━ 1. Listing loop-audio files ━━━");
  const audioFiles = await listStorageFiles("loop-audio", `${USER_ID}/`);
  console.log(`  Found ${audioFiles.length} files in loop-audio`);
  if (audioFiles.length > 0) {
    console.log(`  First: ${audioFiles[0]}`);
    console.log(`  Last : ${audioFiles[audioFiles.length - 1]}`);
  }
  console.log("");

  // ── 2. List files in loop-covers ──────────────────────────────
  console.log("━━━ 2. Listing loop-covers files ━━━");
  const coverFiles = await listStorageFiles("loop-covers", `${USER_ID}/`);
  console.log(`  Found ${coverFiles.length} files in loop-covers`);
  if (coverFiles.length > 0) {
    console.log(`  First: ${coverFiles[0]}`);
    console.log(`  Last : ${coverFiles[coverFiles.length - 1]}`);
  }
  console.log("");

  // ── 3. Get user's loop IDs ────────────────────────────────────
  console.log("━━━ 3. Fetching user's loop IDs ━━━");
  const loopIds = await getUserLoopIds();
  console.log(`  Found ${loopIds.length} loops for user`);
  console.log("");

  // ── Summary before action ─────────────────────────────────────
  console.log("━━━ SUMMARY ━━━");
  console.log(`  loop-audio files  : ${audioFiles.length}`);
  console.log(`  loop-covers files : ${coverFiles.length}`);
  console.log(`  Loops to update   : ${loopIds.length}`);
  console.log(`  Total storage     : ~${((audioFiles.length + coverFiles.length) * 0.016).toFixed(1)} GB (estimate)`);
  console.log("");

  if (dryRun) {
    console.log("🔍 DRY RUN — no changes made. Re-run without --dry-run to execute.");
    process.exit(0);
  }

  // ── 4. Delete loop-audio files ────────────────────────────────
  console.log("━━━ 4. Deleting loop-audio files ━━━");
  if (audioFiles.length > 0) {
    const audioResult = await deleteStorageFiles("loop-audio", audioFiles);
    console.log(`\n  ✅ loop-audio: ${audioResult.deleted} deleted, ${audioResult.errors} errors`);
  } else {
    console.log("  (none to delete)");
  }
  console.log("");

  // ── 5. Delete loop-covers files ───────────────────────────────
  console.log("━━━ 5. Deleting loop-covers files ━━━");
  if (coverFiles.length > 0) {
    const coverResult = await deleteStorageFiles("loop-covers", coverFiles);
    console.log(`\n  ✅ loop-covers: ${coverResult.deleted} deleted, ${coverResult.errors} errors`);
  } else {
    console.log("  (none to delete)");
  }
  console.log("");

  // ── 6. Update loops table (null audio, set private) ───────────
  console.log("━━━ 6. Updating loops table ━━━");
  if (loopIds.length > 0) {
    const updated = await updateLoops(loopIds);
    console.log(`\n  ✅ Updated ${updated} loops: audio_url=null, provider_audio_inline=null, is_public=false`);
  } else {
    console.log("  (no loops to update)");
  }
  console.log("");

  // ── 7. Delete from used_pinterest_covers ──────────────────────
  console.log("━━━ 7. Deleting used_pinterest_covers ━━━");
  if (loopIds.length > 0) {
    const coversDeleted = await deletePinterestCovers(loopIds);
    console.log(`  ✅ Deleted ${coversDeleted} pinterest cover records`);
  } else {
    console.log("  (no covers to delete)");
  }
  console.log("");

  // ── Final report ──────────────────────────────────────────────
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║  ✅ PURGE COMPLETE                                        ║");
  console.log("╠══════════════════════════════════════════════════════════════╣");
  console.log(`║  Storage deleted: ${audioFiles.length + coverFiles.length} files`);
  console.log(`║  Loops updated  : ${loopIds.length}`);
  console.log(`║  User           : ${USER_EMAIL}`);
  console.log("╚══════════════════════════════════════════════════════════════╝");
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
