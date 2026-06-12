import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  accountFromPayload,
  listReadyYouTubeAccounts,
  type YouTubeAccount,
} from "./youtubeAccounts.ts";
import {
  buildYouTubeDescription,
  buildYouTubeHashtags,
  buildViralYouTubeDescription,
  extractViralMeta,
  inferTrackKind,
  socialPublishQueueBatch,
  youtubeGlobalMinIntervalSec,
  youtubeMaxDailyPerAccount,
  youtubeMinIntervalSec,
  type TrackKind,
  type ViralMeta,
} from "./youtubeSocial.ts";
import { buildYouTubeUploadMetadata, type YouTubeUploadMetadata } from "./youtubeMetadata.ts";
import { homeUrlForChannel } from "./youtubeChannelProfiles.ts";
import { resolveYouTubePreferredAccount } from "./youtubeChannelStrategy.ts";

export const PRODUCERHIT_SITE = "https://www.producerhit.com";

export type SocialLoopRow = {
  id: string;
  name: string | null;
  genre: string | null;
  mood: string | null;
  bpm: number | null;
  key: string | null;
  scale: string | null;
  cover_url: string | null;
  audio_url: string | null;
  user_id: string | null;
  created_at: string | null;
  is_public: boolean | null;
  stems_url?: unknown;
};

export type SocialPayload = {
  event: "public_track_published";
  loop_id: string;
  name: string;
  genre: string;
  mood: string;
  bpm: number | null;
  key: string;
  track_kind: TrackKind;
  share_urls: Record<string, string>;
  captions: Record<string, string>;
  media: {
    cover_url: string | null;
    og_image: string;
    audio_url: string | null;
  };
  hashtags: string[];
  published_at: string;
  viral_meta?: ViralMeta | null;
};

export function verifySocialCronSecret(req: Request): boolean {
  const expected = (Deno.env.get("SOCIAL_PUBLISH_CRON_SECRET") ?? "").trim();
  if (!expected) return false;
  return req.headers.get("x-social-cron-secret") === expected;
}

export function serviceClient(): SupabaseClient | null {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export function buildShareUrl(loopId: string, channel: string): string {
  const url = new URL(`${PRODUCERHIT_SITE}/loop/${encodeURIComponent(loopId)}`);
  url.searchParams.set("utm_source", channel);
  url.searchParams.set("utm_medium", "social");
  url.searchParams.set("utm_campaign", "public_track");
  url.searchParams.set("utm_content", loopId.slice(0, 8));
  return url.toString();
}

/** YouTube Shorts link with channel-specific campaign for analytics. */
export function buildYouTubeShareUrl(loopId: string, accountId: string): string {
  const campaign = accountId.trim().toLowerCase();
  const url = new URL(`${PRODUCERHIT_SITE}/loop/${encodeURIComponent(loopId)}`);
  url.searchParams.set("utm_source", "youtube");
  url.searchParams.set("utm_medium", "shorts");
  url.searchParams.set("utm_campaign", campaign);
  url.searchParams.set("utm_content", loopId.slice(0, 8));
  return url.toString();
}

function moodTags(mood: string): string[] {
  const key = mood.trim().toLowerCase();
  if (key.includes("dream")) return ["#dreamy", "#aesthetic"];
  if (key.includes("dark")) return ["#darktrap", "#moody"];
  if (key.includes("chill") || key.includes("lofi")) return ["#chill", "#lofi"];
  if (key.includes("energy") || key.includes("hype")) return ["#banger", "#hype"];
  return ["#vibes", "#newmusic"];
}

function buildViralTikTokCaption(input: { viral: ViralMeta; name: string; shareUrl: string }): string {
  const hook = (input.viral.hookOpen ?? input.name).trim().slice(0, 120);
  const cta = (input.viral.hookCta ?? "Turn YOUR text into a song → link in bio").trim();
  const seriesTag =
    input.viral.series === "guess_prompt"
      ? "#GuessThePrompt"
      : input.viral.series === "absurd_to_song"
        ? "#AbsurdSong"
        : "#CommentToSong";
  return [
    hook,
    cta,
    input.shareUrl,
    `#AIMusic #Shorts ${seriesTag} #ProducerHit #TextToSong`,
  ]
    .join("\n")
    .slice(0, 4000);
}

export function buildHashtags(loop: SocialLoopRow, trackKind?: TrackKind): string[] {
  const kind = trackKind ?? inferTrackKind(loop.stems_url, loop.name ?? "");
  const tags = new Set<string>([
    ...buildYouTubeHashtags(kind, loop.genre ?? ""),
    ...moodTags(loop.mood ?? ""),
  ]);
  return Array.from(tags).slice(0, 6);
}

export function buildSocialPayload(loop: SocialLoopRow): SocialPayload {
  const name = (loop.name ?? "Untitled").trim();
  const genre = (loop.genre ?? "AI").trim();
  const mood = (loop.mood ?? "").trim();
  const bpm = loop.bpm && loop.bpm > 0 ? loop.bpm : null;
  const keyLine = [loop.key, loop.scale].filter(Boolean).join(" ").trim();
  const track_kind = inferTrackKind(loop.stems_url, name);
  const viral_meta = extractViralMeta(loop.stems_url);
  const hashtags = buildHashtags(loop, track_kind);
  const tagLine = hashtags.join(" ");
  const kindNoun =
    track_kind === "song" ? "song" : track_kind === "instrumental" ? "instrumental" : "type beat";
  const listenBase = `New ${genre} ${kindNoun} on ProducerHit — "${name}"`;
  const meta = [bpm ? `${bpm} BPM` : null, keyLine || null].filter(Boolean).join(" · ");

  const share_urls = {
    twitter: buildShareUrl(loop.id, "twitter"),
    tiktok: buildShareUrl(loop.id, "tiktok"),
    instagram: buildShareUrl(loop.id, "instagram"),
    facebook: buildShareUrl(loop.id, "facebook"),
    youtube: buildShareUrl(loop.id, "youtube"),
    reddit: buildShareUrl(loop.id, "reddit"),
    telegram: buildShareUrl(loop.id, "telegram"),
    whatsapp: buildShareUrl(loop.id, "whatsapp"),
    discord: buildShareUrl(loop.id, "discord"),
    web: buildShareUrl(loop.id, "organic"),
  };

  const captions = {
    twitter: `${listenBase}${meta ? ` (${meta})` : ""} ${share_urls.twitter}`.slice(0, 280),
    tiktok: viral_meta
      ? buildViralTikTokCaption({ viral: viral_meta, name, shareUrl: share_urls.tiktok })
      : `${name}${bpm ? ` · ${bpm} BPM` : ""}\nProducerHit AI\n${tagLine}\n${share_urls.tiktok}`,
    instagram: `${name}${meta ? `\n${meta}` : ""}\n🎧 ProducerHit\n${tagLine}\n${share_urls.instagram}`,
    facebook: `${listenBase}. Listen: ${share_urls.facebook}`,
    telegram: `${listenBase}${meta ? ` · ${meta}` : ""}\n${share_urls.telegram}`,
    reddit: `[${name}](${share_urls.reddit}) — ${genre}${bpm ? ` ${bpm} BPM` : ""} · AI beat on ProducerHit`,
    youtube: viral_meta
      ? buildViralYouTubeDescription({ viral: viral_meta, shareUrl: share_urls.youtube })
      : buildYouTubeDescription({
          name,
          genre,
          bpm,
          key: keyLine,
          kind: track_kind,
          shareUrl: share_urls.youtube,
        }),
  };

  return {
    event: "public_track_published",
    loop_id: loop.id,
    name,
    genre,
    mood,
    bpm,
    key: keyLine,
    track_kind,
    share_urls,
    captions,
    media: {
      cover_url: loop.cover_url,
      og_image: `${PRODUCERHIT_SITE}/api/og-loop?id=${encodeURIComponent(loop.id)}`,
      audio_url: loop.audio_url,
    },
    hashtags,
    published_at: loop.created_at ?? new Date().toISOString(),
    viral_meta,
  };
}

function encodeRFC3986(str: string) {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

async function oauth1Header(method: string, url: string, creds: Record<string, string>, extraParams: Record<string, string> = {}) {
  const oauth: Record<string, string> = {
    oauth_consumer_key: creds.consumerKey,
    oauth_nonce: crypto.randomUUID().replace(/-/g, ""),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: creds.accessToken,
    oauth_version: "1.0",
  };
  const params = { ...extraParams, ...oauth };
  const paramString = Object.keys(params)
    .sort()
    .map((k) => `${encodeRFC3986(k)}=${encodeRFC3986(String(params[k]))}`)
    .join("&");
  const baseString = [method.toUpperCase(), encodeRFC3986(url), encodeRFC3986(paramString)].join("&");
  const signingKey = `${encodeRFC3986(creds.consumerSecret)}&${encodeRFC3986(creds.accessTokenSecret)}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(signingKey),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(baseString));
  oauth.oauth_signature = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return (
    "OAuth " +
    Object.keys(oauth)
      .sort()
      .map((k) => `${encodeRFC3986(k)}="${encodeRFC3986(String(oauth[k]))}"`)
      .join(", ")
  );
}

export async function postTwitter(text: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  const creds = {
    consumerKey: (Deno.env.get("TWITTER_API_KEY") ?? "").trim(),
    consumerSecret: (Deno.env.get("TWITTER_API_SECRET") ?? "").trim(),
    accessToken: (Deno.env.get("TWITTER_ACCESS_TOKEN") ?? "").trim(),
    accessTokenSecret: (Deno.env.get("TWITTER_ACCESS_TOKEN_SECRET") ?? "").trim(),
  };
  if (!creds.consumerKey || !creds.consumerSecret || !creds.accessToken || !creds.accessTokenSecret) {
    return { ok: false, error: "missing_twitter_credentials" };
  }

  const apiUrl = "https://api.twitter.com/2/tweets";
  const authHeader = await oauth1Header("POST", apiUrl, creds);
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: { Authorization: authHeader, "Content-Type": "application/json" },
    body: JSON.stringify({ text: text.slice(0, 280) }),
  });
  if (!res.ok) {
    return { ok: false, error: `twitter_${res.status}:${(await res.text()).slice(0, 200)}` };
  }
  const json = (await res.json()) as { data?: { id?: string } };
  return { ok: true, id: json?.data?.id };
}

export async function postWebhook(payload: SocialPayload): Promise<{ ok: boolean; error?: string }> {
  const url = (Deno.env.get("SOCIAL_WEBHOOK_URL") ?? "").trim();
  if (!url) return { ok: false, error: "missing_webhook" };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source: "producerhit-social-publish",
      ...payload,
      platforms_hint: ["tiktok", "instagram", "facebook", "youtube", "linkedin", "threads", "bluesky", "reddit"],
    }),
  });
  if (!res.ok) return { ok: false, error: `webhook_${res.status}` };
  return { ok: true };
}

export async function submitIndexNow(loopUrl: string): Promise<{ ok: boolean; error?: string }> {
  const key = (Deno.env.get("INDEXNOW_KEY") ?? "producerhit-indexnow-key").trim();
  if (key.length < 8) return { ok: false, error: "indexnow_key_short" };

  const body = {
    host: "www.producerhit.com",
    key,
    keyLocation: `${PRODUCERHIT_SITE}/${encodeURIComponent(key)}.txt`,
    urlList: [loopUrl],
  };

  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });
  if (res.ok || res.status === 202) return { ok: true };
  return { ok: false, error: `indexnow_${res.status}` };
}

const REDDIT_UA = "ProducerHitBot/1.0 (by u/producerhit)";
let redditTokenCache: { token: string; expires: number } | null = null;

async function getRedditAccessToken(): Promise<string | null> {
  const now = Date.now();
  if (redditTokenCache && redditTokenCache.expires > now + 60_000) return redditTokenCache.token;

  const clientId = (Deno.env.get("REDDIT_CLIENT_ID") ?? "").trim();
  const clientSecret = (Deno.env.get("REDDIT_CLIENT_SECRET") ?? "").trim();
  const refreshToken = (Deno.env.get("REDDIT_REFRESH_TOKEN") ?? "").trim();
  if (!clientId || !clientSecret || !refreshToken) return null;

  const basic = btoa(`${clientId}:${clientSecret}`);
  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": REDDIT_UA,
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) return null;
  redditTokenCache = {
    token: json.access_token,
    expires: now + (json.expires_in ?? 3600) * 1000,
  };
  return json.access_token;
}

export async function postReddit(payload: SocialPayload): Promise<{ ok: boolean; id?: string; error?: string }> {
  const subreddit = (Deno.env.get("REDDIT_SUBREDDIT") ?? "").trim();
  if (!subreddit) return { ok: false, error: "missing_subreddit" };

  const token = await getRedditAccessToken();
  if (!token) return { ok: false, error: "missing_reddit_credentials" };

  const title = `${payload.name} — ${payload.genre}${payload.bpm ? ` ${payload.bpm} BPM` : ""} · AI beat on ProducerHit`.slice(
    0,
    300,
  );
  const body = new URLSearchParams({
    kind: "link",
    sr: subreddit.replace(/^r\//i, ""),
    title,
    url: payload.share_urls.reddit,
    resubmit: "false",
  });

  const res = await fetch("https://oauth.reddit.com/api/submit", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": REDDIT_UA,
    },
    body,
  });
  if (!res.ok) {
    return { ok: false, error: `reddit_${res.status}:${(await res.text()).slice(0, 200)}` };
  }
  const json = (await res.json()) as {
    json?: { errors?: unknown[]; data?: { id?: string; url?: string } };
  };
  const errors = json?.json?.errors;
  if (errors && errors.length > 0) {
    return { ok: false, error: `reddit_api:${JSON.stringify(errors).slice(0, 200)}` };
  }
  return { ok: true, id: json?.json?.data?.id ?? json?.json?.data?.url };
}

const TIKTOK_API = "https://open.tiktokapis.com";
let tiktokAccessCache: { token: string; expires: number } | null = null;

type TikTokApiEnvelope<T> = {
  data?: T;
  error?: { code?: string; message?: string; log_id?: string };
};

async function getTikTokAccessToken(): Promise<string | null> {
  const now = Date.now();
  if (tiktokAccessCache && tiktokAccessCache.expires > now + 60_000) {
    return tiktokAccessCache.token;
  }

  const clientKey = (Deno.env.get("TIKTOK_CLIENT_KEY") ?? Deno.env.get("TIKTOK_CLIENT_ID") ?? "").trim();
  const clientSecret = (Deno.env.get("TIKTOK_CLIENT_SECRET") ?? "").trim();
  const refreshToken = (Deno.env.get("TIKTOK_REFRESH_TOKEN") ?? "").trim();
  if (!clientKey || !clientSecret || !refreshToken) return null;

  const body = new URLSearchParams({
    client_key: clientKey,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  const res = await fetch(`${TIKTOK_API}/v2/oauth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    refresh_token?: string;
    error_code?: number;
    error_description?: string;
  };
  if (!res.ok || !json.access_token) return null;
  tiktokAccessCache = {
    token: json.access_token,
    expires: now + (json.expires_in ?? 86400) * 1000,
  };
  return json.access_token;
}

function pickTikTokPrivacy(options: string[] | undefined): string {
  const list = options ?? [];
  if (list.includes("PUBLIC_TO_EVERYONE")) return "PUBLIC_TO_EVERYONE";
  if (list.includes("MUTUAL_FOLLOW_FRIENDS")) return "MUTUAL_FOLLOW_FRIENDS";
  if (list.includes("FOLLOWER_OF_CREATOR")) return "FOLLOWER_OF_CREATOR";
  if (list.includes("SELF_ONLY")) return "SELF_ONLY";
  return list[0] ?? "SELF_ONLY";
}

async function tiktokPostJson<T>(accessToken: string, path: string, body: unknown): Promise<TikTokApiEnvelope<T>> {
  const res = await fetch(`${TIKTOK_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify(body),
  });
  return (await res.json()) as TikTokApiEnvelope<T>;
}

async function pollTikTokPublish(accessToken: string, publishId: string): Promise<{ ok: boolean; status?: string; error?: string }> {
  for (let i = 0; i < 8; i++) {
    const json = await tiktokPostJson<{ status?: string; fail_reason?: string }>(
      accessToken,
      "/v2/post/publish/status/fetch/",
      { publish_id: publishId },
    );
    if (json.error?.code && json.error.code !== "ok") {
      return { ok: false, error: `${json.error.code}:${json.error.message ?? ""}` };
    }
    const status = json.data?.status ?? "";
    if (status === "PUBLISH_COMPLETE") return { ok: true, status };
    if (status === "FAILED") {
      return { ok: false, error: json.data?.fail_reason ?? "publish_failed" };
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return { ok: true, status: "processing" };
}

/** Post TikTok — pre-rendered video (preferred) or photo carousel fallback. */
export async function postTikTok(
  db: SupabaseClient,
  loop: SocialLoopRow,
  payload: SocialPayload,
): Promise<{ ok: boolean; id?: string; error?: string; mode?: string }> {
  const accessToken = await getTikTokAccessToken();
  if (!accessToken) return { ok: false, error: "missing_tiktok_credentials" };

  const videoUrl = await getStoredSocialVideoPublicUrl(db, loop);
  const photoUrl = payload.media.cover_url || payload.media.og_image;

  if (!videoUrl && !photoUrl) return { ok: false, error: "missing_cover_image" };

  const creator = await tiktokPostJson<{
    privacy_level_options?: string[];
    creator_username?: string;
  }>(accessToken, "/v2/post/publish/creator_info/query/", {});
  if (creator.error?.code && creator.error.code !== "ok") {
    return { ok: false, error: `creator_info:${creator.error.code}` };
  }

  const privacy = pickTikTokPrivacy(creator.data?.privacy_level_options);
  const postMode = (Deno.env.get("TIKTOK_POST_MODE") ?? "MEDIA_UPLOAD").trim();
  const title = payload.name.slice(0, 90);
  const description = payload.captions.tiktok.slice(0, 4000);

  const initBody = videoUrl
    ? {
        post_info: {
          title,
          description,
          privacy_level: privacy,
          disable_comment: false,
          brand_content_toggle: false,
          brand_organic_toggle: true,
        },
        source_info: { source: "PULL_FROM_URL", video_url: videoUrl },
        post_mode: postMode,
        media_type: "VIDEO",
      }
    : {
        post_info: {
          title,
          description,
          privacy_level: privacy,
          disable_comment: false,
          auto_add_music: true,
          brand_content_toggle: false,
          brand_organic_toggle: true,
        },
        source_info: {
          source: "PULL_FROM_URL",
          photo_cover_index: 0,
          photo_images: [photoUrl!],
        },
        post_mode: postMode,
        media_type: "PHOTO",
      };

  const init = await tiktokPostJson<{ publish_id?: string }>(accessToken, "/v2/post/publish/content/init/", initBody);

  if (init.error?.code && init.error.code !== "ok") {
    return { ok: false, error: `tiktok_init:${init.error.code}:${init.error.message ?? ""}` };
  }
  const publishId = init.data?.publish_id;
  if (!publishId) return { ok: false, error: "tiktok_no_publish_id" };

  if (postMode === "MEDIA_UPLOAD") {
    return { ok: true, id: publishId, mode: videoUrl ? "video_upload" : "photo_upload" };
  }

  const polled = await pollTikTokPublish(accessToken, publishId);
  if (!polled.ok) return { ok: false, error: polled.error ?? "tiktok_publish_failed" };
  return { ok: true, id: publishId, mode: videoUrl ? "video_direct" : "photo_direct" };
}

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const YOUTUBE_UPLOAD_INIT = "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status";
const youtubeAccessCache = new Map<string, { token: string; expires: number }>();

async function getYouTubeAccessToken(account: YouTubeAccount): Promise<string | null> {
  const now = Date.now();
  const cached = youtubeAccessCache.get(account.id);
  if (cached && cached.expires > now + 60_000) {
    return cached.token;
  }

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: account.clientId,
      client_secret: account.clientSecret,
      grant_type: "refresh_token",
      refresh_token: account.refreshToken,
    }),
  });
  const json = (await res.json()) as { access_token?: string; expires_in?: number; error?: string };
  if (!res.ok || !json.access_token) return null;
  youtubeAccessCache.set(account.id, {
    token: json.access_token,
    expires: now + (json.expires_in ?? 3600) * 1000,
  });
  return json.access_token;
}

async function lastYouTubePostAt(db: SupabaseClient, accountId: string): Promise<number | null> {
  const { data } = await db
    .from("social_publish_log")
    .select("created_at,payload")
    .eq("platform", "youtube")
    .eq("status", "posted")
    .order("created_at", { ascending: false })
    .limit(40);

  for (const row of data ?? []) {
    const postedAccount = accountFromPayload(row.payload);
    if (postedAccount !== accountId) continue;
    if (!row.created_at) continue;
    return new Date(row.created_at).getTime();
  }
  return null;
}

async function lastYouTubePostGlobal(db: SupabaseClient): Promise<number | null> {
  const { data } = await db
    .from("social_publish_log")
    .select("created_at")
    .eq("platform", "youtube")
    .eq("status", "posted")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data?.created_at) return null;
  return new Date(data.created_at).getTime();
}

async function youtubePostsTodayForAccount(db: SupabaseClient, accountId: string): Promise<number> {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const { data } = await db
    .from("social_publish_log")
    .select("payload")
    .eq("platform", "youtube")
    .eq("status", "posted")
    .gte("created_at", start.toISOString())
    .limit(50);

  let count = 0;
  for (const row of data ?? []) {
    if (accountFromPayload(row.payload) === accountId) count += 1;
  }
  return count;
}

export async function pickYouTubeAccount(
  db: SupabaseClient,
  opts?: { preferredId?: string | null },
): Promise<
  | { ok: true; account: YouTubeAccount }
  | { ok: false; error: string }
  | { ok: false; throttled: true; reason: string; retryAfterSec: number }
> {
  const accounts = listReadyYouTubeAccounts();
  if (accounts.length === 0) return { ok: false, error: "missing_youtube_credentials" };

  const minSec = youtubeMinIntervalSec();
  const globalMinSec = youtubeGlobalMinIntervalSec();
  const maxDaily = youtubeMaxDailyPerAccount();
  const now = Date.now();

  const lastGlobal = await lastYouTubePostGlobal(db);
  if (lastGlobal) {
    const globalElapsed = (now - lastGlobal) / 1000;
    if (globalElapsed < globalMinSec) {
      return {
        ok: false,
        throttled: true,
        reason: "youtube_global_throttled",
        retryAfterSec: Math.ceil(globalMinSec - globalElapsed),
      };
    }
  }

  const ready: { account: YouTubeAccount; lastAt: number }[] = [];
  let shortestWait = Math.min(minSec, globalMinSec);

  for (const account of accounts) {
    const postsToday = await youtubePostsTodayForAccount(db, account.id);
    if (postsToday >= maxDaily) continue;

    const lastAt = await lastYouTubePostAt(db, account.id);
    const elapsed = lastAt ? (now - lastAt) / 1000 : minSec;
    if (elapsed >= minSec) {
      ready.push({ account, lastAt: lastAt ?? 0 });
    } else {
      shortestWait = Math.min(shortestWait, minSec - elapsed);
    }
  }

  if (ready.length === 0) {
    return {
      ok: false,
      throttled: true,
      reason: "youtube_throttled",
      retryAfterSec: Math.ceil(shortestWait),
    };
  }

  const preferred = (opts?.preferredId ?? "").trim().toLowerCase();
  if (preferred) {
    const hit = ready.find((r) => r.account.id === preferred);
    if (hit) return { ok: true, account: hit.account };

    const prefConfigured = accounts.some((a) => a.id === preferred);
    if (prefConfigured) {
      const lastAt = await lastYouTubePostAt(db, preferred);
      const elapsed = lastAt ? (now - lastAt) / 1000 : minSec;
      const postsToday = await youtubePostsTodayForAccount(db, preferred);
      if (postsToday >= maxDaily) {
        return {
          ok: false,
          throttled: true,
          reason: `youtube_preferred_${preferred}_daily_cap`,
          retryAfterSec: 3600,
        };
      }
      return {
        ok: false,
        throttled: true,
        reason: `youtube_preferred_${preferred}_wait`,
        retryAfterSec: Math.ceil(Math.max(0, minSec - elapsed)),
      };
    }
  }

  ready.sort((a, b) => a.lastAt - b.lastAt);
  return { ok: true, account: ready[0].account };
}

async function listStoredSocialVideo(
  db: SupabaseClient,
  loop: SocialLoopRow,
): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  if (!loop.user_id) return null;
  const folder = `${loop.user_id}/${loop.id}`;
  const { data: files } = await db.storage.from("social-videos").list(folder, {
    limit: 5,
    sortBy: { column: "created_at", order: "desc" },
  });
  const file = files?.find((f) => f.name && !f.name.endsWith("/"));
  if (!file?.name) return null;

  const path = `${folder}/${file.name}`;
  const { data, error } = await db.storage.from("social-videos").download(path);
  if (error || !data) return null;
  const bytes = new Uint8Array(await data.arrayBuffer());
  if (bytes.byteLength < 8_000) return null;
  const lower = file.name.toLowerCase();
  const contentType = lower.endsWith(".webm") ? "video/webm" : "video/mp4";
  return { bytes, contentType };
}

async function getStoredSocialVideoPublicUrl(db: SupabaseClient, loop: SocialLoopRow): Promise<string | null> {
  if (!loop.user_id) return null;
  const folder = `${loop.user_id}/${loop.id}`;
  const { data: files } = await db.storage.from("social-videos").list(folder, {
    limit: 5,
    sortBy: { column: "created_at", order: "desc" },
  });
  const file = files?.find((f) => f.name && !f.name.endsWith("/") && f.name.toLowerCase().endsWith(".mp4"));
  if (!file?.name) return null;
  const path = `${folder}/${file.name}`;
  const { data } = db.storage.from("social-videos").getPublicUrl(path);
  return data?.publicUrl?.trim() || null;
}

async function fetchYouTubeRenderedVideo(loopId: string): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  const secret = (Deno.env.get("SOCIAL_PUBLISH_CRON_SECRET") ?? "").trim();
  const base = (Deno.env.get("YOUTUBE_RENDER_URL") ?? "https://www.producerhit.com/api/youtube-render").trim();
  if (!secret) return null;

  const url = `${base}?loopId=${encodeURIComponent(loopId)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 110_000);
  try {
    const res = await fetch(url, {
      headers: { "x-social-cron-secret": secret },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const ct = (res.headers.get("content-type") ?? "video/mp4").toLowerCase();
    if (!ct.includes("video") && !ct.includes("octet-stream")) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.byteLength < 8_000) return null;
    return { bytes, contentType: ct.includes("webm") ? "video/webm" : "video/mp4" };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function resolveYouTubeVideo(
  db: SupabaseClient,
  loop: SocialLoopRow,
): Promise<{ bytes: Uint8Array; contentType: string; source: string } | null> {
  const stored = await listStoredSocialVideo(db, loop);
  if (stored) return { ...stored, source: "social-videos" };

  const rendered = await fetchYouTubeRenderedVideo(loop.id);
  if (rendered) return { ...rendered, source: "youtube-render" };

  return null;
}

function youtubeUploadMetadata(payload: SocialPayload, accountId: string): YouTubeUploadMetadata {
  return buildYouTubeUploadMetadata({
    loopId: payload.loop_id,
    name: payload.name,
    genre: payload.genre,
    bpm: payload.bpm,
    key: payload.key,
    kind: payload.track_kind,
    shareUrl: buildYouTubeShareUrl(payload.loop_id, accountId),
    accountId,
    viralMeta: payload.viral_meta,
  });
}

function buildYouTubeEngagementComment(accountId: string, payload: SocialPayload): string {
  const trackUrl = buildYouTubeShareUrl(payload.loop_id, accountId);
  const home = homeUrlForChannel(accountId);
  const viral = payload.viral_meta?.series;
  if (viral === "guess_prompt") {
    return `👇 Drop your guess!\n🎧 Full track: ${trackUrl}\n✨ Make your own: ${home}`;
  }
  if (viral === "comment_to_song") {
    return `💬 Comment your idea for the next episode!\n🎧 Listen: ${trackUrl}\n✨ Try ProducerHit: ${home}`;
  }
  if (viral === "absurd_to_song") {
    return `😭 What should we turn into a song next?\n🎧 Track: ${trackUrl}\n🔥 Create yours: ${home}`;
  }
  const account = accountId.trim().toLowerCase();
  if (account === "vibez") {
    return `🎧 Full track (free): ${trackUrl}\n✨ This was made on ProducerHit in seconds — yours could be next: ${home}`;
  }
  if (account === "market") {
    return `🎹 Beat link: ${trackUrl}\n🔥 Imagine dropping YOUR name on a beat like this → ${home}`;
  }
  return `🎧 Full track free: ${trackUrl}\n✨ Create AI beats & songs: ${home}`;
}

async function postYouTubeEngagementComment(
  accessToken: string,
  videoId: string,
  text: string,
): Promise<void> {
  try {
    const res = await fetch("https://www.googleapis.com/youtube/v3/commentThreads?part=snippet", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        snippet: {
          videoId,
          topLevelComment: { snippet: { textOriginal: text.slice(0, 9000) } },
        },
      }),
    });
    if (!res.ok) {
      console.warn(`youtube_comment_${res.status}:${(await res.text()).slice(0, 120)}`);
    }
  } catch {
    // optional engagement boost
  }
}

export async function youtubeThrottleStatus(
  db: SupabaseClient,
): Promise<{ ok: boolean; reason?: string; retryAfterSec?: number }> {
  const picked = await pickYouTubeAccount(db);
  if ("throttled" in picked && picked.throttled) {
    return { ok: false, reason: picked.reason, retryAfterSec: picked.retryAfterSec };
  }
  if (!picked.ok) return { ok: false, reason: picked.error };
  return { ok: true };
}

async function uploadYouTubeVideo(
  accessToken: string,
  bytes: Uint8Array,
  contentType: string,
  meta: YouTubeUploadMetadata,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const privacy = (Deno.env.get("YOUTUBE_PRIVACY_STATUS") ?? "public").trim();
  const categoryId = (Deno.env.get("YOUTUBE_CATEGORY_ID") ?? "10").trim();
  const madeForKids = (Deno.env.get("YOUTUBE_MADE_FOR_KIDS") ?? "false").trim() === "true";
  const uploadContentType = contentType.startsWith("video/") ? contentType : "video/mp4";
  const total = bytes.byteLength;
  const lastByte = total - 1;

  const metadata = {
    snippet: {
      title: meta.title,
      description: meta.description,
      tags: meta.tags,
      categoryId,
      defaultLanguage: "en",
      defaultAudioLanguage: "en",
    },
    status: {
      privacyStatus: privacy,
      selfDeclaredMadeForKids: madeForKids,
      embeddable: true,
      license: "youtube",
      notifySubscribers: false,
      containsSyntheticMedia: true,
    },
  };
  const metadataJson = JSON.stringify(metadata);

  // Step 1 — resumable session (doc Google)
  const initRes = await fetch(YOUTUBE_UPLOAD_INIT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
      "Content-Length": String(new TextEncoder().encode(metadataJson).length),
      "X-Upload-Content-Type": uploadContentType,
      "X-Upload-Content-Length": String(total),
    },
    body: metadataJson,
  });

  if (!initRes.ok) {
    return { ok: false, error: `youtube_init_${initRes.status}:${(await initRes.text()).slice(0, 200)}` };
  }

  const uploadUrl = initRes.headers.get("location")?.trim();
  if (!uploadUrl) return { ok: false, error: "youtube_no_upload_url" };

  // Step 2 — upload binaire (Authorization + Content-Range requis en pratique)
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Length": String(total),
      "Content-Type": uploadContentType,
      "Content-Range": `bytes 0-${lastByte}/${total}`,
    },
    body: bytes,
  });

  if (uploadRes.status !== 201 && !uploadRes.ok) {
    return { ok: false, error: `youtube_upload_${uploadRes.status}:${(await uploadRes.text()).slice(0, 200)}` };
  }

  const json = (await uploadRes.json()) as { id?: string };
  if (!json.id) return { ok: false, error: "youtube_no_video_id" };
  return { ok: true, id: json.id };
}

/** Upload YouTube — cover + audio (render API) ou vidéo social-videos existante. */
export async function postYouTube(
  db: SupabaseClient,
  loop: SocialLoopRow,
  payload: SocialPayload,
): Promise<{ ok: boolean; id?: string; account?: string; ab?: YouTubeUploadMetadata["ab"]; error?: string }> {
  const picked = await pickYouTubeAccount(db, {
    preferredId: resolveYouTubePreferredAccount({
      viralMeta: payload.viral_meta,
      trackKind: payload.track_kind,
    }),
  });
  if ("throttled" in picked && picked.throttled) {
    return { ok: false, error: picked.reason };
  }
  if (!picked.ok) return { ok: false, error: picked.error };

  const account = picked.account;
  const accessToken = await getYouTubeAccessToken(account);
  if (!accessToken) return { ok: false, error: "missing_youtube_credentials" };

  const video = await resolveYouTubeVideo(db, loop);
  if (!video) return { ok: false, error: "youtube_video_unavailable" };

  const uploadMeta = youtubeUploadMetadata(payload, account.id);
  const uploaded = await uploadYouTubeVideo(accessToken, video.bytes, video.contentType, uploadMeta);
  if (!uploaded.ok) return uploaded;

  if (uploaded.id) {
    await postYouTubeEngagementComment(
      accessToken,
      uploaded.id,
      buildYouTubeEngagementComment(account.id, payload),
    );
  }

  const maxBytes = Number(Deno.env.get("YOUTUBE_MAX_UPLOAD_BYTES") ?? String(52_428_800)) || 52_428_800;
  if (video.bytes.byteLength > maxBytes) {
    console.warn(`youtube_upload_large:${video.bytes.byteLength} bytes (source ${video.source})`);
  }

  const coverUrl = payload.media.cover_url || payload.media.og_image;
  if (coverUrl && uploaded.id) {
    try {
      const coverRes = await fetch(coverUrl);
      if (coverRes.ok) {
        const coverBytes = new Uint8Array(await coverRes.arrayBuffer());
        if (coverBytes.byteLength > 1024 && coverBytes.byteLength < 2_097_152) {
          await fetch(
            `https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${encodeURIComponent(uploaded.id)}&uploadType=media`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "image/jpeg",
                "Content-Length": String(coverBytes.byteLength),
              },
              body: coverBytes,
            },
          );
        }
      }
    } catch {
      // thumbnail optional
    }
  }

  return { ...uploaded, account: account.id, ab: uploadMeta.ab };
}

export async function postTelegram(payload: SocialPayload): Promise<{ ok: boolean; id?: string; error?: string }> {
  const token = (Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "").trim();
  const chatId = (Deno.env.get("TELEGRAM_CHANNEL_ID") ?? "").trim();
  if (!token || !chatId) return { ok: false, error: "missing_telegram" };

  const text = payload.captions.telegram;
  const photo = payload.media.cover_url || payload.media.og_image;
  const endpoint = photo
    ? `https://api.telegram.org/bot${token}/sendPhoto`
    : `https://api.telegram.org/bot${token}/sendMessage`;

  const body = photo
    ? { chat_id: chatId, photo, caption: text.slice(0, 1024), parse_mode: "HTML" }
    : { chat_id: chatId, text: text.slice(0, 4096) };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) return { ok: false, error: `telegram_${res.status}` };
  const json = (await res.json()) as { result?: { message_id?: number } };
  return { ok: true, id: json?.result?.message_id != null ? String(json.result.message_id) : undefined };
}

export async function alreadyPosted(db: SupabaseClient, loopId: string, platform: string): Promise<boolean> {
  const { data } = await db
    .from("social_publish_log")
    .select("id")
    .eq("loop_id", loopId)
    .eq("platform", platform)
    .eq("status", "posted")
    .maybeSingle();
  return Boolean(data?.id);
}

export async function logPublish(
  db: SupabaseClient,
  loopId: string,
  platform: string,
  status: "posted" | "failed" | "skipped",
  opts?: { external_id?: string; payload?: unknown; error?: string },
) {
  await db.from("social_publish_log").upsert(
    {
      loop_id: loopId,
      platform,
      status,
      external_id: opts?.external_id ?? null,
      payload: opts?.payload ?? null,
      error: opts?.error ?? null,
      created_at: new Date().toISOString(),
    },
    { onConflict: "loop_id,platform" },
  );
}

export async function fetchLoop(db: SupabaseClient, loopId: string): Promise<SocialLoopRow | null> {
  const { data } = await db
    .from("loops")
    .select("id,name,genre,mood,bpm,key,scale,cover_url,audio_url,user_id,created_at,is_public,stems_url")
    .eq("id", loopId)
    .maybeSingle();
  if (!data?.id || !data.is_public || !data.audio_url) return null;
  return data as SocialLoopRow;
}

export function enabledPlatforms(): string[] {
  const raw = (Deno.env.get("SOCIAL_PUBLISH_PLATFORMS") ?? "webhook,twitter,indexnow,telegram").trim();
  return raw
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
}

export async function publishLoopToPlatforms(
  db: SupabaseClient,
  loop: SocialLoopRow,
): Promise<{ ok: boolean; results: Record<string, unknown> }> {
  const payload = buildSocialPayload(loop);
  const platforms = enabledPlatforms();
  const results: Record<string, unknown> = {};

  for (const platform of platforms) {
    if (await alreadyPosted(db, loop.id, platform)) {
      results[platform] = { skipped: true };
      continue;
    }

    try {
      if (platform === "twitter") {
        const res = await postTwitter(payload.captions.twitter);
        if (res.ok) {
          await logPublish(db, loop.id, platform, "posted", { external_id: res.id, payload: { text: payload.captions.twitter } });
          results[platform] = { ok: true, id: res.id };
        } else {
          await logPublish(db, loop.id, platform, "failed", { error: res.error });
          results[platform] = { ok: false, error: res.error };
        }
        continue;
      }

      if (platform === "webhook") {
        const res = await postWebhook(payload);
        if (res.ok) {
          await logPublish(db, loop.id, platform, "posted", { payload });
          results[platform] = { ok: true };
        } else {
          await logPublish(db, loop.id, platform, "failed", { error: res.error });
          results[platform] = { ok: false, error: res.error };
        }
        continue;
      }

      if (platform === "indexnow") {
        const res = await submitIndexNow(payload.share_urls.web);
        if (res.ok) {
          await logPublish(db, loop.id, platform, "posted", { payload: { url: payload.share_urls.web } });
          results[platform] = { ok: true };
        } else {
          await logPublish(db, loop.id, platform, "failed", { error: res.error });
          results[platform] = { ok: false, error: res.error };
        }
        continue;
      }

      if (platform === "telegram") {
        const res = await postTelegram(payload);
        if (res.ok) {
          await logPublish(db, loop.id, platform, "posted", { external_id: res.id });
          results[platform] = { ok: true, id: res.id };
        } else if (res.error === "missing_telegram") {
          await logPublish(db, loop.id, platform, "skipped", { error: res.error });
          results[platform] = { skipped: true };
        } else {
          await logPublish(db, loop.id, platform, "failed", { error: res.error });
          results[platform] = { ok: false, error: res.error };
        }
        continue;
      }

      if (platform === "reddit") {
        const res = await postReddit(payload);
        if (res.ok) {
          await logPublish(db, loop.id, platform, "posted", { external_id: res.id, payload: { url: payload.share_urls.reddit } });
          results[platform] = { ok: true, id: res.id };
        } else if (res.error === "missing_subreddit" || res.error === "missing_reddit_credentials") {
          await logPublish(db, loop.id, platform, "skipped", { error: res.error });
          results[platform] = { skipped: true };
        } else {
          await logPublish(db, loop.id, platform, "failed", { error: res.error });
          results[platform] = { ok: false, error: res.error };
        }
        continue;
      }

      if (platform === "tiktok") {
        const res = await postTikTok(db, loop, payload);
        if (res.ok) {
          await logPublish(db, loop.id, platform, "posted", {
            external_id: res.id,
            payload: { mode: res.mode ?? Deno.env.get("TIKTOK_POST_MODE") ?? "MEDIA_UPLOAD", viral: payload.viral_meta?.series ?? null },
          });
          results[platform] = { ok: true, id: res.id };
        } else if (res.error === "missing_tiktok_credentials") {
          await logPublish(db, loop.id, platform, "skipped", { error: res.error });
          results[platform] = { skipped: true };
        } else {
          await logPublish(db, loop.id, platform, "failed", { error: res.error });
          results[platform] = { ok: false, error: res.error };
        }
        continue;
      }

      if (platform === "youtube") {
        const throttle = await youtubeThrottleStatus(db);
        if (!throttle.ok) {
          results[platform] = {
            skipped: true,
            throttled: true,
            reason: throttle.reason,
            retryAfterSec: throttle.retryAfterSec,
          };
          continue;
        }

        const res = await postYouTube(db, loop, payload);
        if (res.ok) {
          const uploadMeta = res.account ? youtubeUploadMetadata(payload, res.account) : null;
          await logPublish(db, loop.id, platform, "posted", {
            external_id: res.id,
            payload: {
              url: res.id ? `https://www.youtube.com/watch?v=${res.id}` : null,
              title: uploadMeta?.title ?? payload.name,
              track_kind: payload.track_kind,
              account: res.account ?? "vibez",
              viral: payload.viral_meta?.series ?? null,
              ab_title: res.ab?.titleVariant ?? uploadMeta?.ab.titleVariant ?? null,
              ab_desc: res.ab?.descVariant ?? uploadMeta?.ab.descVariant ?? null,
            },
          });
          if (payload.viral_meta) {
            await db
              .from("viral_content_plans")
              .update({ status: "published", updated_at: new Date().toISOString() })
              .eq("loop_id", loop.id);
          }
          results[platform] = { ok: true, id: res.id, account: res.account };
        } else if (res.error === "missing_youtube_credentials") {
          await logPublish(db, loop.id, platform, "skipped", { error: res.error });
          results[platform] = { skipped: true };
        } else {
          await logPublish(db, loop.id, platform, "failed", { error: res.error });
          results[platform] = { ok: false, error: res.error };
        }
        continue;
      }

      results[platform] = { skipped: true, reason: "unknown_platform" };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "error";
      await logPublish(db, loop.id, platform, "failed", { error: msg });
      results[platform] = { ok: false, error: msg };
    }
  }

  const anyPosted = Object.values(results).some((r) => r && typeof r === "object" && "ok" in r && (r as { ok?: boolean }).ok);
  return { ok: anyPosted || Object.values(results).some((r) => r && typeof r === "object" && "skipped" in r), results };
}
