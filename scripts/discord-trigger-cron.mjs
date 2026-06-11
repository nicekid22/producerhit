/** Déclenche discord-cron (start_weekly ou close_weekly). Usage: node scripts/discord-trigger-cron.mjs start_weekly */
import { existsSync, readFileSync } from "fs";

function loadDotEnv() {
  if (!existsSync(".env")) return;
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (!(k in process.env)) process.env[k] = v;
  }
}

loadDotEnv();

const action = process.argv[2] || "start_weekly";
const secret = (process.env.DISCORD_CRON_SECRET ?? "").trim();
const url = (process.env.VITE_SUPABASE_URL ?? "").trim().replace(/\/$/, "");

if (!secret || !url) {
  console.error("DISCORD_CRON_SECRET + VITE_SUPABASE_URL required");
  process.exit(1);
}

const res = await fetch(`${url}/functions/v1/discord-cron`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-discord-cron-secret": secret },
  body: JSON.stringify({ action }),
});

console.log(res.status, await res.text());
