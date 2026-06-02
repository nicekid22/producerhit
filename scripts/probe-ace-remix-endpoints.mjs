import { readFileSync } from "fs";

const env = {};
for (const line of readFileSync(".env", "utf8").split("\n")) {
  const i = line.indexOf("=");
  if (i > 0) env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
}

const key = env.VITE_ACE_STEP_API_KEY || env.ACE_STEP_API_KEY;
const bases = [
  (env.VITE_ACE_STEP_BASE_URL || env.ACE_STEP_BASE_URL || "https://api.acemusic.ai").replace(/\/$/, ""),
  "https://api.acemusic.ai",
  "https://acem-api.acemusic.ai",
];

if (!key) {
  console.error("No ACE key in .env");
  process.exit(1);
}

async function probe(base, path, init) {
  const url = `${base}${path}`;
  try {
    const res = await fetch(url, init);
    const text = await res.text();
    console.log(base, path, "->", res.status, text.slice(0, 120).replace(/\s+/g, " "));
  } catch (e) {
    console.log(base, path, "-> ERROR", e.message);
  }
}

for (const base of [...new Set(bases)]) {
  await probe(base, "/release_task", {
    method: "POST",
    headers: { Accept: "application/json" },
    body: new URLSearchParams({ ai_token: key, prompt: "test" }),
  });
  await probe(base, "/v1/music/generate", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ caption: "test dark trap remix", task_type: "cover", thinking: false }),
  });
  await probe(base, "/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "acestep-v15-xl-turbo",
      messages: [{ role: "user", content: "dark trap cover remix instrumental" }],
      task_type: "cover",
      thinking: false,
      audio_config: { instrumental: true, format: "mp3" },
      stream: false,
    }),
  });
}
