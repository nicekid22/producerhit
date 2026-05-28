/**
 * Audit loop-audio bucket vs loops.audio_url
 * Purge: orphans (+ optional redundant when loop has external URL only)
 * NEVER deletes files still referenced in loops.audio_url
 *
 * Usage:
 *   node supabase/scripts/audit-and-purge-storage.mjs [--dry-run] [--orphans-only] [--include-redundant]
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";

const dryRun = process.argv.includes("--dry-run");
const orphansOnly = process.argv.includes("--orphans-only") || !process.argv.includes("--include-redundant");

function loadEnv() {
  const candidates = [resolve(process.cwd(), ".env"), resolve(process.cwd(), ".env.local")];
  const path = candidates.find((p) => existsSync(p));
  if (!path) return process.env;
  const raw = readFileSync(path, "utf8");
  const env = { ...process.env };
  for (const line of raw.split(/\r?\n/)) {
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

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
const BUCKET = "loop-audio";
const STORAGE_MARKER = "/storage/v1/object/public/loop-audio/";
const MANIFEST_PATH = resolve(process.cwd(), "supabase/scripts/.storage-purge-manifest.json");

function parseStoragePath(name) {
  const parts = name.split("/");
  if (parts.length !== 2) return null;
  const [userId, file] = parts;
  const dot = file.lastIndexOf(".");
  if (dot <= 0) return null;
  return { userId, loopId: file.slice(0, dot), ext: file.slice(dot + 1), path: name };
}

function audioUrlReferencesPath(audioUrl, storagePath) {
  if (!audioUrl || typeof audioUrl !== "string") return false;
  const u = audioUrl.trim();
  if (!u) return false;
  return u.includes(STORAGE_MARKER + storagePath) || u.endsWith("/" + storagePath);
}

async function listAllObjectsFromDb() {
  const all = [];
  let offset = 0;
  const page = 500;
  for (;;) {
    const { data, error } = await supabase.rpc("exec_sql_storage_list", { lim: page, off: offset });
    if (error && error.message?.includes("Could not find")) {
      return listAllObjectsViaApi();
    }
    if (error) throw error;
    if (!data?.length) break;
    for (const row of data) {
      all.push({
        path: row.path,
        size: Number(row.size) || 0,
        parsed: parseStoragePath(row.path),
      });
    }
    if (data.length < page) break;
    offset += page;
  }
  return all;
}

async function listAllObjectsViaApi() {
  const all = [];
  const { data: roots, error } = await supabase.storage.from(BUCKET).list("", { limit: 1000 });
  if (error) throw error;
  for (const folder of roots ?? []) {
    if (!folder?.name) continue;
    const userId = folder.name;
    let fOffset = 0;
    for (;;) {
      const { data: files, error: fe } = await supabase.storage.from(BUCKET).list(userId, {
        limit: 1000,
        offset: fOffset,
      });
      if (fe) throw fe;
      if (!files?.length) break;
      for (const f of files) {
        if (!f.name || f.name === ".emptyFolderPlaceholder") continue;
        all.push({
          path: `${userId}/${f.name}`,
          size: f.metadata?.size ?? 0,
          parsed: parseStoragePath(`${userId}/${f.name}`),
        });
      }
      if (files.length < 1000) break;
      fOffset += 1000;
    }
  }
  return all;
}

async function fetchLoopAudioMap() {
  const loopById = new Map();
  let inStorage = 0;
  let external = 0;
  let empty = 0;
  let page = 0;
  const pageSize = 300;

  for (;;) {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from("loops")
      .select("id, audio_url")
      .order("created_at", { ascending: true })
      .range(from, to);
    if (error) throw error;
    if (!data?.length) break;
    for (const l of data) {
      loopById.set(l.id, l);
      const u = typeof l.audio_url === "string" ? l.audio_url.trim() : "";
      if (!u) empty += 1;
      else if (u.includes(STORAGE_MARKER) || u.includes("/loop-audio/")) inStorage += 1;
      else external += 1;
    }
    if (data.length < pageSize) break;
    page += 1;
    process.stdout.write(`\rLoops loaded: ${loopById.size}`);
  }
  process.stdout.write("\n");
  return { loopById, stats: { total: loopById.size, inStorage, external, empty } };
}

function formatBytes(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + " GB";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + " MB";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + " KB";
  return n + " B";
}

function writeManifest(payload) {
  mkdirSync(dirname(MANIFEST_PATH), { recursive: true });
  writeFileSync(MANIFEST_PATH, JSON.stringify(payload, null, 2), "utf8");
  console.log(`Manifest: ${MANIFEST_PATH}`);
}

async function main() {
  console.log(dryRun ? "=== DRY RUN ===" : "=== LIVE PURGE ===");
  console.log(orphansOnly ? "Mode: ORPHELINS UNIQUEMENT (safe)" : "Mode: orphelins + redondants externe");

  console.log("Fetching loops (paginated)...");
  const { loopById, stats } = await fetchLoopAudioMap();

  console.log("Listing bucket objects...");
  const objects = await listAllObjectsViaApi();
  const totalBytes = objects.reduce((s, o) => s + (Number(o.size) || 0), 0);

  const keep = [];
  const purgeOrphan = [];
  const purgeRedundant = [];

  for (const obj of objects) {
    const p = obj.parsed;
    if (!p) {
      purgeOrphan.push({ ...obj, reason: "invalid_path" });
      continue;
    }

    const loop = loopById.get(p.loopId);
    if (!loop) {
      purgeOrphan.push({ ...obj, reason: "no_loop_row" });
      continue;
    }

    if (audioUrlReferencesPath(loop.audio_url, obj.path)) {
      keep.push({ ...obj, reason: "referenced_in_audio_url" });
      continue;
    }

    if (!orphansOnly) {
      const u = typeof loop.audio_url === "string" ? loop.audio_url.trim() : "";
      if (u && (u.startsWith("http://") || u.startsWith("https://")) && !u.includes(STORAGE_MARKER)) {
        purgeRedundant.push({ ...obj, reason: "loop_has_external_url" });
        continue;
      }
    }

    keep.push({ ...obj, reason: "loop_exists_keep" });
  }

  const sum = (arr) => arr.reduce((s, o) => s + (Number(o.size) || 0), 0);

  console.log("\n--- RAPPORT ---");
  console.log(`Loops total: ${stats.total}`);
  console.log(`  audio_url → Supabase Storage: ${stats.inStorage}`);
  console.log(`  audio_url → externe: ${stats.external}`);
  console.log(`  audio_url vide: ${stats.empty}`);
  console.log(`Bucket: ${objects.length} fichiers, ${formatBytes(totalBytes)}`);
  console.log(`  GARDER: ${keep.length} (${formatBytes(sum(keep))})`);
  console.log(`  Orphelins: ${purgeOrphan.length} (${formatBytes(sum(purgeOrphan))})`);
  if (!orphansOnly) {
    console.log(`  Redondants: ${purgeRedundant.length} (${formatBytes(sum(purgeRedundant))})`);
  }

  const toDelete = orphansOnly
    ? purgeOrphan.map((o) => o.path)
    : [...purgeOrphan, ...purgeRedundant].map((o) => o.path);

  writeManifest({
    at: new Date().toISOString(),
    dryRun,
    orphansOnly,
    stats,
    keepCount: keep.length,
    deletePaths: toDelete,
    deleteDetails: orphansOnly ? purgeOrphan : [...purgeOrphan, ...purgeRedundant],
  });

  if (!toDelete.length) {
    console.log("\nRien à purger.");
    return;
  }

  console.log(`\n${dryRun ? "Would delete" : "Deleting"} ${toDelete.length} files...`);
  if (!dryRun && stats.inStorage > 0) {
    console.log(`Les ${stats.inStorage} loops Storage en DB ne sont PAS touchées.`);
  }

  const batchSize = 100;
  let deleted = 0;
  for (let i = 0; i < toDelete.length; i += batchSize) {
    const batch = toDelete.slice(i, i + batchSize);
    if (dryRun) {
      deleted += batch.length;
      continue;
    }
    const { error } = await supabase.storage.from(BUCKET).remove(batch);
    if (error) {
      console.error("\nDelete error:", error.message);
      break;
    }
    deleted += batch.length;
    process.stdout.write(`\rDeleted ${deleted}/${toDelete.length}`);
  }
  console.log(dryRun ? `\nDry run complete.` : `\nDone. Deleted ${deleted} files.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
