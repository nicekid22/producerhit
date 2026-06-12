export type YouTubeAccount = {
  id: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  channelUrl: string;
};

function accountEnvPrefix(id: string): string {
  const normalized = id.trim().toLowerCase();
  if (!normalized || normalized === "vibez" || normalized === "default") return "";
  return normalized.toUpperCase().replace(/[^A-Z0-9]/g, "_");
}

function readEnv(key: string): string {
  return (Deno.env.get(key) ?? "").trim();
}

function readAccountEnv(id: string, suffix: string): string {
  const prefix = accountEnvPrefix(id);
  if (!prefix) return readEnv(`YOUTUBE_${suffix}`);
  return readEnv(`YOUTUBE_${prefix}_${suffix}`);
}

export function listYouTubeAccountIds(): string[] {
  const raw = readEnv("YOUTUBE_ACCOUNTS");
  const remixRaw = readEnv("TREND_REMIX_YOUTUBE_ACCOUNTS");
  const main = (raw || "vibez")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const remix = (remixRaw || "remix1,remix2")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set([...main, ...remix])];
}

export function loadYouTubeAccount(id: string): YouTubeAccount | null {
  const clientId = readAccountEnv(id, "CLIENT_ID");
  const clientSecret = readAccountEnv(id, "CLIENT_SECRET");
  const refreshToken = readAccountEnv(id, "REFRESH_TOKEN");
  const channelUrl = readAccountEnv(id, "CHANNEL_URL");
  if (!clientId || !clientSecret || !refreshToken) return null;
  return {
    id: id.trim().toLowerCase(),
    clientId,
    clientSecret,
    refreshToken,
    channelUrl: channelUrl || `https://www.youtube.com/@${id}`,
  };
}

export function listReadyYouTubeAccounts(): YouTubeAccount[] {
  return listYouTubeAccountIds()
    .map((id) => loadYouTubeAccount(id))
    .filter((a): a is YouTubeAccount => Boolean(a));
}

export function accountFromPayload(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "vibez";
  const account = (payload as Record<string, unknown>).account;
  return typeof account === "string" && account.trim() ? account.trim().toLowerCase() : "vibez";
}
