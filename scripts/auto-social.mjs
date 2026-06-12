import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const repoRoot = process.cwd();
const publicDir = path.join(repoRoot, "public");
const blogFile = path.join(repoRoot, "src", "content", "blog.ts");
const draftsFile = path.join(publicDir, "social-drafts.json");

const ORIGIN = "https://www.producerhit.com";

function encodeRFC3986(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

function oauth1Header(method, url, creds, extraParams = {}) {
  const oauth = {
    oauth_consumer_key: creds.consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
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
  const signature = crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");
  oauth.oauth_signature = signature;
  return (
    "OAuth " +
    Object.keys(oauth)
      .sort()
      .map((k) => `${encodeRFC3986(k)}="${encodeRFC3986(String(oauth[k]))}"`)
      .join(", ")
  );
}

async function fetchLatestPublicLoop() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const endpoint = `${url.replace(/\/$/, "")}/rest/v1/loops?select=id,name,genre,mood&is_public=eq.true&order=created_at.desc&limit=1`;
  const res = await fetch(endpoint, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) return null;
  const rows = await res.json();
  return Array.isArray(rows) && rows[0]?.id ? rows[0] : null;
}

async function parseLatestBlogPost() {
  const src = await fs.readFile(blogFile, "utf8");
  const slugMatch = src.match(/slug:\s*"([^"]+)"/);
  const titleMatch = src.match(/title:\s*`([^`]+)`/);
  if (!slugMatch) return null;
  return { slug: slugMatch[1], title: titleMatch?.[1] ?? slugMatch[1] };
}

function buildPosts(loop, blog) {
  const posts = [];
  if (loop?.id) {
    const trackUrl = `${ORIGIN}/loop/${encodeURIComponent(loop.id)}?utm_source=twitter&utm_medium=social&utm_campaign=auto_loop`;
    const redditUrl = `${ORIGIN}/loop/${encodeURIComponent(loop.id)}?utm_source=reddit&utm_medium=social&utm_campaign=auto_loop`;
    posts.push({
      id: `loop-${loop.id}`,
      platform: "twitter",
      text: `New ${loop.genre ?? "AI"} track on ProducerHit — "${loop.name ?? "Untitled"}". Listen: ${trackUrl}`,
      url: trackUrl,
    });
    posts.push({
      id: `loop-reddit-${loop.id}`,
      platform: "reddit",
      title: `${loop.name ?? "Untitled"} — ${loop.genre ?? "AI"} beat on ProducerHit`,
      url: redditUrl,
      text: redditUrl,
    });
  }
  if (blog?.slug) {
    const blogUrl = `${ORIGIN}/blog/${encodeURIComponent(blog.slug)}?utm_source=twitter&utm_medium=social&utm_campaign=auto_blog`;
    const redditBlogUrl = `${ORIGIN}/blog/${encodeURIComponent(blog.slug)}?utm_source=reddit&utm_medium=social&utm_campaign=auto_blog`;
    posts.push({
      id: `blog-${blog.slug}`,
      platform: "twitter",
      text: `${blog.title} — read on ProducerHit: ${blogUrl}`,
      url: blogUrl,
    });
    posts.push({
      id: `blog-reddit-${blog.slug}`,
      platform: "reddit",
      title: `${blog.title} — ProducerHit`,
      url: redditBlogUrl,
      text: redditBlogUrl,
    });
  }
  posts.push({
    id: "signup-cta",
    platform: "twitter",
    text: `Generate AI beats & songs in seconds — free tier on ProducerHit: ${ORIGIN}/?utm_source=twitter&utm_medium=social&utm_campaign=auto_cta`,
    url: `${ORIGIN}/?utm_source=twitter&utm_medium=social&utm_campaign=auto_cta`,
  });
  return posts;
}

async function postTwitter(text) {
  const creds = {
    consumerKey: process.env.TWITTER_API_KEY,
    consumerSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  };
  if (!creds.consumerKey || !creds.consumerSecret || !creds.accessToken || !creds.accessTokenSecret) {
    return { ok: false, reason: "missing_twitter_credentials" };
  }

  const apiUrl = "https://api.twitter.com/2/tweets";
  const authHeader = oauth1Header("POST", apiUrl, creds);
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: text.slice(0, 280) }),
  });
  if (!res.ok) {
    const body = await res.text();
    return { ok: false, reason: `twitter_${res.status}`, body };
  }
  return { ok: true };
}

async function postWebhook(payload) {
  const url = process.env.SOCIAL_WEBHOOK_URL;
  if (!url) return { ok: false, reason: "missing_webhook" };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    return { ok: false, reason: `webhook_${res.status}` };
  }
  return { ok: true };
}

async function postReddit(post) {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  const refreshToken = process.env.REDDIT_REFRESH_TOKEN;
  const subreddit = (process.env.REDDIT_SUBREDDIT ?? "").replace(/^r\//i, "");
  if (!clientId || !clientSecret || !refreshToken || !subreddit) {
    return { ok: false, reason: "missing_reddit_credentials" };
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const tokenRes = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "ProducerHitBot/1.0 (by u/producerhit)",
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
  });
  if (!tokenRes.ok) {
    return { ok: false, reason: `reddit_token_${tokenRes.status}` };
  }
  const tokenJson = await tokenRes.json();
  const accessToken = tokenJson.access_token;
  if (!accessToken) return { ok: false, reason: "reddit_no_token" };

  const body = new URLSearchParams({
    kind: "link",
    sr: subreddit,
    title: String(post.title ?? post.text ?? "ProducerHit").slice(0, 300),
    url: post.url,
    resubmit: "false",
  });

  const res = await fetch("https://oauth.reddit.com/api/submit", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "ProducerHitBot/1.0 (by u/producerhit)",
    },
    body,
  });
  if (!res.ok) {
    return { ok: false, reason: `reddit_${res.status}`, body: await res.text() };
  }
  const json = await res.json();
  if (json?.json?.errors?.length) {
    return { ok: false, reason: "reddit_api", errors: json.json.errors };
  }
  return { ok: true, id: json?.json?.data?.id ?? json?.json?.data?.url };
}

async function main() {
  const loop = await fetchLatestPublicLoop();
  const blog = await parseLatestBlogPost();
  const posts = buildPosts(loop, blog);

  await fs.writeFile(
    draftsFile,
    JSON.stringify({ generatedAt: new Date().toISOString(), loop, blog, posts }, null, 2),
    "utf8",
  );

  if (!posts.length) {
    console.log("auto-social: no posts generated");
    return;
  }

  const pick = posts.find((p) => p.platform === "twitter") ?? posts[0];
  const redditPick = posts.find((p) => p.platform === "reddit");

  const webhookResult = await postWebhook({ source: "producerhit-auto-social", post: pick, all: posts });
  const twitterResult = await postTwitter(pick.text);
  const redditResult = redditPick ? await postReddit(redditPick) : { ok: false, reason: "no_reddit_post" };

  console.log(
    JSON.stringify({
      draft: draftsFile,
      picked: pick.id,
      webhook: webhookResult,
      twitter: twitterResult,
      reddit: redditResult,
    }),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
