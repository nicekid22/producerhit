/** Vérifie l'état Voice Studio en prod via service role. */
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
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[k] = v;
  }
}

loadDotEnv();

const url = process.env.VITE_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !key) {
  console.error("VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant");
  process.exit(1);
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
};

async function probe(label, fn) {
  try {
    const result = await fn();
    console.log(`OK  ${label}:`, JSON.stringify(result));
    return true;
  } catch (e) {
    console.log(`FAIL ${label}:`, e.message);
    return false;
  }
}

async function main() {
  await probe("profiles.voice_to_song_used_this_month", async () => {
    const res = await fetch(`${url}/rest/v1/profiles?select=voice_to_song_used_this_month&limit=1`, { headers });
    const text = await res.text();
    if (!res.ok) throw new Error(`${res.status} ${text}`);
    return JSON.parse(text);
  });

  await probe("profiles.voice_clone_used_this_month", async () => {
    const res = await fetch(`${url}/rest/v1/profiles?select=voice_clone_used_this_month&limit=1`, { headers });
    const text = await res.text();
    if (!res.ok) throw new Error(`${res.status} ${text}`);
    return JSON.parse(text);
  });

  await probe("voice_profiles table", async () => {
    const res = await fetch(`${url}/rest/v1/voice_profiles?select=id&limit=1`, { headers });
    const text = await res.text();
    if (!res.ok) throw new Error(`${res.status} ${text}`);
    return JSON.parse(text);
  });

  await probe("rpc check_and_consume_voice_to_song", async () => {
    const res = await fetch(`${url}/rest/v1/rpc/check_and_consume_voice_to_song`, {
      method: "POST",
      headers,
      body: "{}",
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`${res.status} ${text}`);
    return JSON.parse(text);
  });

  await probe("storage bucket voice-uploads", async () => {
    const res = await fetch(`${url}/storage/v1/bucket/voice-uploads`, { headers });
    const text = await res.text();
    if (!res.ok) throw new Error(`${res.status} ${text}`);
    return JSON.parse(text);
  });

  await probe("storage bucket voice-profiles", async () => {
    const res = await fetch(`${url}/storage/v1/bucket/voice-profiles`, { headers });
    const text = await res.text();
    if (!res.ok) throw new Error(`${res.status} ${text}`);
    return JSON.parse(text);
  });

  await probe("edge transcribe-voice", async () => {
    const res = await fetch(`${url}/functions/v1/transcribe-voice`, {
      method: "OPTIONS",
      headers: { apikey: key },
    });
    return { status: res.status };
  });

  await probe("edge voice-profile", async () => {
    const res = await fetch(`${url}/functions/v1/voice-profile`, {
      method: "OPTIONS",
      headers: { apikey: key },
    });
    return { status: res.status };
  });

  const geminiKey = process.env.GOOGLE_API_KEY_NEW?.trim() || process.env.GEMINI_API_KEY?.trim();
  if (geminiKey) {
    await probe("gemini transcribe API (GOOGLE_API_KEY_NEW)", async () => {
      const model = process.env.GEMINI_TRANSCRIBE_MODEL?.trim() || "gemini-2.0-flash";
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: "OK" }] }] }),
        },
      );
      const json = await res.json();
      if (!res.ok) {
        const reason = json?.error?.details?.find((d) => d.reason)?.reason;
        throw new Error(`${res.status} ${json?.error?.message?.slice(0, 80) || "fail"}${reason ? ` (${reason})` : ""}`);
      }
      return { status: res.status, model };
    });
  } else {
    console.log("SKIP gemini API: no GOOGLE_API_KEY_NEW in .env");
  }

  console.log("\nVoice Studio transcription: Gemini (Whisper si OPENAI_API_KEY côté Supabase).");
}

main();
