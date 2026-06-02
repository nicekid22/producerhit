import { readFileSync } from "fs";

const env = {};
for (const line of readFileSync(".env", "utf8").split("\n")) {
  const i = line.indexOf("=");
  if (i > 0) env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
}

const key = env.VITE_ACE_STEP_API_KEY || env.ACE_STEP_API_KEY;
const base = "https://api.acemusic.ai";

// Short public sample (replace if dead)
const srcUrl =
  "https://www2.cs.uic.edu/~i101/SoundFiles/ImperialMarch60.wav";

const bodies = [
  {
    label: "cover + src_audio_path top",
    body: {
      model: "acestep-v15-xl-turbo",
      messages: [{ role: "user", content: "Transform into dark trap instrumental cover remix" }],
      task_type: "cover",
      src_audio_path: srcUrl,
      thinking: false,
      audio_config: { instrumental: true, format: "mp3", audio_cover_strength: 0.65 },
      stream: false,
    },
  },
  {
    label: "cover in audio_config",
    body: {
      model: "acestep-v15-xl-turbo",
      messages: [{ role: "user", content: "Dark trap cover remix" }],
      task_type: "cover",
      thinking: false,
      audio_config: {
        instrumental: true,
        format: "mp3",
        src_audio_path: srcUrl,
        audio_cover_strength: 0.65,
      },
      stream: false,
    },
  },
];

for (const { label, body } of bodies) {
  const res = await fetch(`${base}/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  console.log(label, "->", res.status, text.slice(0, 400).replace(/\s+/g, " "));
}
