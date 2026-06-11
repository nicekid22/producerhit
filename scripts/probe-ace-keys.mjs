/**
 * Teste chaque clé ACE du .env (même ordre que l’Edge generate-loop-ace).
 * Affiche uniquement un préfixe masqué — ne logue jamais la clé complète.
 *
 * Usage (à la racine du projet) :
 *   node scripts/probe-ace-keys.mjs
 */
import { readFileSync, existsSync } from "fs";

function loadDotEnv() {
  const path = ".env";
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i <= 0) continue;
    const key = trimmed.slice(0, i).trim();
    let val = trimmed.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadDotEnv();

function splitEnvList(raw) {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;\s]+/)
    .map((k) => k.trim())
    .filter((k) => k.length >= 8);
}

/** Même ordre que supabase/functions/generate-loop-ace loadAceApiKeys() */
function loadAceApiKeysFromEnv() {
  const raw = [];
  raw.push(...splitEnvList(process.env.ACE_STEP_API_KEYS ?? ""));
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

/** Clés navigateur (local VITE_*) — ordre aceBrowserKeys.ts */
function loadBrowserKeysFromEnv() {
  const fromList = splitEnvList(process.env.VITE_ACE_STEP_API_KEYS ?? "");
  const single = (process.env.VITE_ACE_STEP_API_KEY ?? "").trim();
  const merged = [];
  for (const k of [...fromList, single]) {
    if (k && !merged.includes(k)) merged.push(k);
  }
  return merged;
}

function maskKey(key) {
  if (key.length <= 6) return "***";
  return `${key.slice(0, 3)}…${key.slice(-2)} (len ${key.length})`;
}

const baseUrl = (process.env.ACE_STEP_BASE_URL || process.env.VITE_ACE_STEP_BASE_URL || "https://api.acemusic.ai").replace(
  /\/$/,
  "",
);

async function probeOne(apiKey, label) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45_000);
  const body = {
    model: "acestep-v15-xl-turbo",
    thinking: false,
    use_format: false,
    messages: [{ role: "user", content: "Short dark trap instrumental test. No vocals." }],
    lyrics: "[instrumental]",
    task_type: "text2music",
    audio_config: {
      instrumental: true,
      duration: 12,
      format: "mp3",
      audio_format: "mp3",
      inference_steps: 6,
      seed: 99_001,
    },
    stream: false,
  };

  const started = Date.now();
  try {
    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text().catch(() => "");
    const ms = Date.now() - started;
    let audioCount = 0;
    if (res.ok) {
      try {
        const json = JSON.parse(text);
        const audios = json?.choices?.[0]?.message?.audio;
        audioCount = Array.isArray(audios) ? audios.length : audios ? 1 : 0;
      } catch {
        /* ignore */
      }
    }
    const snippet = text.slice(0, 120).replace(/\s+/g, " ");
    return {
      ok: res.ok && audioCount > 0,
      status: res.status,
      ms,
      audioCount,
      hint: res.ok ? (audioCount ? "OK" : "200 mais pas d’audio") : snippet,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      ms: Date.now() - started,
      audioCount: 0,
      hint: err?.name === "AbortError" ? "timeout 45s" : String(err?.message ?? err),
    };
  } finally {
    clearTimeout(timer);
  }
}

const edgeKeys = loadAceApiKeysFromEnv();
const browserKeys = loadBrowserKeysFromEnv();

if (!edgeKeys.length && !browserKeys.length) {
  console.error("Aucune clé dans .env (ACE_STEP_API_KEYS, ACE_STEP_API_KEY, VITE_ACE_STEP_API_KEYS, …)");
  process.exit(1);
}

console.log("Base URL:", baseUrl);
console.log("");

async function runBlock(title, keys) {
  if (!keys.length) return;
  console.log(`=== ${title} (${keys.length} clé(s)) ===`);
  console.log("Index = aceKeyIndex côté Edge / slot navigateur (0 = première de la liste)\n");

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    console.log(`[#${i}] ${maskKey(key)} — test en cours…`);
    const r = await probeOne(key, `#${i}`);
    const icon = r.ok ? "✓" : "✗";
    console.log(
      `     ${icon} HTTP ${r.status || "—"} | ${r.ms} ms | audios: ${r.audioCount} | ${r.hint}\n`,
    );
  }
}

await runBlock("Edge / Supabase (secrets locaux .env)", edgeKeys);
await runBlock("Navigateur (VITE_* — génération directe en local)", browserKeys);

console.log("---");
console.log("Clé morte = ligne ✗ ci-dessus. Remplace-la au même index dans :");
console.log("  • Supabase → Project Settings → Edge Functions → Secrets");
console.log("     ACE_STEP_API_KEYS (liste virgules) OU ACE_STEP_API_KEY / ACE_STEP_API_KEY_2 …");
console.log("  • Puis .env local + redéploy : supabase secrets set … && supabase functions deploy generate-loop-ace");
