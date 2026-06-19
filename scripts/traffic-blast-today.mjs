/**
 * Kit distribution trafic — posts prêts + IndexNow + rapport markdown.
 * Usage: node scripts/traffic-blast-today.mjs
 *        node scripts/traffic-blast-today.mjs --indexnow-only
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const SITE = "https://www.producerhit.com";
const ORIGIN = SITE;
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

const indexOnly = process.argv.includes("--indexnow-only");

const TIER1_LANDINGS = [
  "/ai-beat-generator",
  "/type-beat-generator-ai",
  "/generate-beats-online-free",
  "/ai-trap-beat-generator",
  "/ai-drill-beat-generator",
  "/suno-alternatives",
  "/best-ai-beat-generator-for-producers",
  "/community",
  "/trending",
  "/blog",
  "/pricing",
  "/commercial-license",
];

async function fetchPublicLoops(limit = 12) {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  const endpoint = `${url.replace(/\/$/, "")}/rest/v1/loops?select=id,name,genre,created_at&is_public=eq.true&audio_url=not.is.null&order=created_at.desc&limit=${limit}`;
  const res = await fetch(endpoint, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) {
    console.warn(`traffic-blast: Supabase ${res.status}`);
    return [];
  }
  return (await res.json()).filter((r) => typeof r.id === "string");
}

async function submitIndexNow(urls) {
  const key = process.env.INDEXNOW_KEY || "producerhit-indexnow-key";
  const keyFile = path.join(repoRoot, "public", `${key}.txt`);
  try {
    writeFileSync(keyFile, `${key}\n`, "utf8");
  } catch {
    // ignore
  }
  const list = [...new Set(urls)].slice(0, 10000);
  if (!list.length) return false;
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: "www.producerhit.com",
      key,
      keyLocation: `${ORIGIN}/${encodeURIComponent(key)}.txt`,
      urlList: list,
    }),
  });
  const ok = res.ok || res.status === 202;
  console.log(ok ? `✓ IndexNow: ${list.length} URLs soumises` : `⚠ IndexNow ${res.status}: ${await res.text()}`);
  return ok;
}

function loopUrl(id) {
  return `${SITE}/loop/${encodeURIComponent(id)}`;
}

function utm(path, source, campaign = "traffic_blast") {
  const u = new URL(path.startsWith("http") ? path : `${SITE}${path}`);
  u.searchParams.set("utm_source", source);
  u.searchParams.set("utm_medium", "social");
  u.searchParams.set("utm_campaign", campaign);
  return u.toString();
}

function pickLoop(loops, idx = 0) {
  return loops[idx] ?? loops[0] ?? { id: "demo", name: "Trap Type Beat", genre: "Trap" };
}

function buildReport(loops) {
  const beat = pickLoop(loops, 0);
  const beatUrl = loopUrl(beat.id);
  const today = new Date().toISOString().slice(0, 10);

  const redditWatm = `[OC] Made this ${beat.genre} beat with an AI tool built for producers (BPM/key/seeds) — feedback welcome

I generated "${beat.name}" in under 2 minutes, then tweaked the seed for variations. It's not Suno-style one-shot songs — more type-beat / producer workflow.

Listen (free, no login): ${beatUrl}

If you want the generator: ${utm("/type-beat-generator-ai", "reddit", "watm_demo")}

Happy to share prompt + settings in comments.`;

  const redditTypebeats = `[FREE] ${beat.genre ?? "Trap"} Type Beat — ${beat.name} (producer workflow / AI sketch)

${beatUrl}

Not a finished type beat — loop starting point. Feedback welcome.`;

  const redditMhhComment = `Suno = full songs/vocals. For producer loops (BPM/key/seeds) I wrote a comparison: ${utm("/suno-alternatives", "reddit", "mhh_compare")}

I use AI as sketch, then redo drums/808/mix manually — happy to detail workflow if useful.

(Do not post beat links as standalone posts here — Rule 3.)`;

  const discordPost = `**🎧 Beat du jour — remix challenge**
> **${beat.name}** · ${beat.genre}
> 🔊 ${beatUrl}
> 🔁 Remix gratuit → ${utm("/community", "discord", "daily_beat")}
> 🆓 Générateur type beat IA → ${utm("/generate-beats-online-free", "discord", "daily_beat")}`;

  const xPost = `Type beat in 2 min with AI (producer-first: seeds, BPM, key)

"${beat.name}" → ${beatUrl}

10 free gens/mo · community remix
${utm("/ai-trap-beat-generator", "twitter", "type_beat_demo")}`;

  const tiktokCaption = `Type beat AI in 30 sec 🎹 "${beat.name}" — link in bio
#typebeat #beatmaker #trap #drill #aimusic #producer #flstudio #beatstars`;

  const tiktokBioLink = utm("/type-beat-generator-ai", "tiktok", "bio_link");

  return `# Traffic blast — ${today}

> Généré par \`npm run traffic:blast\`. Copier-coller les posts ci-dessous **aujourd'hui**.

## Actions immédiates (15 min)

1. **Google Search Console** → Ajouter propriété → Soumettre \`${SITE}/sitemap-index.xml\`
2. **Bing Webmaster** → même sitemap
3. **IndexNow** → lancé par ce script (vérifie la console ci-dessus)
4. Poster **1 beat** sur **r/Typebeats** — pas r/makinghiphop (Rule 3)

---

## Beats à pousser (publics)

${loops
  .slice(0, 8)
  .map((l, i) => `${i + 1}. **${l.name}** (${l.genre}) → ${loopUrl(l.id)}`)
  .join("\n")}

---

## Reddit — r/Typebeats (post beat)

\`\`\`
${redditTypebeats}
\`\`\`

Compose: https://www.reddit.com/submit?sr=Typebeats

## Reddit — r/WeAreTheMusicMakers (feedback thread only)

\`\`\`
${redditWatm}
\`\`\`

## Reddit — r/makinghiphop (comment only — Rule 3)

Cherche un thread question prod / AI, colle ceci en **commentaire** (pas un post beat) :

\`\`\`
${redditMhhComment}
\`\`\`

---

## Discord (serveur ProducerHit + serveurs beatmaking)

\`\`\`
${discordPost}
\`\`\`

---

## X / Twitter

\`\`\`
${xPost}
\`\`\`

---

## TikTok / Reels / Shorts

**Caption:**
\`\`\`
${tiktokCaption}
\`\`\`

**Bio link:** ${tiktokBioLink}

**Vidéo:** exporter depuis ShareMomentModal sur un beat, ou utiliser \`previews/community-youtube-pack/\`

---

## Facebook groups (beatmaking FR/EN)

Subject: Free AI type beat — remix this

Body:
\`\`\`
New ${beat.genre} beat "${beat.name}" — listen & remix free:
${beatUrl}

Producer-first AI (680+ genres, seed variations): ${utm("/", "facebook", "beat_group")}
\`\`\`

---

## Landings à indexer manuellement (Search Console → Inspect URL)

${TIER1_LANDINGS.map((p) => `- ${SITE}${p}`).join("\n")}

---

## Automations repo (si secrets configurés)

| Commande | Effet |
|----------|--------|
| \`npm run growth:sync\` | Sitemap loops + IndexNow |
| \`npm run growth:social\` | Draft Twitter |
| \`node scripts/discord-grow-community.mjs\` | Posts Discord serveur |
| \`npm run youtube:daily -- run\` | YouTube multi-comptes |
| \`npm run social:publish\` | Queue social Supabase |

---

## Mesure (48h)

- GA4 → Acquisition → \`utm_source=reddit|discord|tiktok\`
- Supabase → \`growth_events\` signup_started / generate_success
`;
}

async function main() {
  mkdirSync(reportsDir, { recursive: true });
  const loops = await fetchPublicLoops(12);
  console.log(`traffic-blast: ${loops.length} loops publics`);

  const indexUrls = TIER1_LANDINGS.map((p) => `${ORIGIN}${p}`);
  for (const l of loops) indexUrls.push(loopUrl(l.id));
  await submitIndexNow(indexUrls);

  if (indexOnly) return;

  const report = buildReport(loops);
  const outFile = path.join(reportsDir, `traffic-blast-${new Date().toISOString().slice(0, 10)}.md`);
  writeFileSync(outFile, report, "utf8");
  console.log(`✓ Rapport: ${outFile}`);
  console.log("\n--- Prochaine étape: ouvrir le rapport et poster le beat #1 sur Reddit ---");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
