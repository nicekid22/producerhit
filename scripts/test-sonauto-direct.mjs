import fs from "node:fs";

function loadKey() {
  const raw = fs.readFileSync(".env", "utf8");
  const line = raw.split(/\r?\n/).find((l) => l.startsWith("VITE_SONAUTO_API_KEY="));
  if (!line) return null;
  return line.split("=")[1]?.trim() ?? null;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const apiKey = loadKey();
  if (!apiKey) throw new Error("Missing VITE_SONAUTO_API_KEY");

  const prompt =
    "US industry beat, producer-focused loop, DAW-ready, trapsoul R&B melody loop, emotional minor chords, soft atmospheric pads, subtle 808 bass undertone, 140 BPM, key F# Minor, melancholic, clean mix";
  const tags = ["r&b/soul", "trap", "melodic", "2020s", "melancholic", "instrumental"];

  const createBody = {
    prompt,
    tags,
    instrumental: true,
    output_format: "mp3",
    output_bit_rate: 320,
    bpm: 140,
  };

  const start = Date.now();
  const createRes = await fetch("https://api.sonauto.ai/v1/generations/v2", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(createBody),
  });
  const createJson = await createRes.json().catch(() => null);

  console.log("REQUEST_BODY:", JSON.stringify(createBody));
  console.log("CREATE_STATUS:", createRes.status);
  console.log("CREATE_RESPONSE:", JSON.stringify(createJson));

  if (!createRes.ok) return;
  const taskId = createJson?.task_id;
  if (!taskId) throw new Error("No task_id returned");

  for (let i = 0; i < 120; i++) {
    await sleep(3000);
    const statusRes = await fetch(`https://api.sonauto.ai/v1/generations/status/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const statusJson = await statusRes.json().catch(() => null);
    const status = typeof statusJson === "string" ? statusJson : statusJson?.status;
    console.log("POLL:", i, status);

    if (status === "SUCCESS" || status === "FAILURE") {
      const doneRes = await fetch(`https://api.sonauto.ai/v1/generations/${taskId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const doneJson = await doneRes.json().catch(() => null);
      console.log("FINAL_STATUS:", doneRes.status);
      console.log("FINAL_RESPONSE_HEAD:", JSON.stringify(doneJson).slice(0, 1500));
      const audioUrl = Array.isArray(doneJson?.song_paths) ? doneJson.song_paths[0] : null;
      console.log("AUDIO_URL:", audioUrl);
      console.log("ELAPSED_SECONDS:", ((Date.now() - start) / 1000).toFixed(2));
      break;
    }
  }
}

main().catch((err) => {
  console.error("ERROR:", err?.message ?? String(err));
  process.exit(1);
});

