/**
 * Teste batch_size=2 sur /v1/chat/completions (acemusic.ai).
 * Usage: ACE_STEP_API_KEY=xxx node scripts/probe-ace-dual-batch.mjs
 */
import "dotenv/config";

const apiKey = process.env.ACE_STEP_API_KEY || process.env.VITE_ACE_STEP_API_KEY;
const baseUrl = (process.env.ACE_STEP_BASE_URL || process.env.VITE_ACE_STEP_BASE_URL || "https://api.acemusic.ai").replace(
  /\/$/,
  "",
);

if (!apiKey) {
  console.error("Missing ACE_STEP_API_KEY or VITE_ACE_STEP_API_KEY");
  process.exit(1);
}

const seeds = [42_001, 42_001 + 12_345];

const body = {
  model: "acestep-v15-xl-turbo",
  thinking: true,
  use_format: false,
  messages: [
    {
      role: "user",
      content:
        "Create a short modern 2026 dark trap instrumental beat. No vocals. Mood: dark and punchy. BPM around 140.",
    },
  ],
  lyrics: "[instrumental]",
  task_type: "text2music",
  batch_size: 2,
  audio_config: {
    instrumental: true,
    duration: 24,
    format: "mp3",
    audio_format: "mp3",
    vocal_language: "en",
    shift: 3,
    inference_steps: 8,
    seed: seeds[0],
    seeds,
  },
  stream: false,
};

console.log("POST", `${baseUrl}/v1/chat/completions`, "batch_size=2 seeds=", seeds);
const started = Date.now();
const res = await fetch(`${baseUrl}/v1/chat/completions`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  body: JSON.stringify(body),
});
const text = await res.text();
console.log("status", res.status, "elapsed_ms", Date.now() - started);

if (!res.ok) {
  console.log(text.slice(0, 2000));
  process.exit(2);
}

let json;
try {
  json = JSON.parse(text);
} catch {
  console.log("non-JSON response", text.slice(0, 500));
  process.exit(3);
}

const msg = json?.choices?.[0]?.message;
const audio = Array.isArray(msg?.audio) ? msg.audio : [];
console.log("message.audio count:", audio.length);
audio.forEach((a, i) => {
  const url =
    typeof a?.audio_url === "object" && a.audio_url?.url
      ? String(a.audio_url.url).slice(0, 80)
      : typeof a?.url === "string"
        ? a.url.slice(0, 80)
        : "(no url)";
  console.log(`  [${i}]`, url, url.startsWith("data:") ? `(data len ${a.audio_url?.url?.length ?? a.url?.length})` : "");
});

if (audio.length >= 2) {
  console.log("\nOK — batch semble supporté sur chat/completions. Envisager VITE_ACE_DUAL_BATCH=1 côté app.");
} else if (audio.length === 1) {
  console.log("\nUn seul audio — batch_size ignoré ou non supporté sur cet endpoint. Garder 2 appels séquentiels.");
} else {
  console.log("\nAucun audio dans message.audio — vérifier la réponse brute.");
  console.log(JSON.stringify(json, null, 2).slice(0, 1500));
}
