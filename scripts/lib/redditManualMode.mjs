/**
 * Mode manuel Reddit — sans OAuth (create app bloqué sur reddit.com/prefs/apps).
 * Ouvre des **threads à commenter** (pas des formulaires post incomplets).
 */
import { execFileSync } from "node:child_process";
import { redditSearchUrl, redditSubmitUrl } from "./redditClient.mjs";
import { SCOUT_SUBS } from "./redditScout.mjs";
import {
  draftSubtleComment,
  pickEngagementLoop,
  sideProjectPost,
} from "./redditHumanCopy.mjs";

/** Threads prioritaires — répondre en commentaire (pas créer un nouveau post). */
export const PRIORITY_COMMENT_THREADS = [
  {
    id: "aimusic-money-1u9y2i0",
    label: "r/aiMusic — make money from AI music",
    url: "https://www.reddit.com/r/aiMusic/comments/1u9y2i0/does_anyone_actually_make_money_from_ai_generated/",
    intent: "monetization",
    subreddit: "aiMusic",
  },
  {
    id: "aimusic-suno-search",
    label: "r/aiMusic — Suno / alternatives (recherche)",
    url: redditSearchUrl("aiMusic", "suno alternative"),
    intent: "ai_compare",
    subreddit: "aiMusic",
  },
  {
    id: "mhh-suno",
    label: "r/makinghiphop — Suno / AI beats",
    url: redditSearchUrl("makinghiphop", "suno"),
    intent: "ai_compare",
    subreddit: "makinghiphop",
  },
];

export function manualScoutLinks(limitSubs = 12) {
  const byCategory = { song: [], beats: [], production: [], ai: [], daw: [] };
  for (const sr of SCOUT_SUBS) {
    const cat = sr.category in byCategory ? sr.category : "production";
    if (byCategory[cat].length < 6) byCategory[cat].push(sr);
  }
  const picked = [
    ...byCategory.ai,
    ...byCategory.song,
    ...byCategory.beats,
    ...byCategory.production,
    ...byCategory.daw,
  ].slice(0, limitSubs);
  return picked.flatMap((sr) =>
    sr.queries.slice(0, 2).map((q) => ({
      subreddit: `r/${sr.name}`,
      name: sr.name,
      category: sr.category,
      query: q,
      url: redditSearchUrl(sr.name, q),
    })),
  );
}

/** Post SideProject — pas r/aiMusic (flair obligatoire + URL submit ne remplit pas le corps). */
export function buildManualDiscussionPost(_loop) {
  const sp = sideProjectPost(_loop);
  return {
    subreddit: sp.subreddit,
    label: `r/${sp.subreddit}`,
    title: sp.title,
    selftext: sp.selftext,
    submitUrl: redditSubmitUrl({
      subreddit: sp.subreddit,
      title: sp.title,
      selftext: sp.selftext,
    }),
    note:
      "Coller le corps manuellement si Reddit ne le pré-remplit pas. r/aiMusic = flair obligatoire → ne pas créer de post feed sans flair.",
  };
}

export function priorityThreadDraft(thread) {
  return draftSubtleComment({
    intent: thread.intent,
    subreddit: thread.subreddit,
    title: thread.label,
  });
}

/** Section markdown pour rapports cron/agent sans OAuth. */
export function formatManualModeMarkdown(loop, { maxLinks = 12 } = {}) {
  const links = manualScoutLinks(8).slice(0, maxLinks);
  const post = buildManualDiscussionPost(loop);

  let md = `## Mode manuel — pourquoi les agents ne commentent pas seuls

| Raison | Détail |
|--------|--------|
| **Pas d'OAuth** | Sans \`REDDIT_CLIENT_ID\` + secret + refresh token, le cron **ne peut pas** poster de commentaires via l'API |
| **Hermes PH Reddit** | Cron jamais exécuté (status: never) |
| **Mode manuel** | Ouvre le navigateur — **tu** dois coller le commentaire (3–5/jour max) |

### ⚠️ Fenêtres Reddit « post non finalisé »

Les URLs \`/submit?title=...\` **ne peuvent pas** :
- choisir le **flair** (obligatoire sur r/aiMusic — étoile rouge)
- remplir le corps sur le **nouveau Reddit** (souvent vide)

→ **Ne pas publier** ces brouillons aiMusic. **Commenter** les threads existants ci-dessous.

---

## 1. Commentaires prioritaires (copier-coller)

`;

  for (const [i, thread] of PRIORITY_COMMENT_THREADS.entries()) {
    const draft = priorityThreadDraft(thread);
    md += `### ${i + 1}. [${thread.label}](${thread.url})

\`\`\`
${draft}
\`\`\`

`;
  }

  md += `---

## 2. Nouveau post (optionnel) — r/SideProject

Pas de flair obligatoire. **Coller le corps à la main** si le formulaire est vide.

- **[Ouvrir formulaire](${post.submitUrl})**

**Titre:** ${post.title}

**Corps:**

\`\`\`
${post.selftext}
\`\`\`

---

## 3. Recherches threads récents

`;
  for (const link of links) {
    md += `- [${link.subreddit} · "${link.query}"](${link.url})\n`;
  }

  md += `
\`\`\`bash
npm run reddit:manual   # ouvre les threads prioritaires + SideProject
\`\`\`
`;
  return md;
}

export function openRedditUrls(urls) {
  const unique = [...new Set(urls.filter(Boolean))];
  for (const url of unique.slice(0, 8)) {
    if (process.platform === "win32") {
      execFileSync("powershell", ["-NoProfile", "-Command", `Start-Process ${JSON.stringify(url)}`], {
        stdio: "ignore",
      });
    } else {
      execFileSync("open", [url], { stdio: "ignore" });
    }
  }
}

/** Ouvre threads à commenter — pas r/aiMusic submit (flair manquant). */
export function openManualPlaybook(loop) {
  const post = buildManualDiscussionPost(loop);
  openRedditUrls([
    PRIORITY_COMMENT_THREADS[0].url,
    PRIORITY_COMMENT_THREADS[1].url,
    redditSearchUrl("Songwriting", "ai songwriting"),
    post.submitUrl,
  ]);
}

export function pickLoopForManual(loops) {
  return pickEngagementLoop(loops.length ? loops : [{ id: "demo", name: "Type Beat", genre: "Trap" }]);
}
