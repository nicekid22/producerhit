/** Node mirror of supabase/functions/_shared/youtubeAccounts.ts */

function accountEnvPrefix(id) {
  const normalized = String(id ?? "").trim().toLowerCase();
  if (!normalized || normalized === "vibez" || normalized === "default") return "";
  return normalized.toUpperCase().replace(/[^A-Z0-9]/g, "_");
}

function readAccountEnv(id, suffix) {
  const prefix = accountEnvPrefix(id);
  if (!prefix) return (process.env[`YOUTUBE_${suffix}`] ?? "").trim();
  return (process.env[`YOUTUBE_${prefix}_${suffix}`] ?? "").trim();
}

export function listYouTubeAccountIds() {
  const raw = (process.env.YOUTUBE_ACCOUNTS ?? "vibez").trim();
  const remixRaw = (process.env.TREND_REMIX_YOUTUBE_ACCOUNTS ?? "remix1,remix2").trim();
  const main = raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const remix = remixRaw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return [...new Set([...main, ...remix])];
}

export function loadYouTubeAccount(id) {
  const clientId = readAccountEnv(id, "CLIENT_ID");
  const clientSecret = readAccountEnv(id, "CLIENT_SECRET");
  const refreshToken = readAccountEnv(id, "REFRESH_TOKEN");
  const channelUrl = readAccountEnv(id, "CHANNEL_URL");
  if (!clientId || !clientSecret || !refreshToken) return null;
  return {
    id: String(id).trim().toLowerCase(),
    clientId,
    clientSecret,
    refreshToken,
    channelUrl: channelUrl || `https://www.youtube.com/@${id}`,
  };
}

export function resolveOAuthCredentials(accountId) {
  const id = String(accountId ?? "vibez").trim().toLowerCase();
  const clientId = readAccountEnv(id, "CLIENT_ID");
  const clientSecret = readAccountEnv(id, "CLIENT_SECRET");
  const channelUrl = readAccountEnv(id, "CHANNEL_URL");
  const refreshEnvKey = accountEnvPrefix(id)
    ? `YOUTUBE_${accountEnvPrefix(id)}_REFRESH_TOKEN`
    : "YOUTUBE_REFRESH_TOKEN";
  return { id, clientId, clientSecret, channelUrl, refreshEnvKey };
}
