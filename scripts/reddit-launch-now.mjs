/**
 * Launch Reddit immédiat — posts humains, multi-subs, playbook trafic 2–6h.
 *
 *   npm run reddit:launch
 *   npm run reddit:launch -- --open
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { redditSearchUrl, redditSubmitUrl } from "./lib/redditClient.mjs";
import {
  aiMusicPosts,
  alphaBetaPost,
  launchPlaybook,
  mhhCommentVariants,
  pickEngagementLoop,
  sideProjectPost,
  trapProductionComment,
  twitterHotTake,
  typebeatsPost,
} from "./lib/redditHumanCopy.mjs";

const repoRoot = process.cwd();
const reportsDir = path.join(repoRoot, "reports", "automation");

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

async function fetchPublicLoops(limit = 20) {
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

function buildReport(loop, playbook) {
  const aim = aiMusicPosts(loop);
  const ab = alphaBetaPost(loop);
  const tb = typebeatsPost(loop);
  const sp = sideProjectPost(loop);
  const mhh = mhhCommentVariants();
  const trap = trapProductionComment(loop);
  const x = twitterHotTake(loop);
  const today = new Date().toISOString().slice(0, 10);
  const time = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  let md = `# 🚀 Reddit launch — ${today} ${time}

> Posts **fondateur perso** — priorité r/aiMusic + early adopters.
> ${playbook.window} (≈ ${playbook.estHour}h EST)

## Ordre d'exécution (prochaines 2h)

${playbook.order.map((s) => `- ${s}`).join("\n")}

---

## POST #1 — r/aiMusic ⭐ (discussion feed — SANS lien)

_${aim.rulesNote}_

**Titre:**
\`\`\`
${aim.discussion.title}
\`\`\`

**Compose:** ${redditSubmitUrl({ subreddit: aim.subreddit, title: aim.discussion.title, selftext: aim.discussion.selftext })}

**Corps:**
\`\`\`
${aim.discussion.selftext}
\`\`\`

**Commentaire #1:**
\`\`\`
${aim.discussion.firstComment}
\`\`\`

---

## POST #1b — r/aiMusic megathread (lien OK)

Megathread : [recherche](${aim.megathreadUrl})

\`\`\`
${aim.megathreadComment}
\`\`\`

---

## POST #2 — r/alphaandbetausers

**Titre:** ${ab.title}

**Compose:** ${redditSubmitUrl({ subreddit: ab.subreddit, title: ab.title, selftext: ab.selftext })}

\`\`\`
${ab.selftext}
\`\`\`

---

## POST #3 — r/Typebeats (optionnel)

**Titre:** ${tb.title}

**URL:** ${tb.url}

**Compose:** ${redditSubmitUrl({ subreddit: tb.subreddit, title: tb.title, url: tb.url })}

\`\`\`
${tb.firstComment}
\`\`\`

---

## POST #4 — r/SideProject

**Titre:** ${sp.title}

**Compose:** ${redditSubmitUrl({ subreddit: sp.subreddit, title: sp.title, selftext: sp.selftext })}

\`\`\`
${sp.selftext}
\`\`\`

---

## COMMENTAIRES — r/makinghiphop (Rule 3)

`;

  for (const v of mhh) {
    md += `### ${v.label}

Recherche: [r/makinghiphop — ${v.searchQuery}](${redditSearchUrl("makinghiphop", v.searchQuery)})

\`\`\`
${v.text}
\`\`\`

`;
  }

  md += `---

## COMMENTAIRE — r/trapproduction

Recherche: [r/trapproduction — ${trap.searchQuery}](${redditSearchUrl("trapproduction", trap.searchQuery)})

\`\`\`
${trap.text}
\`\`\`

---

## X / Twitter (même session)

\`\`\`
${x}
\`\`\`

---

## Beat du jour

**${loop.name}** · ${loop.genre} · ${loop.bpm ?? "?"} BPM

---

## Règles pro

${playbook.rules.map((r) => `- ${r}`).join("\n")}

---

## Mesure (2–6h)

- GA4 temps réel → \`utm_source=reddit\`
- Réponses sous tes posts < 30 min = critical
- 1 upvote commentaire = signal algo → réponds même aux trolls poliment
`;

  return { md, aim, ab, tb, sp, mhh, trap };
}

async function main() {
  mkdirSync(reportsDir, { recursive: true });
  const shouldOpen = process.argv.includes("--open");
  const loops = await fetchPublicLoops(20);
  const loop = pickEngagementLoop(loops.length ? loops : [{ id: "c2125d9a-52eb-4718-bf9d-d92269cb581f", name: "Miami Sunset Soul #01", genre: "Miami Sunset Soul", bpm: 94 }]);
  const playbook = launchPlaybook();
  const { md, aim, ab, mhh } = buildReport(loop, playbook);

  const outFile = path.join(reportsDir, `reddit-launch-${new Date().toISOString().slice(0, 10)}.md`);
  writeFileSync(outFile, md, "utf8");
  console.log(`✓ Launch pack: ${outFile}`);
  console.log(`  Beat: ${loop.name} (${loop.genre}, ${loop.bpm} BPM)`);
  console.log(`  ${playbook.window}`);

  if (shouldOpen) {
    openUrls([
      redditSubmitUrl({
        subreddit: aim.subreddit,
        title: aim.discussion.title,
        selftext: aim.discussion.selftext,
      }),
      aim.megathreadUrl,
      redditSubmitUrl({ subreddit: ab.subreddit, title: ab.title, selftext: ab.selftext }),
    ]);
    console.log("→ 3 onglets: r/aiMusic discussion | megathread | alphaandbetausers");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
