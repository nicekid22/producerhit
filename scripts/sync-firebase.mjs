/**
 * Sync critical data from Supabase primary to Firebase Firestore.
 * Runs alongside the Supabase backup sync (every 3 days via GitHub Action).
 *
 * Firestore collections:
 *   - profiles/{userId} — user profile data for fallback reads
 *   - loops/{loopId} — loop metadata (no audio binary) for fallback reads
 *
 * Usage:
 *   FIREBASE_SERVICE_ACCOUNT='{"project_id":"...","private_key":"...","client_email":"..."}' \
 *   node scripts/sync-firebase.mjs [--dry-run]
 *
 * Requires:
 *   - firebase-admin (npm install firebase-admin)
 *   - FIREBASE_SERVICE_ACCOUNT env var (JSON string of service account key)
 *   - VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (primary Supabase)
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

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
const serviceAccountJson = env.FIREBASE_SERVICE_ACCOUNT;

if (!primaryUrl || !primaryKey) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Firebase Admin init
// ---------------------------------------------------------------------------

let db;
let app;
try {
  if (serviceAccountJson) {
    const serviceAccount = JSON.parse(serviceAccountJson);
    app = initializeApp({ credential: cert(serviceAccount) });
  } else {
    app = initializeApp();
  }
  db = getFirestore(app);
  console.log(`Firebase Admin initialized (project: ${app.options.projectId})`);
} catch (e) {
  console.error("Firebase init failed:", e.message);
  console.error("Set FIREBASE_SERVICE_ACCOUNT env var (JSON) or GOOGLE_APPLICATION_CREDENTIALS.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Supabase client
// ---------------------------------------------------------------------------

const primary = createClient(primaryUrl, primaryKey, { auth: { persistSession: false } });

const SYNC_BATCH = 500;

// ---------------------------------------------------------------------------
// Sync helpers
// ---------------------------------------------------------------------------

/**
 * Fetch all rows from a Supabase table (paginated) and upsert to Firestore.
 * @param {string} tableName
 * @param {string} collectionName - Firestore collection name
 * @param {string[]} fields - columns to fetch
 * @param {object} options
 */
async function syncToFirestore(tableName, collectionName, fields, options = {}) {
  const { modifyRow, batchSize = 400 } = options;
  console.log(`\nSyncing ${tableName} → Firestore/${collectionName}...`);

  let offset = 0;
  let totalRows = 0;
  let totalWritten = 0;
  const batch = db.batch();

  for (;;) {
    const { data: rows, error } = await primary
      .from(tableName)
      .select(fields.join(","))
      .range(offset, offset + SYNC_BATCH - 1);

    if (error) {
      console.error(`  Fetch error: ${error.message}`);
      break;
    }
    if (!rows?.length) break;

    const transformed = modifyRow ? rows.map(modifyRow) : rows;

    for (const row of transformed) {
      const docId = row.id;
      if (!docId) continue;

      const docRef = db.collection(collectionName).doc(docId);
      const data = {
        ...row,
        synced_at: FieldValue.serverTimestamp(),
      };

      if (!dryRun) {
        batch.set(docRef, data, { merge: true });
        totalWritten++;
      } else {
        totalWritten++;
      }

      // Firestore batch limit is 500 operations
      if (totalWritten % batchSize === 0 && !dryRun) {
        await batch.commit();
      }
    }

    totalRows += rows.length;
    process.stdout.write(`\r  Fetched: ${totalRows}, Written: ${totalWritten}`);
    if (rows.length < SYNC_BATCH) break;
    offset += SYNC_BATCH;
  }

  // Commit remaining
  if (!dryRun && totalWritten % batchSize !== 0) {
    await batch.commit();
  }

  console.log(`\n  Done: ${totalRows} rows fetched, ${totalWritten} written`);
  return { fetched: totalRows, written: totalWritten };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const PROFILE_FIELDS = [
  "id", "plan", "username", "avatar_id", "creator_type", "bio",
  "loops_used_this_month", "referral_bonus", "purchased_bonus",
  "level_bonus", "daily_bonus_month", "referral_code", "updated_at",
].join(",");

const LOOP_FIELDS = [
  "id", "user_id", "name", "genre", "bpm", "mood", "key", "scale",
  "cover_url", "audio_url", "is_public", "is_saved", "created_at",
  "loop_length", "energy_level", "influence",
].join(",");

async function main() {
  console.log(dryRun ? "=== DRY RUN FIREBASE SYNC ===" : "=== LIVE FIREBASE SYNC ===");
  console.log(`Primary: ${primaryUrl}`);
  console.log(`Firebase: ${app.options.projectId}`);

  const results = {};

  // 1. Profiles — critical for auth/plan display
  results.profiles = await syncToFirestore("profiles", "profiles", PROFILE_FIELDS.split(","));

  // 2. Loops — metadata only (no audio binary)
  results.loops = await syncToFirestore("loops", "loops", LOOP_FIELDS.split(","), {
    modifyRow: (row) => ({
      ...row,
      audio_url: null, // Don't sync audio to Firestore (size limits)
    }),
  });

  console.log("\n=== SYNC SUMMARY ===");
  let totalRows = 0;
  for (const [table, r] of Object.entries(results)) {
    console.log(`  ${table}: ${r.fetched} rows → ${r.written} written`);
    totalRows += r.fetched;
  }
  console.log(`  Total: ${totalRows} rows synced to Firebase`);
  if (dryRun) console.log("  (dry run — nothing was written)");
}

main().catch((e) => {
  console.error("Firebase sync failed:", e.message);
  process.exit(1);
});
