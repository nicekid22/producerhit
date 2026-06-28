/**
 * Push TikTok OAuth env vars to Vercel production.
 * Usage: npm run vercel:sync-tiktok-env
 */
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";

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

if (!(process.env.OAUTH_SETUP_SECRET ?? "").trim()) {
  const secret = crypto.randomBytes(24).toString("hex");
  console.log(`⚠ OAUTH_SETUP_SECRET absent — généré pour ce sync: ${secret.slice(0, 8)}…`);
  console.log("  Ajoute-le aussi dans .env local pour que le CLI et Vercel utilisent le même state.\n");
  process.env.OAUTH_SETUP_SECRET = secret;
}

const KEYS = [
  "TIKTOK_CLIENT_KEY",
  "TIKTOK_CLIENT_SECRET",
  "TIKTOK_REDIRECT_URI",
  "TIKTOK_SCOPES",
  "OAUTH_SETUP_SECRET",
];

for (const key of KEYS) {
  let value = (process.env[key] ?? "").trim();
  if (key === "TIKTOK_REDIRECT_URI") {
    if (!value) value = "https://www.producerhit.com/api/tiktok-oauth-callback/";
    if (!value.endsWith("/")) value = `${value}/`;
  }
  if (!value) {
    console.warn(`⏭️  ${key} manquant — skip`);
    continue;
  }
  console.log(`Setting Vercel production: ${key}`);
  const res = spawnSync("npx", ["vercel", "env", "add", key, "production", "--force"], {
    input: value,
    encoding: "utf8",
    shell: true,
  });
  if (res.stdout) process.stdout.write(res.stdout);
  if (res.stderr) process.stderr.write(res.stderr);
  if (res.status !== 0) {
    console.error(`❌ Failed: ${key} (vercel login required?)`);
    process.exit(1);
  }
}

console.log("\n✅ TikTok env synced. Redeploy: npx vercel deploy --prod --yes");
