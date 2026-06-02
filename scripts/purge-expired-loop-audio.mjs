/**
 * Purge loop-audio Storage + inline Postgres pour loops > N jours.
 * Usage:
 *   node scripts/purge-expired-loop-audio.mjs [--dry-run]
 *   node scripts/purge-expired-loop-audio.mjs  (live — invoke Edge purge-loop-audio)
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

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

const dryRun = process.argv.includes("--dry-run");
const env = loadEnv();
const url = (env.VITE_SUPABASE_URL ?? "").replace(/\/$/, "");
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const cronSecret = env.CRON_SECRET ?? "";

if (!url || !serviceKey) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const fnUrl = `${url}/functions/v1/purge-loop-audio`;
const headers = {
  Authorization: `Bearer ${serviceKey}`,
  "Content-Type": "application/json",
};
if (cronSecret) headers["x-cron-secret"] = cronSecret;

console.log(dryRun ? "=== DRY RUN (no invoke) ===" : "=== LIVE PURGE ===");
console.log(`POST ${fnUrl}`);

if (dryRun) {
  console.log("Relance sans --dry-run pour exécuter.");
  process.exit(0);
}

const res = await fetch(fnUrl, { method: "POST", headers, body: "{}" });
const text = await res.text();
let data;
try {
  data = text ? JSON.parse(text) : null;
} catch {
  data = text;
}

if (!res.ok) {
  console.error("Purge failed:", res.status, data);
  process.exit(1);
}

console.log(JSON.stringify(data, null, 2));
