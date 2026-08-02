/**
 * Sonde exhaustif — détecte quelles fonctionnalités ACE-Step (Gradio 51 args équivalents)
 * sont acceptées par l'API distante REST (api.acemusic.ai).
 *
 * Stratégie : 1 prompt dark trap instrumental 16s batch_size=2 (gratuit quand accepté).
 * Pour chaque feature : on étend le body baseline, on POST /v1/chat/completions, on capture
 * (status, latency, audioCount, returnedFields, error message).
 * Succès = 200 + au moins 1 audio dans choices[0].message.audio.
 * Échec = 400/422 → on extrait le message ACE qui révèle souvent les champs inconnus.
 *
 * Output : scripts/ace-features-probe-results.jsonl (1 ligne par test) +
 *          scripts/ace-features-probe-report.md (table synthétique) générés en fin.
 *
 * Usage :
 *   node scripts/probe-ace-features.mjs              # tout (≈20 générations)
 *   node scripts/probe-ace-features.mjs --quick      # 5 tests essentiels
 *   node scripts/probe-ace-features.mjs --dry        # dry-run (pas de fetch, log les bodies)
 *   node scripts/probe-ace-features.mjs --endpoint music  # teste aussi /v1/music/generate (cover/repaint)
 *   node scripts/probe-ace-features.mjs --endpoint release # teste aussi /release_task enrichi
 */
import { readFileSync, existsSync, writeFileSync, appendFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// ── .env loader (identique à probe-ace-stems.mjs) ─────────────────────────────
function loadDotEnv() {
  const candidates = [".env", ".env.local"];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
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
}
loadDotEnv();

const apiKey = (
  process.env.ACE_STEP_API_KEY ||
  (process.env.ACE_STEP_API_KEYS?.split(",")[0] || "") ||
  process.env.VITE_ACE_STEP_API_KEY ||
  ""
).trim();
const baseUrl = (
  process.env.ACE_STEP_BASE_URL ||
  process.env.VITE_ACE_STEP_BASE_URL ||
  "https://api.acemusic.ai"
).replace(/\/$/, "");

if (!apiKey) {
  console.error("Missing ACE_STEP_API_KEY (ou ACE_STEP_API_KEYS / VITE_ACE_STEP_API_KEY) dans .env");
  process.exit(1);
}

// ── Args parsing ─────────────────────────────────────────────────────────────
const args = new Set(process.argv.slice(2));
const QUICK = args.has("--quick");
const DRY = args.has("--dry");
const TEST_MUSIC = args.has("--endpoint") && process.argv[process.argv.indexOf("--endpoint") + 1] === "music";
const TEST_RELEASE = args.has("--endpoint") && process.argv[process.argv.indexOf("--endpoint") + 1] === "release";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RESULTS_JSONL = join(__dirname, "ace-features-probe-results.jsonl");
const REPORT_MD = join(__dirname, "ace-features-probe-report.md");

// Reset JSONL pour ce run (chaque run écrase le précédent ; on append dans le run)
writeFileSync(RESULTS_JSONL, "");

// ── Baseline body ─────────────────────────────────────────────────────────────
const SEEDS = [42_001, 42_001 + 12_345];
const PROMPT =
  "Create a short modern 2026 dark trap instrumental beat. No vocals. Mood: dark and punchy. BPM around 140.";
const BASE_BODY = {
  model: "acestep-v15-xl-turbo",
  thinking: true,
  use_format: false,
  messages: [{ role: "user", content: PROMPT }],
  lyrics: "[instrumental]",
  task_type: "text2music",
  batch_size: 2,
  audio_config: {
    instrumental: true,
    duration: 16, // réduit de 24 → 16 pour économiser
    format: "mp3",
    audio_format: "mp3",
    vocal_language: "en",
    shift: 3,
    inference_steps: 8,
    seed: SEEDS[0],
    seeds: SEEDS,
  },
  stream: false,
};

// ── Test suite ────────────────────────────────────────────────────────────────
// Chaque test = overrides à merger dans BASE_BODY. Soit au root, soit dans audio_config.
const TESTS = [
  { id: "00-baseline", label: "Baseline (control)", merge: {} },
  {
    id: "01-guidance-scale",
    label: "audio_config.guidance_scale = 7.0",
    merge: { audio_config: { guidance_scale: 7.0 } },
  },
  {
    id: "02-inference-steps-16",
    label: "audio_config.inference_steps = 16",
    merge: { audio_config: { inference_steps: 16 } },
  },
  {
    id: "03-infer-method-sde",
    label: "audio_config.infer_method = 'sde'",
    merge: { audio_config: { infer_method: "sde" } },
  },
  {
    id: "04-infer-method-ode",
    label: "audio_config.infer_method = 'ode' (explicit)",
    merge: { audio_config: { infer_method: "ode" } },
  },
  {
    id: "05-normalization",
    label: "audio_config.normalization_db + enable_normalization (v1.5)",
    merge: {
      audio_config: { normalization_db: -14.0, enable_normalization: true },
    },
  },
  {
    id: "06-latent-rescale",
    label: "audio_config.latent_rescale = 0.92 (v1.5)",
    merge: { audio_config: { latent_rescale: 0.92 } },
  },
  {
    id: "07-latent-shift",
    label: "audio_config.latent_shift = 0.5 (v1.5)",
    merge: { audio_config: { latent_shift: 0.5 } },
  },
  {
    id: "08-lm-params",
    label: "audio_config.lm_temperature/top_k/top_p",
    merge: { audio_config: { lm_temperature: 0.9, lm_top_k: 50, lm_top_p: 0.95 } },
  },
  {
    id: "09-cfg-interval",
    label: "audio_config.cfg_interval_start/end",
    merge: { audio_config: { cfg_interval_start: 0.0, cfg_interval_end: 0.7 } },
  },
  {
    id: "10-custom-timesteps",
    label: "audio_config.custom_timesteps = '0,0.5,0.8,1.0'",
    merge: { audio_config: { custom_timesteps: "0,0.5,0.8,1.0" } },
  },
  { id: "11-auto-lrc", label: "auto_lrc = true (top-level)", merge: { auto_lrc: true } },
  {
    id: "12-auto-score",
    label: "auto_score = true + score_scale = 0.5 (top-level)",
    merge: { auto_score: true, score_scale: 0.5 },
  },
  {
    id: "13-cot-features",
    label: "use_cot_metas/caption/language = true (top-level)",
    merge: { use_cot_metas: true, use_cot_caption: true, use_cot_language: true },
  },
  {
    id: "14-parallel-thinking",
    label: "parallel_thinking = true + lm_batch_chunk_size = 8",
    merge: { parallel_thinking: true, lm_batch_chunk_size: 8 },
  },
  {
    id: "15-track-name",
    label: "track_name + complete_track_classes (top-level)",
    merge: { track_name: "probe-test", complete_track_classes: ["trap"] },
  },
  {
    id: "16-use-adg",
    label: "audio_config.use_adg = true",
    merge: { audio_config: { use_adg: true } },
  },
  {
    id: "17-audio-codes",
    label: "audio_config.audio_codes = 'hint:test'",
    merge: { audio_config: { audio_codes: "hint:test" } },
  },
];

// Tests écartés (504 Cloudflare documentés — backend ACE trop lent en REST sur ces features) :
// - "03-infer-method-sde" : SDE intrinsèquement > 60s, dépasse le gateway
// - "05-normalization"    : normalization_db déclenche une passe> 60s, dépasse le gateway
const SKIP_IDS = new Set(["03-infer-method-sde", "05-normalization"]);
const SELECTED = (
  QUICK
    ? ["00-baseline", "01-guidance-scale", "03-infer-method-sde", "05-normalization", "11-auto-lrc"]
    : TESTS.map((t) => t.id)
).filter((id) => !SKIP_IDS.has(id));

// ── Helpers ──────────────────────────────────────────────────────────────────
function deepMerge(base, override) {
  if (override == null) return base;
  if (Array.isArray(base) || typeof base !== "object" || base === null) return override;
  if (typeof override !== "object" || override === null) return override;
  const out = { ...base };
  for (const [k, v] of Object.entries(override)) {
    out[k] = k in out ? deepMerge(out[k], v) : v;
  }
  return out;
}

function pickAudioInfo(json) {
  const msg = json?.choices?.[0]?.message;
  const audio = Array.isArray(msg?.audio) ? msg.audio : [];
  const first = audio[0];
  const url =
    typeof first?.audio_url === "object" && first.audio_url?.url
      ? String(first.audio_url.url)
      : typeof first?.url === "string"
        ? first.url
        : "";
  const isDataUrl = url.startsWith("data:");
  // champs "extras" renvoyés dans le message (debug)
  const returnedFields = msg ? Object.keys(msg).filter((k) => !["role", "content", "audio"].includes(k)) : [];
  const contentPreview = typeof msg?.content === "string" ? msg.content.slice(0, 200) : "";
  return {
    audioCount: audio.length,
    hasUrl: isDataUrl ? true : url.startsWith("http"),
    urlKind: url.startsWith("data:") ? "data" : url.startsWith("http") ? "http" : url ? "unknown" : "none",
    returnedFields,
    contentPreview,
  };
}

function extractError(text) {
  try {
    const j = JSON.parse(text);
    return (
      j?.error ||
      j?.message ||
      j?.detail ||
      (Array.isArray(j?.errors) ? j.errors.map((e) => e?.msg || e?.message || JSON.stringify(e)).join("; ") : "") ||
      text.slice(0, 300)
    );
  } catch {
    return text.slice(0, 300);
  }
}

async function probeChat(test) {
  const body = deepMerge(BASE_BODY, test.merge);
  const payload = JSON.stringify(body);
  if (DRY) {
    return {
      id: test.id,
      label: test.label,
      endpoint: "/v1/chat/completions",
      dryRun: true,
      bodyPreview: payload.slice(0, 400),
    };
  }
  const started = Date.now();
  const controller = new AbortController();
  const timeout = Number(process.env.PROBE_TIMEOUT_MS || 90_000);
  const timer = setTimeout(() => controller.abort(), timeout);
  let res;
  try {
    res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: payload,
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    return {
      id: test.id,
      label: test.label,
      endpoint: "/v1/chat/completions",
      status: String(e?.name || "").includes("Abort") ? "timeout" : "network-error",
      error: String(e?.message || e),
      ms: Date.now() - started,
    };
  }
  clearTimeout(timer);
  const text = await res.text().catch(() => "");
  const ms = Date.now() - started;
  const record = {
    id: test.id,
    label: test.label,
    endpoint: "/v1/chat/completions",
    status: res.status,
    ok: res.ok,
    ms,
  };
  if (!res.ok) {
    record.error = extractError(text);
    return record;
  }
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    record.error = "non-JSON response";
    record.preview = text.slice(0, 200);
    return record;
  }
  const info = pickAudioInfo(json);
  Object.assign(record, info);
  record.accepted = info.audioCount >= 1;
  return record;
}

// ── Tests /v1/music/generate (multipart) — cover + repaint ───────────────────
// On a besoin d'un source audio. On génère d'abord un petit instrumental via
// chat/completions baseline puis on le réutilise. En --dry on saute.
let SOURCE_AUDIO = null;

async function prepareSourceAudio() {
  if (DRY) return null;
  if (SOURCE_AUDIO) return SOURCE_AUDIO;
  console.log("\n→ Préparation source audio (1 gén baseline pour tests cover/repaint)…");
  const record = await probeChat(TESTS[0]);
  if (!record.accepted) {
    console.warn("  Baseline échoué — impossible de préparer un source audio. Skip tests music/generate.");
    return null;
  }
  // On n'a pas l'URL http finale facilement (souvent data: ou URL ACE protégée).
  // On retente avec un retry récuperant le raw body pour le blob.
  try {
    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(BASE_BODY),
    });
    const json = await res.json();
    const msg = json?.choices?.[0]?.message;
    const a = Array.isArray(msg?.audio) ? msg.audio[0] : null;
    const url =
      typeof a?.audio_url === "object" && a.audio_url?.url ? a.audio_url.url : typeof a?.url === "string" ? a.url : "";
    if (url.startsWith("http")) {
      const buf = await (await fetch(url)).arrayBuffer();
      SOURCE_AUDIO = new Uint8Array(buf);
      console.log(`  Source OK (${SOURCE_AUDIO.length} bytes)`);
    } else {
      console.warn("  URL non-http, tests cover/repaint skippés.");
    }
  } catch (e) {
    console.warn("  Préparation source échouée:", e?.message || e);
  }
  return SOURCE_AUDIO;
}

async function probeMusicGenerate(test) {
  if (DRY) {
    return { id: test.id, label: test.label, endpoint: "/v1/music/generate", dryRun: true };
  }
  const src = await prepareSourceAudio();
  if (!src) {
    return { id: test.id, label: test.label, endpoint: "/v1/music/generate", status: "skipped", reason: "no-source" };
  }
  const form = new FormData();
  form.append("caption", PROMPT);
  form.append("prompt", PROMPT);
  form.append("lyrics", "[Instrumental]");
  form.append("task_type", test.taskType || "cover");
  form.append(
    "src_audio",
    new Blob([src], { type: "audio/mpeg" }),
    "source.mp3",
  );
  form.append("vocal_language", "en");
  form.append("audio_format", "mp3");
  form.append("thinking", "false");
  form.append("model", "acestep-v15-xl-turbo");
  form.append("audio_cover_strength", String(test.coverStrength ?? 0.65));
  if (test.coverNoiseStrength != null) form.append("cover_noise_strength", String(test.coverNoiseStrength));
  if (test.repaintingStart != null) form.append("repainting_start", String(test.repaintingStart));
  if (test.repaintingEnd != null) form.append("repainting_end", String(test.repaintingEnd));
  if (test.instruction) form.append("instruction", test.instruction);

  const started = Date.now();
  let res;
  try {
    res = await fetch(`${baseUrl}/v1/music/generate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      body: form,
    });
  } catch (e) {
    return {
      id: test.id,
      label: test.label,
      endpoint: "/v1/music/generate",
      status: "network-error",
      error: String(e?.message || e),
      ms: Date.now() - started,
    };
  }
  const text = await res.text().catch(() => "");
  const ms = Date.now() - started;
  const record = {
    id: test.id,
    label: test.label,
    endpoint: "/v1/music/generate",
    status: res.status,
    ok: res.ok,
    ms,
  };
  if (!res.ok) {
    record.error = extractError(text);
    return record;
  }
  // music/generate renvoie job_id → il faut poller. Pour le probe on vérifie juste le 200 + job_id.
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    record.error = "non-JSON response";
    return record;
  }
  const jobId =
    json?.job_id ||
    json?.data?.job_id ||
    json?.id ||
    "";
  record.jobId = jobId;
  record.accepted = !!jobId;
  return record;
}

const MUSIC_TESTS = [
  {
    id: "M1-cover-basic",
    label: "music/generate cover, audio_cover_strength=0.65",
    taskType: "cover",
    coverStrength: 0.65,
  },
  {
    id: "M2-cover-noise",
    label: "music/generate cover + cover_noise_strength=0.1",
    taskType: "cover",
    coverStrength: 0.65,
    coverNoiseStrength: 0.1,
  },
  {
    id: "M3-repaint",
    label: "music/generate repaint + repainting_start/end + instruction",
    taskType: "repaint",
    repaintingStart: 0.25,
    repaintingEnd: 0.75,
    instruction: "Fill with dark trap style described in caption.",
  },
];

// ── Tests /release_task enrichi ──────────────────────────────────────────────
async function probeReleaseTask(test) {
  if (DRY) {
    return { id: test.id, label: test.label, endpoint: "/release_task", dryRun: true };
  }
  const paramObj = {
    duration: 16,
    audio_format: "mp3",
    shift: 3,
    inference_steps: 8,
    ...test.paramOverrides,
  };
  const form = new FormData();
  form.append("env", "production");
  form.append("ai_token", apiKey);
  form.append("prompt", PROMPT);
  form.append("lyrics", "[Instrumental]");
  form.append("model_name", "acestep-v15-xl-turbo");
  form.append("app", "studio-web");
  form.append("thinking", "true");
  form.append("use_format", "false");
  form.append("vocal_language", "en");
  form.append("param_obj", JSON.stringify(paramObj));

  const started = Date.now();
  let res;
  try {
    res = await fetch(`${baseUrl}/release_task`, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: form,
    });
  } catch (e) {
    return {
      id: test.id,
      label: test.label,
      endpoint: "/release_task",
      status: "network-error",
      error: String(e?.message || e),
      ms: Date.now() - started,
    };
  }
  const text = await res.text().catch(() => "");
  const ms = Date.now() - started;
  const record = {
    id: test.id,
    label: test.label,
    endpoint: "/release_task",
    status: res.status,
    ok: res.ok,
    ms,
  };
  if (!res.ok) {
    record.error = extractError(text);
    // 404 = endpoint absent (déjà observé sur api.acemusic.ai), on le note
    if (res.status === 404) record.endpointMissing = true;
    return record;
  }
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    record.error = "non-JSON";
    return record;
  }
  const taskId = json?.data?.task_id || json?.task_id || "";
  record.taskId = taskId;
  record.accepted = !!taskId;
  return record;
}

const RELEASE_TESTS = [
  { id: "R1-baseline", label: "release_task baseline", paramOverrides: {} },
  {
    id: "R2-enriched",
    label: "release_task + guidance/inference/infer_method/normalization/lrc",
    paramOverrides: {
      guidance_scale: 7.0,
      inference_steps: 16,
      infer_method: "sde",
      normalization_db: -14.0,
      enable_normalization: true,
      auto_lrc: true,
    },
  },
];

// ── Run loop ─────────────────────────────────────────────────────────────────
function appendResult(rec) {
  appendFileSync(RESULTS_JSONL, JSON.stringify(rec) + "\n");
}

async function main() {
  console.log(`\n🛰  Probe ACE features — ${baseUrl}`);
  console.log(`    apiKey=${apiKey.slice(0, 6)}…${apiKey.slice(-4)}`);
  console.log(`    mode: ${DRY ? "DRY (no fetch)" : "LIVE"} • tests: ${SELECTED.length}${QUICK ? " (quick)" : ""}${TEST_MUSIC ? " + music" : ""}${TEST_RELEASE ? " + release" : ""}`);
  console.log("");

  const results = [];
  for (const id of SELECTED) {
    const test = TESTS.find((t) => t.id === id);
    if (!test) continue;
    const label = test.label || test.id;
    process.stdout.write(`  • ${test.id.padEnd(28)} `);
    const rec = await probeChat(test);
    appendResult({ ts: new Date().toISOString(), ...rec });
    results.push(rec);
    if (DRY) console.log("(dry)");
    else if (rec.accepted) console.log(`✓ ${rec.status} ${rec.ms}ms  audio=${rec.audioCount}`);
    else if (rec.ok) console.log(`? ${rec.status} ${rec.ms}ms  no-audio  fields=[${rec.returnedFields?.join(",") || "-"}]`);
    else console.log(`✗ ${rec.status} ${rec.ms}ms  ${String(rec.error || "").slice(0, 80)}`);
  }

  if (TEST_MUSIC) {
    console.log("\n→ Tests /v1/music/generate (cover + repaint)…");
    for (const test of MUSIC_TESTS) {
      process.stdout.write(`  • ${test.id.padEnd(28)} `);
      const rec = await probeMusicGenerate(test);
      appendResult({ ts: new Date().toISOString(), ...rec });
      results.push(rec);
      if (DRY) console.log("(dry)");
      else if (rec.accepted) console.log(`✓ ${rec.status} ${rec.ms}ms  job=${rec.jobId?.slice(0, 12)}…`);
      else if (rec.status === "skipped") console.log(`— skipped (${rec.reason})`);
      else console.log(`✗ ${rec.status} ${rec.ms}ms  ${String(rec.error || "").slice(0, 80)}`);
    }
  }

  if (TEST_RELEASE) {
    console.log("\n→ Tests /release_task (param_obj enrichi)…");
    for (const test of RELEASE_TESTS) {
      process.stdout.write(`  • ${test.id.padEnd(28)} `);
      const rec = await probeReleaseTask(test);
      appendResult({ ts: new Date().toISOString(), ...rec });
      results.push(rec);
      if (DRY) console.log("(dry)");
      else if (rec.accepted) console.log(`✓ ${rec.status} ${rec.ms}ms  task=${rec.taskId?.slice(0, 12)}…`);
      else if (rec.endpointMissing) console.log(`— 404 (endpoint absent)`);
      else console.log(`✗ ${rec.status} ${rec.ms}ms  ${String(rec.error || "").slice(0, 80)}`);
    }
  }

  // ── Generate report markdown ───────────────────────────────────────────────
  const lines = [];
  lines.push(`# ACE features probe — ${new Date().toISOString()}`);
  lines.push("");
  lines.push(`Endpoint de base: \`${baseUrl}\`  •  Modèle: \`${BASE_BODY.model}\`  •  Prompt: dark trap instrumental 16s`);
  lines.push(`Total tests: ${results.length}${DRY ? " (DRY RUN — aucun appel réseau)" : ""}`);
  lines.push("");
  lines.push("| # | Test | Endpoint | Status | Accepté | Latence | Détail |");
  lines.push("|---|------|----------|--------|---------|---------|--------|");
  for (const r of results) {
    const accepted =
      r.dryRun ? "—" : r.accepted ? "✅" : r.ok ? "⚠️ 200 no-audio" : r.endpointMissing ? "∉ endpoint" : "❌";
    const detail = r.error
      ? `\`${String(r.error).slice(0, 80).replace(/\|/g, "\\|")}\``
      : r.accepted
        ? `audio=${r.audioCount} fields=[${r.returnedFields?.join(",") || "-"}]`
        : r.returnedFields
          ? `fields=[${r.returnedFields.join(",") || "-"}]`
          : "";
    lines.push(
      `| ${r.id} | ${r.label} | \`${r.endpoint}\` | ${r.status ?? "dry"} | ${accepted} | ${r.ms ?? "—"}ms | ${detail} |`,
    );
  }
  lines.push("");
  lines.push("## Lecture du rapport");
  lines.push("- **✅** : serveur atteint, audio renvoyé → feature acceptée et exploitable");
  lines.push("- **⚠️ 200 no-audio** : serveur 200 mais aucune audio dans `message.audio` → feature probablement ignorée");
  lines.push("- **❌** : 400/422 → message d'erreur souvent explicite sur les champs rejetés");
  lines.push("- **∉ endpoint** : 404 → l'endpoint distant n'expose pas cette route (e.g. release_task)");
  lines.push("");
  lines.push("Voir aussi `ace-features-probe-results.jsonl` (1 ligne brute par test).");

  writeFileSync(REPORT_MD, lines.join("\n"));
  console.log(`\n📄 Rapport → ${REPORT_MD}`);
  console.log(`📊 JSONL    → ${RESULTS_JSONL}`);

  // Résumé synthétique sur stdout
  const yes = results.filter((r) => r.accepted).length;
  const no = results.filter((r) => !r.accepted && !r.dryRun && !r.ok).length;
  const noir = results.filter((r) => r.ok && !r.accepted && !r.dryRun).length;
  console.log(`\nRésumé : ${yes} acceptés • ${noir} 200-mais-pas-audio • ${no} rejetés.`);
}

main().catch((e) => {
  console.error("\nFatal:", e);
  process.exit(1);
});
