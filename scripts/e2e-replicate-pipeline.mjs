import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

function loadDotEnv(filePath) {
  const out = {};
  const raw = fs.readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    out[k] = v;
  }
  return out;
}

async function main() {
  const root = process.cwd();
  const envPath = path.join(root, ".env");
  const env = fs.existsSync(envPath) ? loadDotEnv(envPath) : {};

  const supabaseUrl = env.VITE_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(JSON.stringify({ ok: false, error: "Missing VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY" }, null, 2));
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const prompt =
    "trapsoul R&B, emotional melodic trap, woozy atmospheric, Bryson Tiller era, soft 808s, 140 BPM, F# Minor scale, melancholic emotional, sad beauty, longing feeling, chopped and pitched vocal samples, stuttered vocal chops, vocal texture, medium reverb, warm spatial feel, OG Parker style, melodic trapsoul, smooth emotional chords, 4 bars loop, high quality melody loop, professional music production, royalty free";

  const duration = 7;

  const email = `e2e-${Date.now()}-${Math.random().toString(16).slice(2)}@example.org`;
  const password = "Test1234!";

  const signupStart = Date.now();
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
  const signupSec = (Date.now() - signupStart) / 1000;

  if (signUpError) {
    console.error(JSON.stringify({ ok: false, step: "signUp", error: signUpError.message }, null, 2));
    process.exit(1);
  }

  const hasSession = !!signUpData.session;
  const userId = signUpData.user?.id ?? null;

  const edgeStart = Date.now();
  const { data: fnData, error: fnError } = await supabase.functions.invoke("generate-loop", {
    body: { prompt, duration },
  });
  const edgeSec = (Date.now() - edgeStart) / 1000;

  if (fnError) {
    console.error(JSON.stringify({ ok: false, step: "edgeInvoke", error: fnError.message }, null, 2));
    process.exit(1);
  }

  const audioUrl = fnData?.audioUrl ?? null;
  if (!audioUrl) {
    console.error(JSON.stringify({ ok: false, step: "edgeInvoke", error: "No audioUrl returned", fnData }, null, 2));
    process.exit(1);
  }

  let insertResult = null;
  let selectResult = null;

  if (hasSession && userId) {
    const loopInsert = {
      user_id: userId,
      name: "Trapsoul Loop — F# Minor · 140 BPM",
      genre: "Trapsoul",
      influence: "OG Parker",
      key: "F#",
      scale: "Minor",
      bpm: 140,
      loop_length: "4 bars",
      mood: "Melancholic",
      vocal_type: "Chopped Vocal",
      reverb: "Medium",
      swing: 0,
      prompt: "",
      audio_url: audioUrl,
      stems_url: null,
      is_saved: false,
    };

    const { data: ins, error: insErr } = await supabase.from("loops").insert(loopInsert).select("*").single();
    insertResult = insErr ? { ok: false, error: insErr.message } : { ok: true, id: ins?.id ?? null, audio_url: ins?.audio_url ?? null };

    const { data: rows, error: selErr } = await supabase
      .from("loops")
      .select("id,audio_url,genre,bpm,key,scale,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);
    selectResult = selErr ? { ok: false, error: selErr.message } : { ok: true, latest: rows?.[0] ?? null };
  }

  const report = {
    ok: true,
    signup: { email, hasSession, userId, elapsedSeconds: Math.round(signupSec * 100) / 100 },
    edge: { audioUrl, elapsedSeconds: Math.round(edgeSec * 100) / 100 },
    db: { insertResult, selectResult },
    note: hasSession ? null : "No session returned on signUp; email confirmation may be enabled, so DB insert could not be verified here.",
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(JSON.stringify({ ok: false, error: message }, null, 2));
  process.exit(1);
});
