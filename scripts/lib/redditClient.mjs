/**
 * Client Reddit OAuth — lecture + commentaires (si credentials présents).
 */
const UA = "ProducerHitScout/1.0 (by u/producerhit; contact: hello@producerhit.com)";

let tokenCache = { token: "", expires: 0 };

export function redditUserAgent() {
  return UA;
}

export function hasRedditCredentials(env = process.env) {
  return Boolean(
    env.REDDIT_CLIENT_ID?.trim() &&
      env.REDDIT_CLIENT_SECRET?.trim() &&
      env.REDDIT_REFRESH_TOKEN?.trim(),
  );
}

export async function getRedditAccessToken(env = process.env) {
  const now = Date.now();
  if (tokenCache.token && tokenCache.expires > now + 60_000) return tokenCache.token;

  const clientId = (env.REDDIT_CLIENT_ID ?? "").trim();
  const clientSecret = (env.REDDIT_CLIENT_SECRET ?? "").trim();
  const refreshToken = (env.REDDIT_REFRESH_TOKEN ?? "").trim();
  if (!clientId || !clientSecret || !refreshToken) return null;

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": UA,
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
  });
  if (!res.ok) return null;
  const json = await res.json();
  if (!json.access_token) return null;
  tokenCache = {
    token: json.access_token,
    expires: now + (json.expires_in ?? 3600) * 1000,
  };
  return json.access_token;
}

export async function redditApi(path, { method = "GET", body, token, env = process.env } = {}) {
  const accessToken = token ?? (await getRedditAccessToken(env));
  if (!accessToken) throw new Error("missing_reddit_token");

  const url = path.startsWith("http") ? path : `https://oauth.reddit.com${path.startsWith("/") ? path : `/${path}`}`;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "User-Agent": UA,
  };
  if (body) headers["Content-Type"] = "application/x-www-form-urlencoded";

  const res = await fetch(url, { method, headers, body });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 400) };
  }
  if (!res.ok) {
    const err = new Error(`reddit_${res.status}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

export async function searchSubreddit(subreddit, query, { sort = "new", limit = 15, env = process.env } = {}) {
  const sr = subreddit.replace(/^r\//i, "");
  const q = encodeURIComponent(query);
  const path = `/r/${sr}/search.json?q=${q}&restrict_sr=1&sort=${sort}&limit=${limit}&t=week`;
  const json = await redditApi(path, { env });
  return (json.data?.children ?? []).map((c) => normalizePost(c.data));
}

export async function listSubredditNew(subreddit, { limit = 15, env = process.env } = {}) {
  const sr = subreddit.replace(/^r\//i, "");
  const json = await redditApi(`/r/${sr}/new.json?limit=${limit}`, { env });
  return (json.data?.children ?? []).map((c) => normalizePost(c.data));
}

function normalizePost(d) {
  return {
    id: d.id,
    name: d.name,
    subreddit: d.subreddit,
    title: d.title ?? "",
    selftext: (d.selftext ?? "").slice(0, 500),
    url: d.url ?? "",
    permalink: d.permalink ? `https://www.reddit.com${d.permalink}` : "",
    author: d.author,
    createdUtc: d.created_utc,
    numComments: d.num_comments ?? 0,
    score: d.score ?? 0,
    isSelf: Boolean(d.is_self),
  };
}

export async function postComment(parentFullname, text, env = process.env) {
  const body = new URLSearchParams({
    api_type: "json",
    thing_id: parentFullname.startsWith("t") ? parentFullname : `t3_${parentFullname}`,
    text,
  });
  const json = await redditApi("/api/comment", { method: "POST", body: body.toString(), env });
  const errors = json.json?.errors;
  if (errors?.length) {
    const err = new Error("reddit_comment_rejected");
    err.errors = errors;
    throw err;
  }
  const comment = json.json?.data?.things?.[0]?.data;
  return {
    id: comment?.id,
    permalink: comment?.permalink ? `https://www.reddit.com${comment.permalink}` : undefined,
  };
}

export async function submitLink(subreddit, title, url, env = process.env) {
  const sr = subreddit.replace(/^r\//i, "");
  const body = new URLSearchParams({
    api_type: "json",
    kind: "link",
    sr,
    title: title.slice(0, 300),
    url,
    resubmit: "true",
  });
  const json = await redditApi("/api/submit", { method: "POST", body: body.toString(), env });
  const errors = json.json?.errors;
  if (errors?.length) {
    const err = new Error("reddit_submit_rejected");
    err.errors = errors;
    throw err;
  }
  const post = json.json?.data?.url;
  return { url: post };
}

export function redditSubmitUrl({ subreddit, title, url, selftext }) {
  const u = new URL("https://www.reddit.com/submit");
  if (subreddit) u.searchParams.set("sr", subreddit.replace(/^r\//i, ""));
  if (title) u.searchParams.set("title", title);
  if (selftext) {
    u.searchParams.set("selftext", selftext);
  } else if (url) {
    u.searchParams.set("url", url);
  }
  return u.toString();
}

export function redditSearchUrl(subreddit, query) {
  const u = new URL(`https://www.reddit.com/r/${subreddit.replace(/^r\//i, "")}/search/`);
  u.searchParams.set("q", query);
  u.searchParams.set("restrict_sr", "1");
  u.searchParams.set("sort", "new");
  u.searchParams.set("t", "week");
  return u.toString();
}
