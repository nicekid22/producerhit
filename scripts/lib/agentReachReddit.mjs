/**
 * Scout Reddit via Agent Reach — OpenCLI (browser) + Exa/mcporter — sans OAuth.
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { SCOUT_SUBS, getScoutSubsForRun } from "./redditScout.mjs";

const REDDIT_THREAD_RE =
  /reddit\.com\/r\/([^/]+)\/comments\/([a-z0-9]+)(?:\/([^/?#]*))?/i;

function resolveMcporterCmd(env = process.env) {
  if (env.MCPORTER?.trim()) return env.MCPORTER.trim();
  const win = path.join(env.APPDATA ?? "", "npm", "mcporter.cmd");
  if (process.platform === "win32" && existsSync(win)) return win;
  return "mcporter";
}

function runShell(cmd, options = {}) {
  return execSync(cmd, {
    encoding: "utf8",
    shell: true,
    maxBuffer: 10 * 1024 * 1024,
    timeout: options.timeout ?? 120_000,
    cwd: options.cwd ?? envHome(options.env),
    env: options.env ?? process.env,
  });
}

function envHome(env = process.env) {
  return env.HOME ?? env.USERPROFILE ?? process.cwd();
}

export function parseRedditThreadUrl(url) {
  const clean = String(url ?? "")
    .replace(/\.json(\?.*)?$/i, "")
    .split("?")[0]
    .trim();
  const m = clean.match(REDDIT_THREAD_RE);
  if (!m) return null;
  const [, subreddit, id, slug] = m;
  const permalink = `https://www.reddit.com/r/${subreddit}/comments/${id}/${slug ?? ""}`.replace(/\/$/, "");
  return { subreddit, id, slug: slug ?? "", permalink };
}

function titleFromSlug(slug) {
  if (!slug) return "";
  return slug
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function parseExaMcporterOutput(text) {
  const blocks = String(text)
    .split(/\n---\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  const results = [];
  for (const block of blocks) {
    const url = block.match(/^URL:\s*(.+)$/m)?.[1]?.trim();
    if (!url) continue;
    const parsed = parseRedditThreadUrl(url);
    if (!parsed) continue;

    const titleLine = block.match(/^Title:\s*(.+)$/m)?.[1]?.trim() ?? "";
    const highlights = block.match(/^Highlights:\s*\n([\s\S]*)$/m)?.[1]?.trim() ?? "";
    const heading = highlights.match(/^#\s+(.+)$/m)?.[1]?.trim();
    const title =
      (heading && !/^Reddit - The heart/i.test(heading) ? heading : null) ??
      (titleLine && !/^Reddit - The heart/i.test(titleLine) ? titleLine : null) ??
      titleFromSlug(parsed.slug);

    const published = block.match(/^Published:\s*(.+)$/m)?.[1]?.trim();
    const author = block.match(/^Author:\s*(.+)$/m)?.[1]?.trim();

    results.push({
      id: parsed.id,
      name: `t3_${parsed.id}`,
      subreddit: parsed.subreddit,
      title,
      selftext: highlights.slice(0, 800),
      url: parsed.permalink,
      permalink: parsed.permalink,
      author: author && author !== "N/A" ? author : undefined,
      published,
      numComments: null,
      score: null,
      isSelf: true,
      source: "exa",
    });
  }
  return results;
}

function parseOpenCliJson(raw) {
  const text = String(raw).trim();
  const jsonStart = text.indexOf("{");
  if (jsonStart < 0) return null;
  try {
    return JSON.parse(text.slice(jsonStart));
  } catch {
    return null;
  }
}

function normalizeOpenCliPost(item, subredditFallback) {
  const url = item.url ?? item.permalink ?? item.link ?? "";
  const parsed = parseRedditThreadUrl(url.startsWith("http") ? url : `https://www.reddit.com${url}`);
  const id = item.id ?? parsed?.id ?? item.postId ?? item.name?.replace(/^t3_/, "");
  if (!id) return null;

  const subreddit = (item.subreddit ?? item.sub ?? parsed?.subreddit ?? subredditFallback ?? "")
    .toString()
    .replace(/^r\//i, "");

  const permalink =
    parsed?.permalink ??
    (item.permalink?.startsWith("http")
      ? item.permalink
      : item.permalink
        ? `https://www.reddit.com${item.permalink}`
        : `https://www.reddit.com/r/${subreddit}/comments/${id}/`);

  return {
    id,
    name: item.name ?? `t3_${id}`,
    subreddit,
    title: item.title ?? item.headline ?? titleFromSlug(parsed?.slug ?? ""),
    selftext: (item.selftext ?? item.text ?? item.body ?? "").slice(0, 800),
    url: permalink,
    permalink,
    author: item.author ?? item.username,
    numComments: item.numComments ?? item.comments ?? item.num_comments ?? null,
    score: item.score ?? item.upvotes ?? item.points ?? null,
    isSelf: item.isSelf ?? item.is_self ?? true,
    source: "opencli",
  };
}

function extractOpenCliPosts(payload, subredditFallback) {
  if (!payload || payload.ok === false) return [];
  const rows =
    payload.data ??
    payload.posts ??
    payload.items ??
    payload.results ??
    (Array.isArray(payload) ? payload : null);
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => normalizeOpenCliPost(row, subredditFallback)).filter(Boolean);
}

export async function getAgentReachRedditStatus(env = process.env) {
  const status = {
    opencli: { ok: false, reason: "unknown" },
    exa: { ok: false, reason: "unknown" },
    mcporter: resolveMcporterCmd(env),
  };

  try {
    const raw = runShell("opencli reddit whoami -f json 2>&1", { env });
    const json = parseOpenCliJson(raw);
    if (json?.error?.code === "BROWSER_CONNECT" || /extension not connected/i.test(raw)) {
      status.opencli = { ok: false, reason: "extension_not_connected" };
    } else if (json?.ok === false) {
      status.opencli = { ok: false, reason: json.error?.code ?? "opencli_error" };
    } else {
      status.opencli = {
        ok: true,
        user: json?.data?.username ?? json?.username ?? json?.name ?? null,
      };
    }
  } catch (e) {
    status.opencli = { ok: false, reason: e.message?.slice(0, 120) ?? "opencli_unavailable" };
  }

  try {
    const args = JSON.stringify({
      query: "reddit ai music",
      numResults: 1,
      includeDomains: ["reddit.com"],
    });
    const cmd = `${JSON.stringify(status.mcporter)} call exa.web_search_exa --args ${JSON.stringify(args)}`;
    runShell(cmd, { env, timeout: 90_000 });
    status.exa = { ok: true };
  } catch (e) {
    status.exa = { ok: false, reason: e.message?.slice(0, 120) ?? "exa_unavailable" };
  }

  return status;
}

export async function scoutViaExa(subs, { limitPerQuery = 4, env = process.env } = {}) {
  const mcporter = resolveMcporterCmd(env);
  const posts = [];
  const seen = new Set();

  for (const sr of subs) {
    for (const q of sr.queries.slice(0, 2)) {
      const args = JSON.stringify({
        query: `site:reddit.com/r/${sr.name} ${q}`,
        numResults: limitPerQuery,
        includeDomains: ["reddit.com"],
      });
      const cmd = `${JSON.stringify(mcporter)} call exa.web_search_exa --args ${JSON.stringify(args)}`;
      try {
        const out = runShell(cmd, { env, timeout: 90_000 });
        for (const p of parseExaMcporterOutput(out)) {
          if (seen.has(p.id)) continue;
          seen.add(p.id);
          posts.push({ ...p, matchedQuery: q, scoutSub: sr.name });
        }
      } catch (e) {
        console.warn(`[agent-reach/exa] r/${sr.name} "${q}":`, e.message?.split("\n")[0] ?? e.message);
      }
    }
  }

  return posts;
}

export async function scoutViaOpenCli(subs, { limitPerSub = 10, env = process.env } = {}) {
  const posts = [];
  const seen = new Set();

  for (const sr of subs) {
    const srName = sr.name.replace(/^r\//i, "");
    try {
      const cmd = `opencli reddit subreddit ${JSON.stringify(srName)} -f json --limit ${limitPerSub}`;
      const raw = runShell(cmd, { env, timeout: 90_000 });
      const json = parseOpenCliJson(raw);
      if (json?.error?.code === "BROWSER_CONNECT") break;
      for (const p of extractOpenCliPosts(json, srName)) {
        if (seen.has(p.id)) continue;
        seen.add(p.id);
        posts.push({ ...p, matchedQuery: "subreddit", scoutSub: srName });
      }
    } catch (e) {
      console.warn(`[agent-reach/opencli] r/${srName}:`, e.message?.split("\n")[0] ?? e.message);
    }

    for (const q of sr.queries.slice(0, 1)) {
      try {
        const cmd = `opencli reddit search ${JSON.stringify(`${q} subreddit:${srName}`)} -f json --limit 6`;
        const raw = runShell(cmd, { env, timeout: 90_000 });
        const json = parseOpenCliJson(raw);
        if (json?.error?.code === "BROWSER_CONNECT") break;
        for (const p of extractOpenCliPosts(json, srName)) {
          if (seen.has(p.id)) continue;
          seen.add(p.id);
          posts.push({ ...p, matchedQuery: q, scoutSub: srName });
        }
      } catch (e) {
        console.warn(`[agent-reach/opencli] search r/${srName} "${q}":`, e.message?.split("\n")[0] ?? e.message);
      }
    }
  }

  return posts;
}

/**
 * Scout threads via Agent Reach backends, scored and sorted.
 * @param {{ scoutBatchIndex?: number }} state
 * @param {(post: object) => { score: number, intent: string }} scoreFn
 */
export async function scoutWithAgentReach(state, scoreFn, { env = process.env } = {}) {
  const batchIndex = state.scoutBatchIndex ?? 0;
  const subs = getScoutSubsForRun(batchIndex, 6);

  const status = await getAgentReachRedditStatus(env);
  const rawPosts = [];

  if (status.opencli.ok) {
    rawPosts.push(...(await scoutViaOpenCli(subs, { env })));
  }

  if (status.exa.ok) {
    rawPosts.push(...(await scoutViaExa(subs, { env })));
  }

  const byId = new Map();
  for (const p of rawPosts) {
    const { score, intent } = scoreFn(p);
    const opp = { ...p, score, intent };
    const prev = byId.get(p.id);
    if (!prev || opp.score > prev.score) byId.set(p.id, opp);
  }

  const opportunities = [...byId.values()]
    .filter((o) => o.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  return { opportunities, status, subsScouted: subs.map((s) => s.name) };
}
