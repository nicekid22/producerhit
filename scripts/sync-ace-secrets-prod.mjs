/**
 * Réordonne ACE_STEP_API_KEYS sur Supabase : clés OK en premier, mortes exclues.
 * Usage: node scripts/sync-ace-secrets-prod.mjs [--dry-run]
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

function loadDotEnv() {
  if (!existsSync(".env")) return;
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(k in process.env)) process.env[k] = v;
  }
}

loadDotEnv();

function splitKeys(raw) {
  if (!raw?.trim()) return [];
  return raw.split(/[,;\s]+/).map((k) => k.trim()).filter((k) => k.length >= 8);
}

function loadAceKeys() {
  const raw = [];
  raw.push(...splitKeys(process.env.ACE_STEP_API_KEYS ?? ""));
  const k1 = (process.env.ACE_STEP_API_KEY ?? "").trim();
  if (k1) raw.push(k1);
  for (let i = 2; i <= 10; i++) {
    const ki = (process.env[`ACE_STEP_API_KEY_${i}`] ?? "").trim();
    if (ki) raw.push(ki);
  }
  const out = [];
  const seen = new Set();
  for (const k of raw) {
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}

const baseUrl = (process.env.ACE_STEP_BASE_URL || "https://api.acemusic.ai").replace(/\/$/, "");
const dryRun = process.argv.includes("--dry-run");
const keys = loadAceKeys();

if (!keys.length) {
  console.error("Aucune clé ACE dans .env");
  process.exit(1);
}

async function probe(apiKey) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 35_000);
  try {
    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "acestep-v15-xl-turbo",
        thinking: false,
        use_format: false,
        messages: [{ role: "user", content: "Short trap test" }],
        lyrics: "[instrumental]",
        task_type: "text2music",
        audio_config: { instrumental: true, duration: 10, format: "mp3", inference_steps: 6, seed: 42 },
        stream: false,
      }),
      signal: controller.signal,
    });
    if (!res.ok) return false;
    const json = await res.json();
    const audios = json?.choices?.[0]?.message?.audio;
    return Array.isArray(audios) ? audios.length > 0 : Boolean(audios);
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

console.log(`Probe ${keys.length} clé(s) ACE (pause 8s entre chaque)…`);
const ok = [];
const bad = [];
for (let i = 0; i < keys.length; i++) {
  const k = keys[i];
  const prefix = `${k.slice(0, 3)}…${k.slice(-2)}`;
  process.stdout.write(`  [#${i}] ${prefix} … `);
  const pass = await probe(k);
  console.log(pass ? "OK" : "FAIL");
  (pass ? ok : bad).push(k);
  if (i < keys.length - 1) await new Promise((r) => setTimeout(r, 8000));
}

if (!ok.length) {
  console.error("Aucune clé OK — secrets Supabase non modifiés.");
  process.exit(1);
}

const ordered = ok;
if (ordered.length < keys.length) {
  console.warn(`⚠ ${keys.length - ordered.length} clé(s) exclue(s) (probe FAIL).`);
}
console.log(`\nRésultat: ${ok.length} OK, ${bad.length} FAIL`);
console.log(`Ordre Supabase: ${ok.length} clé(s) prioritaires`);

if (dryRun) {
  console.log("--dry-run: pas de supabase secrets set");
  process.exit(0);
}

const projectRef = "pmfnzenqemnonpglmjqx";
const value = ordered.join(",");
execFileSync(
  "supabase",
  ["secrets", "set", `ACE_STEP_API_KEYS=${value}`, "--project-ref", projectRef],
  { stdio: "inherit", env: process.env },
);
if (ok[0]) {
  execFileSync(
    "supabase",
    ["secrets", "set", `ACE_STEP_API_KEY=${ok[0]}`, "--project-ref", projectRef],
    { stdio: "inherit", env: process.env },
  );
}
console.log("✓ Secrets Supabase mis à jour (clés OK en tête).");
