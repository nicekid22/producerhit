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
  mhhCommentVariants,
  pickEngagementLoop,
  typebeatsPost,
} from "./lib/redditHumanCopy.mjs";

const SITE = "https://www.producerhit.com";
const repoRoot = process.cwd();
const reportsDir = path.join(repoRoot, "reports", "automation");
const stateFile = path.join(reportsDir, "reddit-agent-state.json");

/** Où poster un beat (lien) — PAS r/makinghiphop (Rule 3). */
const BEAT_POST_SUBREDDITS = [
  {
    name: "Typebeats",
    label: "r/Typebeats",
    note: "Sub dédié type beats — préfixe [FREE] ou [Original Beats]",
  },
  {
    name: "MusicInTheMaking",
    label: "r/MusicInTheMaking",
    note: "WIP / collab — contexte production requis dans le post",
  },
];

/** Où commenter (conseils, outils) — jamais poster un beat en thread principal. */
const COMMENT_SUBREDDITS = [
  {
    name: "makinghiphop",
    label: "r/makinghiphop",
    ruleNote: "Rule 3: No singles, beats or music videos — commentaires uniquement",
    noBeatLinks: true,
  },
  { name: "WeAreTheMusicMakers", label: "r/WeAreTheMusicMakers", ruleNote: "Pas de promo solo — feedback weekly threads" },
  { name: "trapproduction", label: "r/trapproduction", ruleNote: "Préférer threads feedback / questions prod" },
  { name: "FL_Studio", label: "r/FL_Studio", ruleNote: "Questions workflow FL — pas de lien beat non sollicité" },
  { name: "edmproduction", label: "r/edmproduction", ruleNote: "Conseils prod — liens outils si on demande" },
];

const SUBREDDITS = COMMENT_SUBREDDITS.map(({ name, label }) => ({ name, label }));

const SEARCH_QUERIES = [
  "type beat generator",
  "ai beat",
  "suno alternative",
  "beatstars alternative",
  "free type beat",
  "how to make beats faster",
  "fl studio workflow",
];

const KEYWORD_SCORES = [
  { re: /type beat|beatstars|free beat|need beats/i, intent: "type_beat" },
  { re: /suno|udio|ai music|ai beat|ai song/i, intent: "ai_compare" },
  { re: /fl studio|ableton|logic pro|workflow|producer/i, intent: "workflow" },
  { re: /drill|trap|boom bap|lofi|genre/i, intent: "genre" },
  { re: /stuck|writer.?s block|ideas|motivation/i, intent: "help" },
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
    return { repliedIds: [], postedDays: [], lastRun: null };
  }
  try {
    return JSON.parse(readFileSync(stateFile, "utf8"));
  } catch {
    return { repliedIds: [], postedDays: [], lastRun: null };
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

async function fetchPublicLoops(limit = 8) {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  const endpoint = `${url.replace(/\/$/, "")}/rest/v1/loops?select=id,name,genre,bpm&is_public=eq.true&audio_url=not.is.null&order=created_at.desc&limit=${limit}`;
  const res = await fetch(endpoint, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) return [];
  return (await res.json()).filter((r) => typeof r.id === "string");
}

function loopUrl(loop) {
  return `${SITE}/loop/${encodeURIComponent(loop.id)}?utm_source=reddit&utm_medium=social&utm_campaign=agent_reply`;
}

function scorePost(post) {
  const hay = `${post.title} ${post.selftext}`.toLowerCase();
  let score = 0;
  let intent = "generic";
  for (const { re, intent: i } of KEYWORD_SCORES) {
    if (re.test(hay)) {
      score += 3;
      intent = i;
    }
  }
  if (post.numComments < 40) score += 1;
  if (post.score >= 0 && post.score < 200) score += 1;
  if (/promo|buy my|check out my store/i.test(hay)) score -= 2;
  return { score, intent };
}

function isNoBeatLinkSub(subreddit) {
  const sr = (subreddit ?? "").toLowerCase();
  return COMMENT_SUBREDDITS.some((s) => s.name.toLowerCase() === sr && s.noBeatLinks);
}

function draftReply(post, loop, intent) {
  if (isNoBeatLinkSub(post.subreddit)) {
    return draftCommentNoBeat(post, intent);
  }

  const beat = loopUrl(loop);
  const genre = loop.genre ?? "trap";

  const templates = {
    type_beat: `For type-beat workflow I've been using seed-based generation (same vibe, new variations) instead of scrolling BeatStars for hours.

Example ${genre} loop I made this way: ${beat}

Not saying it's a replacement for real producers — more like a quick sketch pad before you lay drums/mix in your DAW. Happy to share the prompt/settings if useful.`,

    ai_compare: `If you're comparing Suno/Udio vs beatmaker tools: Suno is great for full songs; for **type beats / loops / stems workflow** I use ProducerHit (680+ genres, BPM/key, seed variations).

Side-by-side writeup: ${utm("/suno-alternatives", "agent_compare")}

Demo loop: ${beat}`,

    workflow: `Something that helped my FL workflow: generate a loop with fixed BPM/key, export MP3, chop in Edison / drop into playlist, then replace elements with your own drums & 808.

Free tier is enough to test: ${utm("/type-beat-generator-ai", "agent_workflow")}

Recent ${genre} sketch: ${beat}`,

    genre: `For ${genre} specifically, locking BPM + key before generating saves a lot of time. Here's a public loop you can remix: ${beat}

Community remixes: ${utm("/community", "agent_genre")}`,

    help: `When I'm stuck I generate 3–4 short loops with different seeds (same genre/BPM) and pick one to develop — beats overthinking.

Example: ${beat}

No affiliation, just what worked for me this week.`,

    generic: `Producer tip that helped me: treat AI loops as **reference sketches**, not final beats — re-do drums, mix, and arrangement yourself.

Public ${genre} example: ${beat}`,
  };

  return templates[intent] ?? templates.generic;
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

function defaultPostSubreddit() {
  const fromEnv = (process.env.REDDIT_POST_SUBREDDIT ?? "Typebeats").replace(/^r\//i, "");
  return BEAT_POST_SUBREDDITS.find((s) => s.name.toLowerCase() === fromEnv.toLowerCase()) ?? BEAT_POST_SUBREDDITS[0];
}

function buildOwnPost(loop) {
  const human = typebeatsPost(loop);
  const target = defaultPostSubreddit();
  return {
    subreddit: target.name,
    subLabel: target.label,
    subNote: target.note,
    title: human.title,
    url: human.url,
    selftext: "",
    body: human.firstComment,
    firstComment: human.firstComment,
    timing: human.timing,
    forbiddenSubs: ["makinghiphop"],
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
    for (const sr of SUBREDDITS.slice(0, 3)) {
      for (const q of SEARCH_QUERIES.slice(0, 4)) {
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
  return SUBREDDITS.flatMap((sr) =>
    SEARCH_QUERIES.slice(0, 4).map((q) => ({
      subreddit: sr.label,
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

---

## Mode aujourd'hui

| Mode | Statut |
|------|--------|
| OAuth Reddit (auto comment/post) | ${hasOAuth ? "✅ configuré" : "❌ — \`npm run reddit:oauth -- --open\` ou posts manuels"} |
| Threads repérés (API) | ${opportunities.length} |
| Commentaires auto postés | ${autoResults?.filter((r) => r.ok).length ?? 0} |

---

## 1. Poster ton beat → ${ownPost.subLabel} (pas mhh)

**${ownPost.subNote}**

**Titre (hook humain):**
\`\`\`
${ownPost.title}
\`\`\`

**URL:** ${ownPost.url}

**Ouvrir compose:** ${redditSubmitUrl({ subreddit: ownPost.subreddit, title: ownPost.title, url: ownPost.url })}

**⚡ Commentaire #1 — poste immédiatement après publish:**
\`\`\`
${ownPost.firstComment ?? ownPost.body}
\`\`\`

_${ownPost.timing ?? ""}_

💡 Launch pack complet (SideProject + mhh + X): \`npm run reddit:launch -- --open\`

---

## 2. r/makinghiphop — commenter seulement (5 min)

Cherche un thread **question** (AI beat, FL workflow, Suno…) : [recherche](${mhhSearch})

Réponses **sans lien beat** (Rule 3) — exemple :

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
    for (const link of manualLinks.slice(0, 8)) {
      md += `- [${link.subreddit} — "${link.query}"](${link.url})\n`;
    }
    md += "\n";
  }

  md += `---

## 4. Règles anti-ban Reddit

1. **r/makinghiphop** : jamais de post beat (Rule 3) — commentaires conseil only
2. **Max 3–5 interactions/jour** sur des subs différents
3. Ratio ~90 % participation / 10 % promo
4. Beats → r/Typebeats ; outils/blog → commentaires si pertinent
5. Upvote des posts sans lien (karma)

---

## 5. Beats publics (pour r/Typebeats)

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
    const forbidden = ["makinghiphop"];
    if (forbidden.includes(subArg.toLowerCase())) {
      console.error(`❌ r/${subArg} interdit les posts beat (Rule 3). Utilise : r/Typebeats`);
      console.error(`   npm run reddit:agent -- post r/Typebeats`);
      process.exit(1);
    }
    const url = redditSubmitUrl({
      subreddit: subArg,
      title: ownPost.title,
      url: ownPost.url,
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
      redditSubmitUrl({ subreddit: ownPost.subreddit, title: ownPost.title, url: ownPost.url }),
      redditSearchUrl("makinghiphop", "ai beat generator"),
    ];
    if (opportunities[0]?.permalink) urls.push(opportunities[0].permalink);
    openUrls(urls);
    console.log(`→ Post beat: ${ownPost.subLabel} · Commentaires: r/makinghiphop (pas de post beat)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
