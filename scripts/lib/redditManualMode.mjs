/**
 * Mode manuel Reddit — sans OAuth (create app bloqué sur reddit.com/prefs/apps).
 * Génère liens de recherche + formulaires pré-remplis pour le navigateur connecté.
 */
import { execFileSync } from "node:child_process";
import { redditSearchUrl, redditSubmitUrl } from "./redditClient.mjs";
import { SCOUT_SUBS } from "./redditScout.mjs";
import { aiMusicPosts, draftSubtleComment, pickEngagementLoop } from "./redditHumanCopy.mjs";

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

export function buildManualDiscussionPost(loop) {
  const aim = aiMusicPosts(loop);
  return {
    subreddit: aim.subreddit,
    label: `r/${aim.subreddit}`,
    title: aim.discussion.title,
    selftext: aim.discussion.selftext,
    submitUrl: redditSubmitUrl({
      subreddit: aim.subreddit,
      title: aim.discussion.title,
      selftext: aim.discussion.selftext,
    }),
    megathreadUrl: aim.megathreadUrl,
  };
}

/** Section markdown pour rapports cron/agent sans OAuth. */
export function formatManualModeMarkdown(loop, { maxLinks = 16 } = {}) {
  const links = manualScoutLinks(10).slice(0, maxLinks);
  const post = buildManualDiscussionPost(loop);
  const sampleOpp = {
    subreddit: "Songwriting",
    title: "Example thread — reply with value first",
    permalink: links[0]?.url ?? "https://www.reddit.com/r/Songwriting/new/",
    intent: "workflow",
  };

  let md = `## Mode manuel (OAuth indisponible)

Reddit bloque souvent **Create app** sur [prefs/apps](https://www.reddit.com/prefs/apps) depuis fin 2025.
**Devvit** (apps in-Reddit) ≠ credentials OAuth pour le cron.

Tu es déjà connecté dans ton navigateur → copie-colle les brouillons ci-dessous (max 3–5/jour).

### Post discussion du jour (pré-rempli)

- **Sub:** ${post.label}
- **[Ouvrir le formulaire Reddit](${post.submitUrl})**

\`\`\`
${post.selftext.slice(0, 1200)}${post.selftext.length > 1200 ? "…" : ""}
\`\`\`

### Exemple de commentaire (adapter au thread)

\`\`\`
${draftSubtleComment(sampleOpp)}
\`\`\`

### Recherches à ouvrir (threads récents)

`;
  for (const link of links) {
    md += `- [${link.subreddit} · ${link.category} · "${link.query}"](${link.url})\n`;
  }

  md += `
### Raccourcis

\`\`\`bash
npm run reddit:manual          # rapport + ouvre Reddit
npm run reddit:launch -- --open  # playbook launch 2–6h
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

export function openManualPlaybook(loop) {
  const post = buildManualDiscussionPost(loop);
  const links = manualScoutLinks(6);
  openRedditUrls([
    post.submitUrl,
    post.megathreadUrl,
    redditSearchUrl("Songwriting", "ai songwriting"),
    redditSearchUrl("makinghiphop", "ai beat"),
    links[0]?.url,
    links[1]?.url,
  ]);
}

export function pickLoopForManual(loops) {
  return pickEngagementLoop(loops.length ? loops : [{ id: "demo", name: "Type Beat", genre: "Trap" }]);
}
