/**
 * Ouvre les liens d'activation YouTube Data API v3 dans le navigateur (4 comptes restants).
 * Usage: npm run youtube:open-api-links
 */
import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { listYouTubeAccountIds, resolveOAuthCredentials } from "../lib/youtubeAccounts.mjs";

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

function projectIdFromClientId(clientId) {
  return String(clientId ?? "").match(/^(\d+)-/)?.[1] ?? "";
}

const skip = new Set(["vibez"]);
const urls = [];

for (const id of listYouTubeAccountIds()) {
  if (skip.has(id)) continue;
  const { clientId } = resolveOAuthCredentials(id);
  const project = projectIdFromClientId(clientId);
  if (!project) continue;
  urls.push({
    id,
    url: `https://console.developers.google.com/apis/api/youtube.googleapis.com/overview?project=${project}`,
  });
}

console.log("Ouverture de", urls.length, "liens Google Cloud (clique ENABLE sur chaque onglet)…\n");

for (const { id, url } of urls) {
  console.log(`${id}: ${url}`);
  try {
    execFileSync("powershell", ["-NoProfile", "-Command", `Start-Process '${url.replace(/'/g, "''")}'`], {
      stdio: "ignore",
    });
  } catch {
    console.warn(`  (impossible d'ouvrir automatiquement — copie le lien)`);
  }
}

console.log("\nAprès activation sur les 4 projets, attends 2 min puis:");
console.log("  npm run youtube:optimize-channels");
