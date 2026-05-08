import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const lines = readFileSync(".env", "utf8").split("\n");
const env = {};
for (const line of lines) {
  const idx = line.indexOf("=");
  if (idx > 0) env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
}

const supabaseUrl = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
const forcedRegion = process.env.SUPABASE_FUNCTION_REGION || env.SUPABASE_FUNCTION_REGION || env.VITE_SUPABASE_FUNCTION_REGION || "";

if (!supabaseUrl || !anonKey) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, anonKey);

async function getTestAccessToken() {
  if (!serviceRoleKey) return null;

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const email = "ace-step-test@local.invalid";

  const createRes = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (createRes.error && createRes.error.message && !createRes.error.message.includes("already")) {
    console.error("Failed to create test user:", createRes.error.message);
    return null;
  }

  const linkRes = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  const hashedToken = linkRes.data?.properties?.hashed_token;
  if (linkRes.error || !hashedToken) {
    console.error("Failed to generate magic link:", linkRes.error?.message ?? "unknown");
    return null;
  }

  const verifyRes = await supabase.auth.verifyOtp({ token_hash: hashedToken, type: "magiclink" });
  if (verifyRes.error) {
    console.error("Failed to verify magic link:", verifyRes.error.message);
    return null;
  }

  return verifyRes.data?.session?.access_token ?? null;
}

console.log("🎵 Testing ACE-Step engine via Edge Function...");
const start = Date.now();

const accessToken = await getTestAccessToken();
if (!accessToken) {
  console.error("❌ Could not obtain a Supabase user access token for testing.");
  console.error("Set SUPABASE_SERVICE_ROLE_KEY in .env to enable automated test auth.");
  process.exit(1);
}

const payload = {
  caption: "dark trap beat, heavy 808s, melodic lead synth, 140 BPM, F# minor, professional quality, modern rap production 2024",
  bpm: 140,
  keyScale: "F# Minor",
  duration: 10,
  lyrics: "",
  instrumental: true,
};

let data = null;
let error = null;

if (forcedRegion) {
  const url = `${supabaseUrl}/functions/v1/generate-loop-ace?forceFunctionRegion=${encodeURIComponent(forcedRegion)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text().catch(() => "");
  if (!res.ok) {
    error = { message: `Edge Function returned ${res.status}`, body: text, headers: Object.fromEntries(res.headers.entries()) };
  } else {
    data = JSON.parse(text);
  }
} else {
  const result = await supabase.functions.invoke("generate-loop-ace", {
    body: payload,
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  data = result.data;
  error = result.error;
}

const elapsed = ((Date.now() - start) / 1000).toFixed(2);
console.log(`⏱  Time: ${elapsed}s`);

if (error) {
  console.error("❌ Edge Function error:", error);
  if (error?.context && typeof error.context.text === "function") {
    try {
      const text = await error.context.text();
      if (text) console.error("❌ Edge Function response body:", text);
    } catch {
      // ignore
    }
  } else if (typeof error?.body === "string" && error.body) {
    console.error("❌ Edge Function response body:", error.body);
    if (error?.headers?.["x-sb-edge-region"]) console.error("x-sb-edge-region:", error.headers["x-sb-edge-region"]);
  }
} else if (data?.error) {
  console.error("❌ Generation error:", data.error);
} else {
  console.log("✅ Success!");
  const audioUrl = data?.audioUrl;
  if (typeof audioUrl === "string") {
    const head = audioUrl.slice(0, 160);
    console.log("🔊 Audio URL (prefix):", head + (audioUrl.length > head.length ? "..." : ""));
    console.log("🔊 Audio URL length:", audioUrl.length);
  } else {
    console.log("🔊 Audio URL:", audioUrl);
  }
  console.log("🤖 Engine:", data?.engine);
}
