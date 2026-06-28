/**
 * Rapport d'état — YouTube cron, queue social, agents locaux.
 * Envoie un résumé Discord + sauvegarde markdown dans reports/automation/.
 *
 * Usage:
 *   npm run automation:report
 *   npm run automation:report -- --discord   # force Discord même si webhook absent en test
 *
 * Env:
 *   AUTOMATION_REPORT_WEBHOOK ou OPENCLAW_REPORT_WEBHOOK (Discord)
 *   VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { homedir } from "node:os";
import { join } from "node:path";

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

const SUPABASE_URL = (process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "").trim();
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
const WEBHOOK =
  (process.env.AUTOMATION_REPORT_WEBHOOK ?? process.env.OPENCLAW_REPORT_WEBHOOK ?? "").trim();
const FORCE_DISCORD = process.argv.includes("--discord");

import { createConnection } from "node:net";

function portOk(port) {
  return new Promise((resolve) => {
    const s = createConnection({ host: "127.0.0.1", port, timeout: 2000 });
    s.on("connect", () => {
      s.destroy();
      resolve(true);
    });
    s.on("error", () => resolve(false));
    s.on("timeout", () => {
      s.destroy();
      resolve(false);
    });
  });
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function cronErrors(jobsPath, label) {
  const data = readJson(jobsPath);
  if (!data?.jobs) return [];
  const out = [];
  for (const j of data.jobs) {
    if (j.enabled === false) continue;
    const st = j.state ?? {};
    const err = st.lastError ?? st.last_error ?? (typeof st === "string" ? st : "");
    if (err && err !== "scheduled" && err !== "—") {
      out.push(`${label}/${j.name ?? j.id}: ${String(err).slice(0, 120)}`);
    }
  }
  return out;
}

function latestMdInTree(baseDir) {
  if (!existsSync(baseDir)) return null;
  let best = null;
  const walk = (dir) => {
    for (const ent of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, ent.name);
      if (ent.isDirectory()) walk(full);
      else if (ent.name.endsWith(".md")) {
        const m = statSync(full).mtimeMs;
        if (!best || m > best.m) best = { name: ent.name, m };
      }
    }
  };
  walk(baseDir);
  return best?.name ?? null;
}

async function supabaseStats(db) {
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  const [{ data: ytLog }, { data: queue }, { data: plans }, { count: plannedCount }] = await Promise.all([
    db.from("social_publish_log").select("status,error,created_at").eq("platform", "youtube").gte("created_at", since),
    db.from("social_publish_queue").select("status,attempts,last_error,updated_at").neq("status", "done"),
    db
      .from("youtube_daily_plans")
      .select("status")
      .in("status", ["planned", "rendering", "rendered", "failed", "published", "skipped"])
      .gte("day", new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)),
    db.from("youtube_daily_plans").select("*", { count: "exact", head: true }).eq("status", "planned"),
  ]);

  const yt24 = { posted: 0, failed: 0, skipped: 0, errors: [] };
  for (const row of ytLog ?? []) {
    if (row.status === "posted") yt24.posted += 1;
    else if (row.status === "failed") {
      yt24.failed += 1;
      if (row.error) yt24.errors.push(row.error);
    } else if (row.status === "skipped") yt24.skipped += 1;
  }

  const planStats = {};
  for (const p of plans ?? []) {
    planStats[p.status] = (planStats[p.status] ?? 0) + 1;
  }

  return {
    yt24,
    queue: queue ?? [],
    planStats,
    plannedBacklog: plannedCount ?? 0,
  };
}

async function buildReport() {
  const now = new Date();
  const lines = [];
  lines.push(`# Rapport automation ProducerHit`);
  lines.push(`Généré : ${now.toISOString()} (${now.toLocaleString("fr-FR", { timeZone: "Europe/Paris" })})`);
  lines.push("");

  // Services locaux
  const services = [
    ["Ollama", 11434],
    ["OpenClaw", 18789],
    ["Odysseus", 7000],
  ];
  lines.push("## Services locaux (PC)");
  for (const [name, port] of services) {
    const ok = await portOk(port);
    lines.push(`- ${name} (:${port}) : **${ok ? "OK" : "DOWN"}**`);
  }

  const statusPy = spawnSync("python", ["scripts/status-all-agents.py"], {
    encoding: "utf8",
    cwd: process.cwd(),
    timeout: 30000,
  });
  if (statusPy.stdout) {
    const ocErr = cronErrors(join(homedir(), ".openclaw/cron/jobs.json"), "OpenClaw");
    const hermesErr = cronErrors(
      join(process.env.LOCALAPPDATA ?? "", "hermes/cron/jobs.json"),
      "Hermes",
    );
    lines.push("");
    lines.push("## Crons agents — erreurs récentes");
    if (!ocErr.length && !hermesErr.length) lines.push("- Aucune erreur enregistrée dans jobs.json");
    else [...ocErr, ...hermesErr].slice(0, 12).forEach((e) => lines.push(`- ${e}`));
  }

  // Supabase
  if (SUPABASE_URL && SERVICE_KEY) {
    const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
    const stats = await supabaseStats(db);
    lines.push("");
    lines.push("## YouTube (24 h)");
    lines.push(`- Publiés : **${stats.yt24.posted}** | Échecs : **${stats.yt24.failed}** | Skipped : **${stats.yt24.skipped}**`);
    if (stats.yt24.errors.length) {
      lines.push(`- Dernières erreurs : ${[...new Set(stats.yt24.errors)].slice(0, 5).join(", ")}`);
    }

    lines.push("");
    lines.push("## Queue social_publish");
    if (!stats.queue.length) lines.push("- Vide (tout publié)");
    else {
      for (const q of stats.queue.slice(0, 5)) {
        lines.push(`- \`${q.status}\` attempts=${q.attempts} — ${(q.last_error ?? "").slice(0, 80)}`);
      }
    }

    lines.push("");
    lines.push("## Plans YouTube (7 jours)");
    lines.push(`- Backlog **planned** : **${stats.plannedBacklog}** slots`);
    for (const [st, n] of Object.entries(stats.planStats).sort()) {
      lines.push(`- ${st} : ${n}`);
    }
  } else {
    lines.push("");
    lines.push("⚠ Supabase non configuré — stats cloud ignorées.");
  }

  lines.push("");
  lines.push("## GitHub Actions (cloud)");
  lines.push("- `social-publish-cron` : */15 min (queue + prerender)");
  lines.push("- `youtube-daily-cron` : toutes les 2 h UTC (catch-up render+publish)");
  lines.push("- Vérifier : GitHub → Actions si échecs récurrents");

  // Rapports agents CEO
  const ocDaily = join(homedir(), ".openclaw/workspace-producerhit/reports/daily");
  const hmDaily = join(process.env.LOCALAPPDATA ?? "", "hermes/projects/producerhit/reports/daily");
  lines.push("");
  lines.push("## Derniers rapports agents");
  for (const [label, dir] of [
    ["OpenClaw PH", ocDaily],
    ["Hermes PH", hmDaily],
  ]) {
    const latest = latestMdInTree(dir);
    lines.push(`- ${label} : ${latest ?? (existsSync(dir) ? "aucun .md" : "dossier absent")}`);
  }

  lines.push("");
  lines.push("---");
  lines.push("_Rapport auto — `npm run automation:report`_");

  return lines.join("\n");
}

async function postDiscord(text) {
  if (!WEBHOOK) {
    console.warn("Pas de webhook (AUTOMATION_REPORT_WEBHOOK / OPENCLAW_REPORT_WEBHOOK) — Discord ignoré.");
    return false;
  }
  const content = text.length > 1900 ? `${text.slice(0, 1900)}\n\n… _(tronqué — voir reports/automation/)_` : text;
  const res = await fetch(WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "ProducerHit Ops",
      content: `**Rapport automation**\n\`\`\`markdown\n${content}\n\`\`\``,
    }),
  });
  if (!res.ok) {
    console.error("Discord webhook HTTP", res.status, await res.text());
    return false;
  }
  return true;
}

async function main() {
  const report = await buildReport();
  const day = new Date().toISOString().slice(0, 10);
  const outDir = join("reports", "automation");
  mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outPath = join(outDir, `report-${stamp}.md`);
  writeFileSync(outPath, report, "utf8");
  console.log(report);
  console.log(`\n📄 Sauvegardé : ${outPath}`);

  if (WEBHOOK || FORCE_DISCORD) {
    const ok = await postDiscord(report);
    if (ok) console.log("✅ Envoyé sur Discord");
  }
}

main().catch((e) => {
  console.error("❌", e instanceof Error ? e.message : e);
  process.exit(1);
});
