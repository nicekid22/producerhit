/**
 * Agent Reddit ProducerHit — scout threads, brouillons de réponses, posts assistés.
 *
 * Mode manuel (sans API) : génère le rapport + ouvre Reddit dans ton navigateur (session connectée).
 * Mode auto (avec REDDIT_* OAuth) : scout + option --post-comments (max 3/jour, anti-spam).
 *
 * Usage :
 *   npm run reddit:agent
 *   npm run reddit:agent -- --open
 *   npm run reddit:agent -- scout
 *   npm run reddit:agent -- scout --post-comments   # OAuth requis
 *   npm run reddit:agent -- post r/Typebeats
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  hasRedditCredentials,
  listSubredditNew,
  postComment,
  redditSearchUrl,
  redditSubmitUrl,
  searchSubreddit,
} from "./lib/redditClient.mjs";
import {
  draftSubtleComment,
  mhhCommentVariants,
  pickAgentDiscussionPost,
  pickEngagementLoop,
  typebeatsPost,
} from "./lib/redditHumanCopy.mjs";
import { SCOUT_SUBS, getScoutSubsForRun, scoreRedditThread } from "./lib/redditScout.mjs";
import { fetchPublicLoops } from "./lib/fetchPublicLoops.mjs";

const SITE = "https://www.producerhit.com";
const repoRoot = process.cwd();
const reportsDir = path.join(repoRoot, "reports", "automation");
const stateFile = path.join(reportsDir, "reddit-agent-state.json");

/** Subs commentaires — importe la liste complete (prod, songwriting, AI, DAW). */
const COMMENT_SUBREDDITS = SCOUT_SUBS.map((s) => ({
  name: s.name,
  label: `r/${s.name}`,
  ruleNote:
    s.category === "song"
      ? "Songwriting / voix — mode chanson, pas type beat"
      : s.category === "beats"
        ? "Beats — commentaires only si Rule 3"
        : "Discussion workflow — reponses subtiles",
  noBeatLinks: s.noBeatLinks,
}));

const SUBREDDITS = COMMENT_SUBREDDITS;

const SEARCH_QUERIES = [
  "make money",
  "monetize",
  "ai song",
  "song mode",
  "lyrics",
  "melody",
  "writer's block",
  "type beat",
  "ai beat",
  "suno",
  "workflow",
  "vocals",
  "home studio",
];

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
    return { repliedIds: [], postedDays: [], lastRun: null, scoutBatchIndex: 0 };
  }
  try {
    const raw = JSON.parse(readFileSync(stateFile, "utf8"));
    return {
      repliedIds: raw.repliedIds ?? [],
      postedDays: raw.postedDays ?? [],
      lastRun: raw.lastRun ?? null,
      scoutBatchIndex: raw.scoutBatchIndex ?? 0,
    };
  } catch {
    return { repliedIds: [], postedDays: [], lastRun: null, scoutBatchIndex: 0 };
  }
}

function saveState(state) {
  mkdirSync(reportsDir, { recursive: true });
  writeFileSync(stateFile, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function utm(pathname, campaign) {
  const u = new URL(pathname.startsWith("http") ? pathname : `${SITE}${pathname}`);
  u.searchParams.set("utm_source", "reddit");
  u.searchParams.set("utm_medium", "social");
  u.searchParams.set("utm_campaign", campaign);
  return u.toString();
}


function loopUrl(loop) {
  return `${SITE}/loop/${encodeURIComponent(loop.id)}?utm_source=reddit&utm_medium=social&utm_campaign=agent_reply`;
}

function scorePost(post) {
  return scoreRedditThread(post);
}

function draftReply(post, _loop, intent) {
  return draftSubtleComment({ ...post, intent: intent ?? post.intent });
}

/** r/makinghiphop etc. — pas de lien beat (Rule 3 + anti-spam). */
function draftCommentNoBeat(_post, intent) {
  const variants = mhhCommentVariants();
  const byIntent = {
    ai_compare: variants[0],
    type_beat: variants[1],
    workflow: variants[2],
    help: variants[3],
    genre: variants[2],
    generic: variants[3],
  };
  return byIntent[intent]?.text ?? variants[3].text;
}

function pickLoopForReddit(loops) {
  return pickEngagementLoop(loops);
}

function buildOwnPost(loop) {
  const discussion = pickAgentDiscussionPost(loop);
  return {
    ...discussion,
    url: null,
    body: discussion.selftext,
    forbiddenSubs: ["makinghiphop", "Typebeats"],
    beatPostOptional: typebeatsPost(loop),
  };
}

function openUrls(urls) {
  for (const url of urls) {
    if (process.platform === "win32") {
      execFileSync("powershell", ["-NoProfile", "-Command", `Start-Process ${JSON.stringify(url)}`], {
        stdio: "ignore",
      });
    } else {
      execFileSync("open", [url], { stdio: "ignore" });
    }
  }
}

async function scoutThreads(state) {
  const opportunities = [];
  const hasOAuth = hasRedditCredentials();

  if (hasOAuth) {
    const subs = getScoutSubsForRun(state.scoutBatchIndex ?? 0, 6);
    state.scoutBatchIndex = ((state.scoutBatchIndex ?? 0) + 1) % SCOUT_SUBS.length;

    for (const sr of subs) {
      for (const q of sr.queries.slice(0, 3)) {
        try {
          const posts = await searchSubreddit(sr.name, q, { limit: 8 });
          for (const p of posts) {
            if (state.repliedIds.includes(p.id)) continue;
            const { score, intent } = scorePost(p);
            if (score >= 3) opportunities.push({ ...p, score, intent, matchedQuery: q });
          }
        } catch (e) {
          console.warn(`scout ${sr.name} "${q}":`, e.message);
        }
      }
      try {
        const recent = await listSubredditNew(sr.name, { limit: 12 });
        for (const p of recent) {
          if (state.repliedIds.includes(p.id)) continue;
          const { score, intent } = scorePost(p);
          if (score >= 4) opportunities.push({ ...p, score, intent, matchedQuery: "new" });
        }
      } catch {
        // ignore
      }
    }
  }

  const byId = new Map();
  for (const o of opportunities) {
    const prev = byId.get(o.id);
    if (!prev || o.score > prev.score) byId.set(o.id, o);
  }
  return [...byId.values()].sort((a, b) => b.score - a.score).slice(0, 8);
}

function manualScoutLinks() {
  const byCategory = { song: [], beats: [], production: [], ai: [] };
  for (const sr of SCOUT_SUBS) {
    const cat = sr.category in byCategory ? sr.category : "production";
    if (byCategory[cat].length < 6) byCategory[cat].push(sr);
  }
  const picked = [...byCategory.ai, ...byCategory.song, ...byCategory.beats, ...byCategory.production].slice(
    0,
    12,
  );
  return picked.flatMap((sr) =>
    sr.queries.slice(0, 2).map((q) => ({
      subreddit: `r/${sr.name}`,
      category: sr.category,
      query: q,
      url: redditSearchUrl(sr.name, q),
    })),
  );
}

async function postCommentsOpportunities(opportunities, loops, state) {
  const today = new Date().toISOString().slice(0, 10);
  const postedToday = state.postedDays.filter((d) => d === today).length;
  const maxToday = Number(process.env.REDDIT_MAX_COMMENTS_PER_DAY ?? "3");
  if (postedToday >= maxToday) {
    console.log(`Limite ${maxToday} commentaires/jour atteinte — mode manuel recommandé.`);
    return [];
  }

  const results = [];
  const loop = pickLoopForReddit(loops) ?? loops[0] ?? { id: "demo", name: "Type Beat", genre: "Trap" };

  for (const opp of opportunities.slice(0, maxToday - postedToday)) {
    const text = draftReply(opp, loop, opp.intent);
    try {
      const res = await postComment(opp.name, text);
      state.repliedIds.push(opp.id);
      state.postedDays.push(today);
      results.push({ ok: true, post: opp.title, permalink: res.permalink });
      console.log(`✓ Commentaire posté: ${opp.title.slice(0, 60)}…`);
      await new Promise((r) => setTimeout(r, 45_000));
    } catch (e) {
      results.push({ ok: false, post: opp.title, error: e.message, errors: e.errors });
      console.warn(`✗ Échec commentaire:`, e.message);
    }
  }
  return results;
}

function buildReport({ loops, opportunities, ownPost, manualLinks, autoResults }) {
  const today = new Date().toISOString().slice(0, 10);
  const loop = pickLoopForReddit(loops) ?? loops[0] ?? { id: "demo", name: "Type Beat", genre: "Trap" };
  const hasOAuth = hasRedditCredentials();
  const mhhSearch = redditSearchUrl("makinghiphop", "type beat generator");

  let md = `# Reddit agent — ${today}

> \`npm run reddit:agent -- --open\` ouvre les pages dans **ton** navigateur Reddit (session connectée).

## ⚠️ r/makinghiphop — Rule 3

**Ne poste pas de beat / single / lien loop en thread principal** sur r/makinghiphop.
Utilise ce sub pour **commenter** (conseils workflow, comparaison Suno, FL tips) — pas pour publier un beat.

| Sub | Beat en post | Commentaires |
|-----|--------------|--------------|
| r/makinghiphop | ❌ Rule 3 | ✅ questions prod / AI / workflow |
| r/Typebeats | ✅ [FREE] type beat | ✅ |
| r/WeAreTheMusicMakers | ❌ sauf feedback thread | ✅ |

## Subs actifs (rotation)

${SCOUT_SUBS.map((s) => `- r/${s.name} (${s.category})`).join("\n")}

---

## Mode aujourd'hui

| Mode | Statut |
|------|--------|
| OAuth Reddit (auto comment/post) | ${hasOAuth ? "✅ configuré" : "❌ — \`npm run reddit:oauth -- --open\` ou posts manuels"} |
| Threads repérés (API) | ${opportunities.length} |
| Commentaires auto postés | ${autoResults?.filter((r) => r.ok).length ?? 0} |

---

## 1. Post discussion → ${ownPost.subLabel}

**${ownPost.subNote}**

**Titre:**
\`\`\`
${ownPost.title}
\`\`\`

**Corps (self-post — pas de lien beat):**
\`\`\`
${ownPost.selftext}
\`\`\`

**Ouvrir compose:** ${redditSubmitUrl({ subreddit: ownPost.subreddit, title: ownPost.title, selftext: ownPost.selftext })}

**Commentaire #1 — apres publish (lien seulement si on demande):**
\`\`\`
${ownPost.firstComment ?? "repondre aux questions en commentaire — pas de spam lien"}
\`\`\`

_${ownPost.timing ?? ""}_

_Option manuelle beat (hors auto): r/Typebeats — \`${ownPost.beatPostOptional?.title ?? "voir typebeatsPost"}\`_

💡 Launch pack complet: \`npm run reddit:launch -- --open\`

---

## 2. r/aiMusic + r/makinghiphop — commenter (discussions monétisation, workflow)

**Exemple thread prioritaire** — [Does anyone actually make money from AI generated...](https://www.reddit.com/r/aiMusic/comments/1u9y2i0/does_anyone_actually_make_money_from_ai_generated/)

Reponse **subtile** (copier-coller, pas de lien) :

\`\`\`
${draftSubtleComment({ intent: "monetization", subreddit: "aiMusic", title: "Does anyone actually make money from ai generated" })}
\`\`\`

r/makinghiphop — [recherche](${mhhSearch}) — meme ton, pas de beat link :

\`\`\`
${draftCommentNoBeat({ subreddit: "makinghiphop" }, "ai_compare")}
\`\`\`

---

## 3. Autres discussions (commentaires)

`;

  if (opportunities.length) {
    for (const [i, opp] of opportunities.entries()) {
      const reply = draftReply(opp, loop, opp.intent);
      md += `### ${i + 1}. ${opp.title}

- **Sub:** r/${opp.subreddit} · score ${opp.score} · intent \`${opp.intent}\`
- **Thread:** ${opp.permalink}
- **Réponse (copier-coller):**

\`\`\`
${reply}
\`\`\`

`;
    }
  } else {
    md += `Pas de threads via API (OAuth absent ou quota). Ouvre ces recherches et réponds **à la main** (max 3–5/jour) :

`;
    for (const link of manualLinks.slice(0, 14)) {
      md += `- [${link.subreddit} · ${link.category} · "${link.query}"](${link.url})\n`;
    }
    md += "\n";
  }

  md += `---

## 4. Regles anti-ban Reddit

1. **Posts auto** = discussion / questions — jamais [FREE] beat en cron
2. **r/makinghiphop** : jamais de post beat (Rule 3) — commentaires conseil only
3. **Max 3–5 interactions/jour** sur des subs differents
4. Ratio ~90 % participation / 10 % promo
5. r/Typebeats beat → **manuel uniquement** si tu veux du trafic producer
6. Upvote des posts sans lien (karma)

---

## 5. Beats publics (option manuelle r/Typebeats seulement)

${loops
  .slice(0, 6)
  .map((l, i) => `${i + 1}. **${l.name}** (${l.genre}) → ${loopUrl(l)}`)
  .join("\n")}

---

## 6. Automatisation complète (optionnel)

\`\`\`bash
# Si tu as une app Reddit script + refresh token :
npm run reddit:oauth:check
npm run reddit:agent -- scout --post-comments
\`\`\`

Secrets Supabase prod : \`REDDIT_CLIENT_ID\`, \`REDDIT_CLIENT_SECRET\`, \`REDDIT_REFRESH_TOKEN\`
`;

  if (autoResults?.length) {
    md += `\n## Résultats auto\n\n${autoResults.map((r) => `- ${r.ok ? "✅" : "❌"} ${r.post?.slice(0, 50)} ${r.permalink ?? r.error ?? ""}`).join("\n")}\n`;
  }

  return md;
}

async function main() {
  mkdirSync(reportsDir, { recursive: true });
  const args = process.argv.slice(2);
  const shouldOpen = args.includes("--open");
  const modeScout = args.includes("scout");
  const postComments = args.includes("--post-comments");
  const modePost = args.includes("post");
  const subArg = modePost ? args[args.indexOf("post") + 1]?.replace(/^r\//, "") : null;

  const state = loadState();
  const loops = await fetchPublicLoops(8);
  const redditLoop = pickLoopForReddit(loops);
  const ownPost = buildOwnPost(redditLoop ?? { id: "demo", name: "Type Beat", genre: "Trap" });

  if (modePost && subArg) {
    const forbidden = ["makinghiphop", "typebeats"];
    if (forbidden.includes(subArg.toLowerCase())) {
      console.error(`❌ r/${subArg} : pas de post beat auto. Utilise une discussion :`);
      console.error(`   npm run reddit:agent -- post r/SideProject`);
      console.error(`   npm run reddit:agent -- post r/aiMusic`);
      process.exit(1);
    }
    const post = pickAgentDiscussionPost(redditLoop ?? { id: "demo", name: "Type Beat", genre: "Trap" }, subArg);
    const url = redditSubmitUrl({
      subreddit: post.subreddit,
      title: post.title,
      selftext: post.selftext,
    });
    console.log(url);
    if (shouldOpen) openUrls([url]);
    return;
  }

  let opportunities = [];
  let autoResults = [];

  if (modeScout || hasRedditCredentials()) {
    opportunities = await scoutThreads(state);
  }

  if (postComments && hasRedditCredentials() && opportunities.length) {
    autoResults = await postCommentsOpportunities(opportunities, loops, state);
    saveState(state);
  }

  const manualLinks = manualScoutLinks();
  const report = buildReport({ loops, opportunities, ownPost, manualLinks, autoResults });
  const outFile = path.join(reportsDir, `reddit-agent-${new Date().toISOString().slice(0, 10)}.md`);
  writeFileSync(outFile, report, "utf8");

  state.lastRun = new Date().toISOString();
  saveState(state);

  console.log(`✓ Rapport: ${outFile}`);
  console.log(`  ${opportunities.length} threads · OAuth: ${hasRedditCredentials() ? "oui" : "non (mode manuel)"}`);

  if (shouldOpen) {
    const urls = [
      redditSubmitUrl({ subreddit: ownPost.subreddit, title: ownPost.title, selftext: ownPost.selftext }),
      redditSearchUrl("makinghiphop", "ai beat generator"),
    ];
    if (opportunities[0]?.permalink) urls.push(opportunities[0].permalink);
    openUrls(urls);
    console.log(`→ Post discussion: ${ownPost.subLabel} · Commentaires: r/makinghiphop (pas de beat)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
