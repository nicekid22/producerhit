import { readFileSync } from "fs";

const env = {};
for (const line of readFileSync(".env", "utf8").split("\n")) {
  const i = line.indexOf("=");
  if (i > 0) env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
}

const key = env.VITE_ACE_STEP_API_KEY || env.ACE_STEP_API_KEY;
const base = "https://api.acemusic.ai";

// Minimal valid-ish mp3 header bytes (silent stub) — ACE may reject; goal is HTTP status only.
const stub = new Uint8Array([0xff, 0xfb, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
const blob = new Blob([stub], { type: "audio/mpeg" });
const file = new File([blob], "stub.mp3", { type: "audio/mpeg" });

const form = new FormData();
form.append("model", "acestep-v15-xl-turbo");
form.append("caption", "dark trap remix instrumental cover");
form.append("task_type", "cover");
form.append("src_audio", file, "stub.mp3");
form.append("thinking", "false");
form.append("audio_format", "mp3");

const res = await fetch(`${base}/v1/chat/completions`, {
  method: "POST",
  headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
  body: form,
});
const text = await res.text();
console.log("chat/completions multipart ->", res.status, text.slice(0, 300));

const form2 = new FormData();
form2.append("caption", "dark trap remix");
form2.append("task_type", "cover");
form2.append("src_audio", file, "stub.mp3");
const res2 = await fetch(`${base}/v1/music/generate`, {
  method: "POST",
  headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
  body: form2,
});
const text2 = await res2.text();
console.log("music/generate multipart ->", res2.status, text2.slice(0, 300));
