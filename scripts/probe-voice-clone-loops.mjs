/**
 * Vérifie en prod si les dernières chansons ont bien le flag voice clone dans stems_url.
 * Usage: node scripts/probe-voice-clone-loops.mjs
 */
import { readFileSync, existsSync } from "node:fs";

function loadDotEnv() {
  if (!existsSync(".env")) return;
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    const k = t.slice(0, i).trim();
    if (process.env[k]) continue;
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    process.env[k] = v;
  }
}

loadDotEnv();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const url = process.env.VITE_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !key) {
  console.error("VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant");
  process.exit(1);
}

const headers = { apikey: key, Authorization: `Bearer ${key}` };

const res = await fetch(
  `${url}/rest/v1/loops?select=id,name,created_at,stems_url&order=created_at.desc&limit=15`,
  { headers },
);
const rows = await res.json();
if (!res.ok) {
  console.error(res.status, rows);
  process.exit(1);
}

console.log("Dernières loops — flags voice clone (stems_url.ace):\n");
for (const row of rows) {
  const ace = row.stems_url?.ace;
  const flags = ace
    ? {
        voiceClone: ace.voiceClone ?? false,
        fallback: ace.voiceCloneFallback ?? false,
        profile: ace.voiceProfileName || ace.voiceProfileId || "—",
      }
    : null;
  console.log(`${row.created_at?.slice(0, 19)} | ${row.name?.slice(0, 40)} | ${flags ? JSON.stringify(flags) : "no ace meta"}`);
}
