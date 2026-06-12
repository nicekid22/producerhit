/**
 * Print Google Cloud activation links to enable YouTube Data API v3 per OAuth project.
 * Usage: npm run youtube:enable-api-links
 */
import { existsSync, readFileSync } from "node:fs";
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
  const m = String(clientId ?? "").match(/^(\d+)-/);
  return m?.[1] ?? "";
}

console.log("Active YouTube Data API v3 on each Google Cloud project:\n");

for (const id of listYouTubeAccountIds()) {
  const { clientId } = resolveOAuthCredentials(id);
  const project = projectIdFromClientId(clientId);
  if (!project) {
    console.log(`- ${id}: client ID manquant`);
    continue;
  }
  const url = `https://console.developers.google.com/apis/api/youtube.googleapis.com/overview?project=${project}`;
  console.log(`${id.padEnd(16)} → ${url}`);
}

console.log("\nAprès activation, attendre ~2 min puis: npm run youtube:optimize-channels");
