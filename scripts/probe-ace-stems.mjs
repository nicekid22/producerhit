/**
 * Sonde ACE : chat/completions → taskId → query_result (stems ZIP ?)
 * Usage: node scripts/probe-ace-stems.mjs
 */
import { readFileSync, existsSync, writeFileSync } from "fs";

function loadDotEnv() {
  const path = ".env";
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i <= 0) continue;
    const key = trimmed.slice(0, i).trim();
    let val = trimmed.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadDotEnv();

const apiKey = (process.env.ACE_STEP_API_KEY ?? process.env.ACE_STEP_API_KEYS?.split(",")[0] ?? "").trim();
const baseUrl = (process.env.ACE_STEP_BASE_URL || "https://api.acemusic.ai").replace(/\/$/, "");

if (!apiKey) {
  console.error("Missing ACE_STEP_API_KEY in .env");
  process.exit(1);
}

function collectStemCandidates(obj, out = []) {
  if (!obj || typeof obj !== "object") return out;
  if (Array.isArray(obj)) {
    for (const x of obj) collectStemCandidates(x, out);
    return out;
  }
  for (const [k, v] of Object.entries(obj)) {
    const lk = k.toLowerCase();
    if (typeof v === "string" && (lk.includes("stem") || lk.includes("zip") || lk.includes("archive"))) {
      out.push({ key: k, value: v.slice(0, 200) });
    }
    if (v && typeof v === "object") collectStemCandidates(v, out);
  }
  return out;
}

function pickTaskId(json) {
  const root = json && typeof json === "object" ? json : {};
  const sources = [
    root.task_id,
    root.taskId,
    root.id,
    root.data?.task_id,
    root.data?.taskId,
    root.choices?.[0]?.task_id,
    root.choices?.[0]?.message?.task_id,
    root.choices?.[0]?.message?.audio?.[0]?.task_id,
  ];
  for (const s of sources) {
    if (typeof s === "string" && s.trim()) return s.trim();
  }
  return "";
}

async function chatCompletions() {
  const body = {
    model: "ace-step-v1.5",
    thinking: false,
    use_format: true,
    messages: [{ role: "user", content: "dark trap beat, 140 bpm, minimal" }],
    lyrics: "",
    task_type: "text2music",
    audio_config: {
      instrumental: true,
      duration: 30,
      vocal_language: "en",
      format: "mp3",
      audio_format: "mp3",
      shift: 0,
      inference_steps: 27,
    },
    stream: false,
  };
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
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { _raw: text.slice(0, 500) };
  }
  return { status: res.status, json, textLen: text.length };
}

async function queryResult(taskId, maxPolls = 8) {
  for (let i = 0; i < maxPolls; i++) {
    const pollParams = new URLSearchParams();
    pollParams.append("ai_token", apiKey);
    pollParams.append("task_id_list", JSON.stringify([taskId]));
    pollParams.append("app", "studio-web");
    const res = await fetch(`${baseUrl}/query_result`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: pollParams,
    });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = { _raw: text.slice(0, 500) };
    }
    const item = Array.isArray(json?.data) ? json.data[0] : null;
    const statusNum = typeof item?.status === "number" ? item.status : -1;
    console.log(`  poll ${i + 1}: status=${res.status} taskStatus=${statusNum}`);
    if (statusNum === 1) {
      const resultStr = typeof item?.result === "string" ? item.result : "";
      let parsed = null;
      try {
        parsed = resultStr ? JSON.parse(resultStr) : null;
      } catch {
        parsed = { _raw: resultStr.slice(0, 300) };
      }
      return { ok: true, json, parsed, stemCandidates: collectStemCandidates(parsed) };
    }
    if (statusNum === 2) return { ok: false, error: "task failed", json };
    await new Promise((r) => setTimeout(r, 2500));
  }
  return { ok: false, error: "timeout" };
}

async function tryExtract(taskId) {
  const body = {
    model: "ace-step-v1.5",
    messages: [{ role: "user", content: "extract stems" }],
    task_type: "extract",
    task_id: taskId,
    stream: false,
  };
  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { _raw: text.slice(0, 500) };
  }
  return { status: res.status, json, stemCandidates: collectStemCandidates(json) };
}

console.log("ACE stems probe — base:", baseUrl);
console.log("1) chat/completions (instrumental 30s)…");
const chat = await chatCompletions();
console.log("   HTTP", chat.status, "bodyLen", chat.textLen);
const taskId = pickTaskId(chat.json);
const chatStems = collectStemCandidates(chat.json);
console.log("   taskId:", taskId || "(none)");
console.log("   stem-like fields in chat response:", chatStems.length ? chatStems : "(none)");

writeFileSync("scripts/_probe-stems-chat.json", JSON.stringify(chat.json, null, 2));

if (taskId) {
  console.log("2) query_result poll…");
  const poll = await queryResult(taskId);
  console.log("   result:", poll.ok ? "success" : poll.error);
  if (poll.stemCandidates?.length) console.log("   stems in query_result:", poll.stemCandidates);
  else console.log("   stems in query_result: (none)");
  writeFileSync("scripts/_probe-stems-poll.json", JSON.stringify(poll, null, 2));

  console.log("3) task_type=extract via chat/completions…");
  const ext = await tryExtract(taskId);
  console.log("   HTTP", ext.status, "stem fields:", ext.stemCandidates.length ? ext.stemCandidates : "(none)");
  writeFileSync("scripts/_probe-stems-extract.json", JSON.stringify(ext, null, 2));
} else {
  console.log("Skip query_result — no taskId from chat");
}

console.log("Done. See scripts/_probe-stems-*.json");
