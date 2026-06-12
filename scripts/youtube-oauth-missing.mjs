/**
 * OAuth séquentiel pour tous les comptes sans refresh token.
 * Usage: npm run youtube:oauth:missing
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { listYouTubeAccountIds, loadYouTubeAccount } from "../lib/youtubeAccounts.mjs";

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

const missing = listYouTubeAccountIds().filter((id) => !loadYouTubeAccount(id));

if (!missing.length) {
  console.log("✅ Tous les comptes YouTube ont un refresh token.");
  process.exit(0);
}

console.log(`Comptes à connecter (${missing.length}): ${missing.join(", ")}\n`);
console.log("Google Cloud → Authorized redirect URI: http://localhost:8765\n");

for (const id of missing) {
  console.log(`\n━━━ OAuth: ${id} ━━━\n`);
  const res = spawnSync("node", ["--use-system-ca", "scripts/youtube-oauth.mjs", "--account", id, "--open"], {
    stdio: "inherit",
    shell: false,
  });
  if (res.status !== 0) {
    console.error(`\n❌ Échec OAuth pour ${id}. Corrige .env puis relance.`);
    process.exit(res.status ?? 1);
  }
}

console.log("\n✅ Tous les comptes connectés. Lance: npm run youtube:sync-secrets");
