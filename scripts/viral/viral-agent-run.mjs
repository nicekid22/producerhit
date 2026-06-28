/**
 * VIRAL OS — single entrypoint for agents (Hermes terminal / OpenClaw exec).
 * Usage: node scripts/viral/viral-agent-run.mjs <action>
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

function loadDotEnv() {
  if (!existsSync(".env")) return;
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (!(k in process.env)) process.env[k] = v;
  }
}

loadDotEnv();

const ACTION = (process.argv[2] ?? "status").trim().toLowerCase();
const REPO = process.cwd();

function runNpm(script, extraArgs = []) {
  const r = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", script, "--", ...extraArgs], {
    cwd: REPO,
    encoding: "utf8",
    shell: true,
    timeout: 600_000,
  });
  return { ok: r.status === 0, code: r.status ?? 1, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

function runNode(rel, args = []) {
  const r = spawnSync(process.execPath, ["--use-system-ca", join(REPO, rel), ...args], {
    cwd: REPO,
    encoding: "utf8",
    shell: false,
    timeout: 600_000,
  });
  return { ok: r.status === 0, code: r.status ?? 1, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

function statusReport() {
  const checks = {
    supabase: Boolean(process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    social_secret: Boolean(process.env.SOCIAL_PUBLISH_CRON_SECRET),
    youtube_accounts: Boolean(process.env.YOUTUBE_ACCOUNTS),
    youtube_auto: process.env.YOUTUBE_DAILY_AUTO_PUBLISH === "1" || process.env.COMMUNITY_YOUTUBE_AUTO_PUBLISH === "1",
    tiktok_keys: Boolean(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET),
    tiktok_token: Boolean(process.env.TIKTOK_REFRESH_TOKEN),
    gemini: Boolean(process.env.GOOGLE_API_KEY_NEW || process.env.GEMINI_API_KEY),
    pollinations: Boolean(process.env.POLLINATIONS_API_KEY),
    discord: Boolean(process.env.DISCORD_BOT_TOKEN),
  };
  return { action: "status", repo: REPO, checks, ready_pipeline: checks.supabase && checks.social_secret };
}

async function main() {
  if (ACTION === "status") {
    console.log(JSON.stringify(statusReport(), null, 2));
    return;
  }

  if (ACTION === "seed") {
    const viral = runNpm("viral:seed");
    const yt = runNode("scripts/youtube-daily-run.mjs", ["seed"]);
    console.log(JSON.stringify({ action: "seed", viral: viral.ok, youtube: yt.ok }, null, 2));
    if (!viral.ok) console.error(viral.stderr || viral.stdout);
    if (!yt.ok) console.error(yt.stderr || yt.stdout);
    process.exit(viral.ok && yt.ok ? 0 : 1);
  }

  if (ACTION === "generate") {
    const r = runNpm("viral:generate");
    console.log(r.stdout);
    if (r.stderr) console.error(r.stderr);
    process.exit(r.ok ? 0 : 1);
  }

  if (ACTION === "youtube-batch") {
    const r = runNode("scripts/youtube-daily-run.mjs", ["run"]);
    console.log(r.stdout);
    if (r.stderr) console.error(r.stderr);
    process.exit(r.ok ? 0 : 1);
  }

  if (ACTION === "publish") {
    const r = runNode("scripts/social-publish-trigger.mjs");
    console.log(r.stdout);
    if (r.stderr) console.error(r.stderr);
    process.exit(r.ok ? 0 : 1);
  }

  if (ACTION === "pipeline") {
    const steps = [];
    steps.push({ step: "seed", ...runNpm("viral:seed") });
    steps.push({ step: "viral_generate", ...runNpm("viral:generate") });
    steps.push({ step: "youtube_seed", ...runNode("scripts/youtube-daily-run.mjs", ["seed"]) });
    steps.push({ step: "youtube_run", ...runNode("scripts/youtube-daily-run.mjs", ["run"]) });
    if (process.env.SOCIAL_PUBLISH_CRON_SECRET) {
      steps.push({ step: "publish_queue", ...runNode("scripts/social-publish-trigger.mjs") });
    }
    const summary = steps.map((s) => ({ step: s.step, ok: s.ok, code: s.code }));
    console.log(JSON.stringify({ action: "pipeline", summary }, null, 2));
    process.exit(summary.every((s) => s.ok) ? 0 : 1);
  }

  if (ACTION === "hooks-draft") {
    const dir = join(REPO, "scripts", "viral", "output");
    mkdirSync(dir, { recursive: true });
    const day = new Date().toISOString().slice(0, 10);
    const hooks = [
      "This beat took 12 seconds on ProducerHit — link in bio",
      "POV: AI just made your next type beat",
      "Before: blank canvas / After: full song with vocals",
      "Stop scrolling — 30 sec to your own Drake-style beat",
      "Lyrics on screen because the AI actually sang them",
      "AI made this beat? No way.",
      "My secret weapon for endless beats",
      "Produce pro tracks, no studio needed",
      "Hear the future of music production",
      "Instant bangers with just a prompt",
    ];
    const path = join(dir, `hooks-${day}.md`);
    const captions = [
      "Ready to make your own hits? 🎶 ProducerHit makes it easy to create pro-level beats with AI. Try it free now! https://www.producerhit.com",
      "Stop dreaming, start producing. 🚀 Our AI music generator helps you craft unique tracks in minutes. Get started today! https://www.producerhit.com",
      "Unlock your inner producer with ProducerHit! ✨ From concept to full track, our AI handles the heavy lifting. Link in bio! https://www.producerhit.com",
      "Tired of writer's block? Let AI inspire your next masterpiece. 🔥 Discover endless possibilities at ProducerHit.com https://www.producerhit.com",
      "Level up your music game. 📈 Whether you're a beginner or a pro, ProducerHit helps you create amazing music, faster. https://www.producerhit.com",
    ];
    const hashtags = [
      "#ProducerHit #AIMusic #Beatmaking #MusicProduction #AIbeats",
      "#ViralBeats #MusicTech #NewMusic #ArtistToolkit #ProducerLife",
      "#GenerativeMusic #StudioFlow #Hitmaker #Musician #AIProducer",
    ];
    const body = `# Viral hooks ${day}\n\n${hooks.map((h, i) => `${i + 1}. ${h}\n   → https://www.producerhit.com\n`).join("\n")}\n\n## Captions\n\n${captions.map((c, i) => `${i + 1}. ${c}\n`).join("\n")}\n## Hashtags\n\n${hashtags.map((t, i) => `${i + 1}. ${t}\n`).join("\n")}\n`;
    writeFileSync(path, body, "utf8");
    console.log(JSON.stringify({ action: "hooks-draft", path, count: hooks.length }, null, 2));
    return;
  }

  console.error(`Unknown action: ${ACTION}. Use: status | seed | generate | youtube-batch | publish | pipeline | hooks-draft`);
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
