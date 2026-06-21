/**
 * Cron Reddit — scout toutes les 20 min (GitHub / Windows), action seulement si quota OK.
 *
 * Usage :
 *   npm run reddit:cron                    # rapport (dry-run)
 *   npm run reddit:cron -- --run           # scout + max 1 commentaire si quota
 *   npm run reddit:cron -- --run --post    # + post hebdo si jour prévu et quota
 *   npm run reddit:cron -- --status        # quotas restants
 *   npm run reddit:cron -- --open          # ouvre pages manuelles
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  hasRedditCredentials,
  listSubredditNew,
  postComment,
  searchSubreddit,
  submitSelf,
} from "./lib/redditClient.mjs";
import {
  formatQuotaReport,
  getQuotaStatus,
  readQuotaConfig,
  recordComment,
  recordPost,
} from "./lib/redditQuota.mjs";
import { FALLBACK_LOOP, fetchPublicLoops } from "./lib/fetchPublicLoops.mjs";
import {
  draftSubtleComment,
  pickEngagementLoop,
  weeklyDiscussionForDay,
} from "./lib/redditHumanCopy.mjs";
import { SCOUT_SUBS, getScoutSubsForRun, scoreRedditThread } from "./lib/redditScout.mjs";
import {
  formatManualModeMarkdown,
  openManualPlaybook,
} from "./lib/redditManualMode.mjs";

const repoRoot = process.cwd();
const reportsDir = path.join(repoRoot, "reports", "automation");
const stateFile = path.join(reportsDir, "reddit-cron-state.json");

function loadDotEnv() {
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i <= 0) continue;
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (!(k in process.env)) process.env[k] = v;
    }
  }
}

loadDotEnv();

function loadState() {
  if (!existsSync(stateFile)) {
    return {
      repliedIds: [],
      commentDays: [],
      postDays: [],
      lastPostDay: {},
      lastCommentAt: null,
      lastPostAt: null,
      lastRun: null,
      runLog: [],
      scoutBatchIndex: 0,
    };
  }
  try {
    const raw = JSON.parse(readFileSync(stateFile, "utf8"));
    return {
      repliedIds: raw.repliedIds ?? [],
      commentDays: raw.commentDays ?? [],
      postDays: raw.postDays ?? [],
      lastPostDay: raw.lastPostDay ?? {},
      lastCommentAt: raw.lastCommentAt ?? null,
      lastPostAt: raw.lastPostAt ?? null,
      lastRun: raw.lastRun ?? null,
      runLog: raw.runLog ?? [],
      scoutBatchIndex: raw.scoutBatchIndex ?? 0,
    };
  } catch {
    return {
      repliedIds: [],
      commentDays: [],
      postDays: [],
      lastPostDay: {},
      lastCommentAt: null,
      lastPostAt: null,
      lastRun: null,
      runLog: [],
      scoutBatchIndex: 0,
    };
  }
}

function appendRunLog(state, entry) {
  state.runLog = [{ at: new Date().toISOString(), ...entry }, ...(state.runLog ?? [])].slice(0, 48);
}

function saveState(state) {
  mkdirSync(reportsDir, { recursive: true });
  writeFileSync(stateFile, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}



async function scout(state) {
  if (!hasRedditCredentials()) return [];

  const opportunities = [];
  const subs = getScoutSubsForRun(state.scoutBatchIndex ?? 0, 5);
  state.scoutBatchIndex = ((state.scoutBatchIndex ?? 0) + 1) % SCOUT_SUBS.length;

  for (const sr of subs) {
    for (const q of sr.queries) {
      try {
        const posts = await searchSubreddit(sr.name, q, { limit: 8 });
        for (const p of posts) {
          if (state.repliedIds.includes(p.id)) continue;
          const { score, intent } = scoreRedditThread(p);
          if (score >= 3) {
            opportunities.push({ ...p, score, intent, subConfig: sr, matchedQuery: q });
          }
        }
      } catch (e) {
        console.warn(`scout r/${sr.name} "${q}":`, e.message);
      }
    }
    try {
      const recent = await listSubredditNew(sr.name, { limit: 12 });
      for (const p of recent) {
        if (state.repliedIds.includes(p.id)) continue;
        const { score, intent } = scoreRedditThread(p);
        if (score >= 4) {
          opportunities.push({ ...p, score, intent, subConfig: sr, matchedQuery: "new" });
        }
      }
    } catch {
      // ignore
    }
  }

  const byId = new Map();
  for (const o of opportunities) {
    const prev = byId.get(o.id);
    if (!prev || o.score > prev.score) byId.set(o.id, o);
  }
  return [...byId.values()].sort((a, b) => b.score - a.score).slice(0, 10);
}

async function runComments(opportunities, loop, state, dryRun) {
  const quota = getQuotaStatus(state);
  const maxThisRun = readQuotaConfig().maxCommentsPerRun;
  const results = [];

  if (!quota.canComment) {
    return [{ ok: false, skipped: true, reason: quota.commentBlocked.join(", ") || "quota" }];
  }

  const batch = opportunities.slice(0, maxThisRun);
  for (const opp of batch) {
    const text = draftSubtleComment(opp);
    if (dryRun) {
      results.push({ ok: true, dryRun: true, post: opp.title, subreddit: opp.subreddit, text });
      continue;
    }
    try {
      const res = await postComment(opp.name, text);
      state.repliedIds.push(opp.id);
      recordComment(state);
      results.push({ ok: true, post: opp.title, permalink: res.permalink });
      console.log(`✓ Comment r/${opp.subreddit}: ${opp.title.slice(0, 50)}…`);
    } catch (e) {
      results.push({ ok: false, post: opp.title, error: e.message });
      console.warn(`✗ Comment failed:`, e.message);
    }
  }
  return results;
}

async function runWeeklyPost(loop, state, dryRun) {
  const quota = getQuotaStatus(state);
  if (!quota.canPost) {
    return { skipped: true, reason: quota.postBlocked.join(", ") || "quota" };
  }

  const dow = new Date().getUTCDay();
  const scheduled = weeklyDiscussionForDay(dow, loop);
  if (!scheduled) {
    return { skipped: true, reason: "not_scheduled_day", dow };
  }

  const today = new Date().toISOString().slice(0, 10);
  if (state.lastPostDay?.[scheduled.kind] === today) {
    return { skipped: true, reason: "already_posted_today", kind: scheduled.kind };
  }

  if (dryRun) {
    return {
      dryRun: true,
      kind: scheduled.kind,
      subreddit: scheduled.subreddit,
      title: scheduled.title,
      selftext: scheduled.selftext?.slice(0, 200) + "...",
    };
  }

  const res = await submitSelf(scheduled.subreddit, scheduled.title, scheduled.selftext);
  recordPost(state, scheduled.kind);
  return { ok: true, kind: scheduled.kind, subreddit: scheduled.subreddit, url: res.url, title: scheduled.title };
}

function buildReport({ loop, opportunities, commentResults, postResult, dryRun, quota }) {
  const today = new Date().toISOString().slice(0, 10);
  const oauth = hasRedditCredentials();
  let md = `# Reddit cron — ${today}${dryRun ? " (dry-run)" : ""}

| | |
|--|--|
| OAuth | ${oauth ? "✅" : "❌ \`npm run reddit:oauth -- --open\`"} |
| Intervalle | ${quota.config.cronIntervalMinutes} min (scout ; 1 action max si quota) |
| Commentaires aujourd'hui | ${quota.commentsToday} / ${quota.config.maxCommentsPerDay} |
| Posts aujourd'hui | ${quota.postsToday} / ${quota.config.maxPostsPerDay} |
| Posts cette semaine | ${quota.postsWeek} / ${quota.config.maxPostsPerWeek} |
| Peut commenter | ${quota.canComment ? "✅" : "⏸ " + quota.commentBlocked.join(", ")} |
| Peut poster | ${quota.canPost ? "✅" : "⏸ " + quota.postBlocked.join(", ")} |
| Threads scoutés | ${opportunities.length} |
| Commentaires ce run | ${commentResults.filter((r) => r.ok && !r.dryRun).length} |
| Post hebdo | ${postResult?.ok ? "✅ " + postResult.kind : postResult?.skipped ? "⏭ " + (postResult.reason ?? "") : "—"} |

## Quotas

\`\`\`
${formatQuotaReport(quota)}
\`\`\`

## Calendrier posts (UTC)

| Jour | Action |
|------|--------|
| Lundi | r/aiMusic — beats + **mode chanson** (discussion) |
| Mercredi | Rotation : SideProject / **r/Songwriting** / WATMM |
| Vendredi | Rotation : alphaandbetausers / **r/musicproduction** / r/composer |
| Scout | 5 subs/run en rotation (${SCOUT_SUBS.length} subs : prod, songwriting, AI, DAW) |
| Manuel | r/Typebeats [FREE] beat — hors cron |

## Threads repérés

`;
  for (const [i, o] of opportunities.entries()) {
    md += `### ${i + 1}. r/${o.subreddit} — ${o.title}

- Score ${o.score} · [thread](${o.permalink})
- Brouillon:

\`\`\`
${draftSubtleComment(o)}
\`\`\`

`;
  }

  if (commentResults.length) {
    md += `\n## Résultats commentaires\n\n${commentResults.map((r) => `- ${r.ok ? "✅" : "❌"} ${r.post?.slice(0, 60) ?? ""} ${r.permalink ?? r.error ?? "(dry-run)"}`).join("\n")}\n`;
  }

  if (postResult && !postResult.skipped) {
    md += `\n## Post hebdo\n\n\`\`\`json\n${JSON.stringify(postResult, null, 2)}\n\`\`\`\n`;
  }

  if (!oauth) {
    md += `\n${formatManualModeMarkdown(loop)}\n`;
  }

  return md;
}

function openManual(loop) {
  openManualPlaybook(loop);
}

async function main() {
  mkdirSync(reportsDir, { recursive: true });
  const args = process.argv.slice(2);
  const dryRun = !args.includes("--run");
  const doPost = args.includes("--post");
  const shouldOpen = args.includes("--open");

  const state = loadState();
  const quota = getQuotaStatus(state);

  if (args.includes("--status")) {
    console.log(formatQuotaReport(quota));
    console.log(`OAuth: ${hasRedditCredentials() ? "configured" : "missing"}`);
    console.log(`State: ${stateFile}`);
    process.exit(0);
  }

  const loops = await fetchPublicLoops(10);
  const loop = pickEngagementLoop(loops.length ? loops : [FALLBACK_LOOP]);

  const opportunities = await scout(state);
  let commentResults = [];
  let postResult = { skipped: true, reason: "not_requested" };

  if (args.includes("--run") && hasRedditCredentials()) {
    commentResults = await runComments(opportunities, loop, state, false);
    if (doPost) {
      postResult = await runWeeklyPost(loop, state, false);
    }
    appendRunLog(state, {
      mode: "run",
      comments: commentResults.filter((r) => r.ok && !r.dryRun).length,
      post: postResult?.ok ? postResult.kind : postResult?.reason ?? null,
      quota: {
        commentsToday: getQuotaStatus(state).commentsToday,
        postsToday: getQuotaStatus(state).postsToday,
      },
    });
    saveState(state);
  } else if (dryRun) {
    commentResults = await runComments(opportunities.slice(0, 1), loop, state, true);
    if (doPost) postResult = await runWeeklyPost(loop, state, true);
  }

  const quotaAfter = getQuotaStatus(state);
  const md = buildReport({
    loop,
    opportunities,
    commentResults,
    postResult,
    dryRun,
    quota: quotaAfter,
  });
  const out = path.join(reportsDir, `reddit-cron-${new Date().toISOString().slice(0, 10)}.md`);
  writeFileSync(out, md, "utf8");

  state.lastRun = new Date().toISOString();
  saveState(state);

  console.log(`✓ ${out}`);
  console.log(`  OAuth: ${hasRedditCredentials() ? "oui" : "non"} · mode: ${dryRun ? "dry-run" : "RUN"}`);
  console.log(`  Scout: ${opportunities.length} · Quota comments: ${quotaAfter.commentsToday}/${quotaAfter.config.maxCommentsPerDay}`);
  console.log(`  ${formatQuotaReport(quotaAfter).split("\n").join("\n  ")}`);

  if (!hasRedditCredentials() && !shouldOpen) {
    console.log("  → Mode manuel : npm run reddit:manual  (ouvre Reddit dans ton navigateur connecté)");
  }

  if (shouldOpen) openManual(loop);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
