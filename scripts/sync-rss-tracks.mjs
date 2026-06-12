import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const publicDir = path.join(repoRoot, "public");
const rssFile = path.join(publicDir, "rss-tracks.xml");
const robotsFile = path.join(publicDir, "robots.txt");
const ORIGIN = "https://www.producerhit.com";

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function rssDate(iso) {
  const d = iso ? new Date(iso) : new Date();
  return d.toUTCString();
}

async function fetchPublicLoops() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn("sync-rss-tracks: missing SUPABASE_URL / ANON_KEY");
    return [];
  }

  const endpoint =
    `${url.replace(/\/$/, "")}/rest/v1/loops?select=id,name,genre,mood,bpm,cover_url,created_at,updated_at` +
    `&is_public=eq.true&audio_url=not.is.null&order=created_at.desc&limit=100`;
  const res = await fetch(endpoint, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) {
    console.warn(`sync-rss-tracks: Supabase ${res.status}`);
    return [];
  }
  return res.json();
}

async function ensureRobotsFeed() {
  const line = `Sitemap: ${ORIGIN}/rss-tracks.xml`;
  let robots = await fs.readFile(robotsFile, "utf8");
  if (!robots.includes(line)) {
    robots = `${robots.trim()}\n# Public tracks RSS (auto-sync)\n${line}\n`;
    await fs.writeFile(robotsFile, robots, "utf8");
  }
}

async function main() {
  const loops = await fetchPublicLoops();
  const items = loops
    .map((loop) => {
      const pageUrl = `${ORIGIN}/loop/${encodeURIComponent(loop.id)}`;
      const title = escapeXml(loop.name || "Untitled");
      const genre = escapeXml(loop.genre || "AI");
      const mood = escapeXml(loop.mood || "");
      const bpm = loop.bpm && loop.bpm > 0 ? `${loop.bpm} BPM` : "";
      const desc = [genre, mood, bpm].filter(Boolean).join(" · ");
      const pub = loop.updated_at || loop.created_at;
      const enclosure = loop.cover_url?.startsWith("http")
        ? `\n      <enclosure url="${escapeXml(loop.cover_url)}" type="image/jpeg" />`
        : "";
      return `    <item>
      <title>${title}</title>
      <link>${pageUrl}</link>
      <guid isPermaLink="true">${pageUrl}</guid>
      <pubDate>${rssDate(pub)}</pubDate>
      <description><![CDATA[${desc} — Listen on ProducerHit]]></description>${enclosure}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>ProducerHit — New public tracks</title>
    <link>${ORIGIN}/community</link>
    <description>Latest AI beats and songs published on ProducerHit — royalty-free, remix-ready.</description>
    <language>en</language>
    <atom:link href="${ORIGIN}/rss-tracks.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;

  await fs.writeFile(rssFile, xml, "utf8");
  await ensureRobotsFeed();
  console.log(`sync-rss-tracks: ${loops.length} items → public/rss-tracks.xml`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
