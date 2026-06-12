import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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
};

export type SocialPayload = {
  event: "public_track_published";
  loop_id: string;
  name: string;
  genre: string;
  mood: string;
  bpm: number | null;
  key: string;
  share_urls: Record<string, string>;
  captions: Record<string, string>;
  media: {
    cover_url: string | null;
    og_image: string;
    audio_url: string | null;
  };
  hashtags: string[];
  published_at: string;
};

const BASE_HASHTAGS = ["#aimusic", "#beatmaker", "#producerhit", "#typebeat"];

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

function genreTag(genre: string): string {
  const g = genre.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
  if (!g || g === "auto" || g === "remix") return "#typebeat";
  return `#${g.slice(0, 24)}`;
}

function moodTags(mood: string): string[] {
  const key = mood.trim().toLowerCase();
  if (key.includes("dream")) return ["#dreamy", "#aesthetic"];
  if (key.includes("dark")) return ["#darktrap", "#moody"];
  if (key.includes("chill") || key.includes("lofi")) return ["#chill", "#lofi"];
  if (key.includes("energy") || key.includes("hype")) return ["#banger", "#hype"];
  return ["#vibes", "#newmusic"];
}

export function buildHashtags(loop: SocialLoopRow): string[] {
  const tags = new Set<string>([
    ...BASE_HASHTAGS,
    genreTag(loop.genre ?? ""),
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
  const hashtags = buildHashtags(loop);
  const tagLine = hashtags.join(" ");
  const listenBase = `New ${genre} track on ProducerHit — "${name}"`;
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
    tiktok: `${name}${bpm ? ` · ${bpm} BPM` : ""}\nProducerHit AI\n${tagLine}\n${share_urls.tiktok}`,
    instagram: `${name}${meta ? `\n${meta}` : ""}\n🎧 ProducerHit\n${tagLine}\n${share_urls.instagram}`,
    facebook: `${listenBase}. Listen: ${share_urls.facebook}`,
    telegram: `${listenBase}${meta ? ` · ${meta}` : ""}\n${share_urls.telegram}`,
    reddit: `[${name}](${share_urls.reddit}) — ${genre}${bpm ? ` ${bpm} BPM` : ""} · AI beat on ProducerHit`,
    youtube: `${name} — ${genre} beat generated with ProducerHit ${share_urls.youtube}`,
  };

  return {
    event: "public_track_published",
    loop_id: loop.id,
    name,
    genre,
    mood,
    bpm,
    key: keyLine,
    share_urls,
    captions,
    media: {
      cover_url: loop.cover_url,
      og_image: `${PRODUCERHIT_SITE}/api/og-loop?id=${encodeURIComponent(loop.id)}`,
      audio_url: loop.audio_url,
    },
    hashtags,
    published_at: loop.created_at ?? new Date().toISOString(),
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
    .select("id,name,genre,mood,bpm,key,scale,cover_url,audio_url,user_id,created_at,is_public")
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
