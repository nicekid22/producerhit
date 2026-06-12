/**
 * Push optimized channel descriptions + keywords to all 5 YouTube accounts.
 *
 * Usage:
 *   npm run youtube:optimize-channels
 *   npm run youtube:optimize-channels -- --account lowdey
 *   npm run youtube:optimize-channels -- --dry-run
 */
import { existsSync, readFileSync } from "node:fs";
import { getChannelProfile, listChannelProfileIds } from "../lib/youtubeChannelProfiles.mjs";
import { listYouTubeAccountIds, loadYouTubeAccount, resolveOAuthCredentials } from "../lib/youtubeAccounts.mjs";

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

function parseFlag(name) {
  return process.argv.includes(name);
}

function parseAccountArg() {
  const idx = process.argv.indexOf("--account");
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1].trim().toLowerCase();
  return "";
}

const DRY_RUN = parseFlag("--dry-run");
const SINGLE_ACCOUNT = parseAccountArg();

async function getAccessToken(accountId) {
  const { clientId, clientSecret, refreshEnvKey } = resolveOAuthCredentials(accountId);
  const refreshToken = (process.env[refreshEnvKey] ?? process.env.YOUTUBE_REFRESH_TOKEN ?? "").trim();
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(`missing_credentials:${accountId}`);
  }
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.access_token) {
    throw new Error(`token_failed:${accountId}:${JSON.stringify(json)}`);
  }
  return json.access_token;
}

async function fetchMyChannel(accessToken) {
  const url =
    "https://www.googleapis.com/youtube/v3/channels?part=snippet,brandingSettings&mine=true";
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const json = await res.json();
  if (!res.ok) throw new Error(`channels_list_failed:${JSON.stringify(json)}`);
  const ch = json.items?.[0];
  if (!ch?.id) throw new Error("channel_not_found");
  return ch;
}

async function updateChannelSnippet(accessToken, channel, description) {
  const body = {
    id: channel.id,
    snippet: {
      title: channel.snippet?.title ?? "ProducerHit",
      description,
    },
  };
  const res = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet", {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`channels_snippet_failed:${JSON.stringify(json)}`);
  return json;
}

async function updateChannelBranding(accessToken, channel, profile) {
  const body = {
    id: channel.id,
    brandingSettings: {
      channel: {
        title: channel.snippet?.title ?? profile.label,
        keywords: profile.channelKeywords,
        description: profile.channelDescription.slice(0, 1000),
        defaultTab: "shorts",
        profileColor: channel.brandingSettings?.channel?.profileColor ?? "#111111",
      },
    },
  };
  const res = await fetch("https://www.googleapis.com/youtube/v3/channels?part=brandingSettings", {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`channels_branding_failed:${JSON.stringify(json)}`);
  return json;
}

async function updateChannel(accessToken, channel, profile) {
  if (DRY_RUN) {
    console.log(`[dry-run] ${profile.id} → ${channel.snippet?.title}`);
    console.log(profile.channelDescription.slice(0, 200) + "…");
    return { ok: true, dryRun: true };
  }

  await updateChannelBranding(accessToken, channel, profile);
  return { ok: true, id: channel.id, title: channel.snippet?.title };
}

async function optimizeAccount(accountId) {
  const profile = getChannelProfile(accountId);
  const loaded = loadYouTubeAccount(accountId);
  if (!loaded) {
    console.warn(`⏭️  ${accountId} — credentials manquants, ignoré`);
    return { accountId, ok: false, skipped: true };
  }

  console.log(`\n📺 ${profile.label} (${profile.handle})`);
  const token = await getAccessToken(accountId);
  const channel = await fetchMyChannel(token);
  console.log(`   Chaîne API: ${channel.snippet?.title} (${channel.id})`);
  const result = await updateChannel(token, channel, profile);
  console.log(`   ✅ Description + keywords ${DRY_RUN ? "(dry-run)" : "mis à jour"}`);
  return { accountId, ok: true, ...result };
}

async function main() {
  const envAccounts = listYouTubeAccountIds();
  const profileIds = listChannelProfileIds();
  const targets = SINGLE_ACCOUNT
    ? [SINGLE_ACCOUNT]
    : [...new Set([...envAccounts, ...profileIds])];

  console.log(`Optimisation chaînes YouTube (${targets.length})${DRY_RUN ? " [DRY-RUN]" : ""}`);

  const results = [];
  for (const id of targets) {
    try {
      results.push(await optimizeAccount(id));
    } catch (e) {
      console.error(`   ❌ ${id}:`, e instanceof Error ? e.message : e);
      results.push({ accountId: id, ok: false, error: String(e) });
    }
  }

  const ok = results.filter((r) => r.ok).length;
  console.log(`\nRésumé: ${ok}/${results.length} chaînes OK`);
  if (ok < results.length) process.exit(1);
}

main();
