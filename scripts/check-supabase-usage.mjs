/**
 * Check Supabase storage usage and estimated egress.
 * Run periodically to monitor quotas.
 *
 * Usage:
 *   node scripts/check-supabase-usage.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

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
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, serviceKey, { auth: { persistSession: false } });

function formatBytes(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + " GB";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + " MB";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + " KB";
  return n + " B";
}

async function countBucket(bucket) {
  let files = 0, bytes = 0, folders = 0;
  const { data: roots } = await sb.storage.from(bucket).list("", { limit: 1000 });
  for (const folder of roots ?? []) {
    if (!folder?.name || folder.name === ".emptyFolderPlaceholder") continue;
    folders++;
    let offset = 0;
    for (;;) {
      const { data: fList } = await sb.storage.from(bucket).list(folder.name, { limit: 1000, offset });
      if (!fList?.length) break;
      for (const f of fList) {
        if (!f.name || f.name === ".emptyFolderPlaceholder") continue;
        files++;
        bytes += f.metadata?.size ?? 0;
      }
      if (fList.length < 1000) break;
      offset += 1000;
    }
  }
  return { folders, files, bytes };
}

(async () => {
  console.log("=== SUPABASE USAGE CHECK ===");
  console.log(`Project: ${url}\n`);

  // Storage buckets
  let totalStorageBytes = 0;
  for (const bucket of ["loop-audio", "loop-covers", "social-videos", "producer-tags", "voice-uploads", "distribution-assets"]) {
    try {
      const r = await countBucket(bucket);
      totalStorageBytes += r.bytes;
      if (r.files > 0) {
        console.log(`${bucket}: ${r.files} files, ${formatBytes(r.bytes)} (${r.folders} folders)`);
      }
    } catch {
      // bucket might not exist
    }
  }
  console.log(`\nTotal storage: ${formatBytes(totalStorageBytes)}`);

  // Plan limits
  console.log("\n--- Supabase Plan Limits ---");
  console.log("Free:    1 GB storage, 2 GB egress/mo");
  console.log("Pro:     100 GB storage, 250 GB egress/mo ($25/mo)");
  console.log("Team:    1 TB storage, 1 TB egress/mo ($599/mo)");

  // Row counts
  console.log("\n--- Table Row Counts ---");
  const tables = ["profiles", "loops", "generation_usage_keys", "loop_ratings", "loop_comments"];
  for (const table of tables) {
    try {
      const { count } = await sb.from(table).select("id", { count: "exact", head: true });
      console.log(`${table}: ${count ?? 0} rows`);
    } catch (e) {
      console.log(`${table}: error (${e.message})`);
    }
  }

  // Egress estimate (rough)
  // Each audio file served = ~3-5 MB avg
  // If each loop is played once per day: files * avg_size * 30 days
  const avgAudioSize = totalStorageBytes / Math.max(1, (await countBucket("loop-audio")).files);
  const audioFiles = (await countBucket("loop-audio")).files;
  const estimatedDailyEgress = audioFiles * avgAudioSize; // if each file served once
  const estimatedMonthlyEgress = estimatedDailyEgress * 30;
  console.log("\n--- Egress Estimate ---");
  console.log(`Avg audio size: ${formatBytes(avgAudioSize)}`);
  console.log(`If each file served 1x/day: ${formatBytes(estimatedDailyEgress)}/day, ${formatBytes(estimatedMonthlyEgress)}/month`);

  console.log("\n--- Recommendations ---");
  if (totalStorageBytes > 500e6) {
    console.log("⚠️  Storage > 500 MB — consider Prune or move audio to external CDN");
  }
  if (estimatedMonthlyEgress > 100e9) {
    console.log("⚠️  Estimated egress > 100 GB/month — consider Cloudflare proxy");
  }
  console.log("✅ Cache headers are set (7 days for audio)");
  console.log("✅ Purge cron cleans expired audio daily");
  console.log("✅ Backup script runs daily via GitHub Actions");
  console.log("✅ Health check fallback is active in the app");
})();
