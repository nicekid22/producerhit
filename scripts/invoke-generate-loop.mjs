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
  const envPath = path.join(process.cwd(), ".env");
  const env = fs.existsSync(envPath) ? loadDotEnv(envPath) : {};
  const url = env.VITE_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");

  const supabase = createClient(url, key);

  const prompt =
    "US industry beat, producer-focused loop, DAW-ready, trapsoul R&B melody loop, emotional minor chords, soft atmospheric pads, subtle 808 bass undertone, 140 BPM, key F# Minor, melancholic, clean mix";

  const duration = 7;
  const tags = ["r&b/soul", "trap", "melodic", "2020s", "melancholic", "instrumental"];
  const bpm = 140;
  const instrumental = true;

  const start = Date.now();
  const { data, error } = await supabase.functions.invoke("generate-loop", {
    body: { prompt, tags, bpm, instrumental, duration },
  });
  const elapsed = (Date.now() - start) / 1000;

  console.log(
    JSON.stringify(
      {
        ok: !error && !!data?.audioUrl,
        elapsedSeconds: Math.round(elapsed * 100) / 100,
        error: error?.message ?? null,
        data,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(JSON.stringify({ ok: false, error: message }, null, 2));
  process.exit(1);
});
