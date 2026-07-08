import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

// Load .env if not already loaded
if (!process.env.VITE_SUPABASE_URL) {
  try {
    const lines = readFileSync(new URL("../.env", import.meta.url), "utf8").split("\n");
    for (const line of lines) {
      const idx = line.indexOf("=");
      if (idx > 0) {
        const key = line.slice(0, idx).trim();
        const val = line.slice(idx + 1).trim();
        if (key && !process.env[key]) process.env[key] = val;
      }
    }
  } catch {}
}

/**
 * ACE Music client for CLI scripts.
 * Calls the generate-loop-ace Edge Function directly.
 */
export async function generateAceTrack({
  caption,
  bpm = 120,
  duration = 32,
  instrumental = true,
  lyrics = "",
  keyScale = "",
  genre = "",
}) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
  }

  // Get a user access token via service role
  const accessToken = await getAccessToken(supabaseUrl, anonKey, serviceRoleKey);

  const body = {
    caption,
    bpm,
    duration,
    instrumental,
    lyrics,
    keyScale,
    genre,
    audioFormat: "mp3",
    useFormat: !lyrics,
    thinking: true,
  };

  console.log(`[ACE] Appel generate-loop-ace...`);
  console.log(`[ACE] Caption: ${caption.slice(0, 80)}...`);
  console.log(`[ACE] Duration: ${duration}s | BPM: ${bpm} | Instrumental: ${instrumental}`);

  const url = `${supabaseUrl}/functions/v1/generate-loop-ace`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`ACE ${res.status}: ${text.slice(0, 400)}`);
  }

  const data = JSON.parse(text);
  const audioUrl = data?.audioUrl ?? data?.audio_url ?? "";
  if (!audioUrl) throw new Error("ACE: no audio URL returned");

  console.log(`[ACE] ✅ Généré: ${audioUrl.slice(0, 80)}...`);
  return { audioUrl, meta: data?.meta ?? {}, lyrics: data?.lyrics ?? lyrics };
}

async function getAccessToken(supabaseUrl, anonKey, serviceRoleKey) {
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY required for ACE auth");
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const email = `ace-pipeline-${Date.now()}@local.invalid`;

  // Create ephemeral user
  const createRes = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (createRes.error && !createRes.error.message?.includes("already")) {
    throw new Error(`Failed to create user: ${createRes.error.message}`);
  }

  // Generate magic link
  const linkRes = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  const hashedToken = linkRes.data?.properties?.hashed_token;
  if (linkRes.error || !hashedToken) {
    throw new Error(`Failed to generate link: ${linkRes.error?.message}`);
  }

  // Verify to get session
  const supabase = createClient(supabaseUrl, anonKey);
  const verifyRes = await supabase.auth.verifyOtp({
    token_hash: hashedToken,
    type: "magiclink",
  });
  if (verifyRes.error) {
    throw new Error(`Failed to verify: ${verifyRes.error.message}`);
  }

  return verifyRes.data?.session?.access_token;
}
