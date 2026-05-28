import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const publicDir = path.join(repoRoot, "public");
const sitemapMain = path.join(publicDir, "sitemap.xml");
const sitemapLoops = path.join(publicDir, "sitemap-loops.xml");
const robotsFile = path.join(publicDir, "robots.txt");

const ORIGIN = "https://www.producerhit.com";

const GENRE_SEO_PATHS = [
  "/ai-trap-beat-generator",
  "/ai-drill-beat-generator",
  "/ai-rnb-beat-generator",
  "/ai-afrobeats-generator",
  "/ai-hip-hop-beat-generator",
  "/ai-pop-beat-generator",
];

function formatDateYmd(d = new Date()) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function urlNode(loc, priority = "0.6", changefreq = "weekly") {
  const lastmod = formatDateYmd();
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>
`;
}

async function fetchPublicLoopIds() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn("growth-sync: missing SUPABASE_URL / ANON_KEY — skipping loop sitemap");
    return [];
  }

  const endpoint = `${url.replace(/\/$/, "")}/rest/v1/loops?select=id,updated_at,created_at&is_public=eq.true&order=created_at.desc&limit=500`;
  const res = await fetch(endpoint, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  if (!res.ok) {
    console.warn(`growth-sync: Supabase ${res.status}`);
    return [];
  }
  const rows = (await res.json()) as Array<{ id?: string; updated_at?: string; created_at?: string }>;
  return rows.filter((r) => typeof r.id === "string").map((r) => ({ id: r.id, ts: r.updated_at || r.created_at }));
}

async function ensureGenreUrlsInMainSitemap() {
  let src = await fs.readFile(sitemapMain, "utf8");
  for (const p of GENRE_SEO_PATHS) {
    const loc = `${ORIGIN}${p}`;
    if (src.includes(loc)) continue;
    src = src.replace("</urlset>", `${urlNode(loc, "0.75", "weekly")}</urlset>`);
  }
  await fs.writeFile(sitemapMain, src, "utf8");
}

async function writeLoopsSitemap(rows) {
  const body = rows
    .map((r) => urlNode(`${ORIGIN}/loop/${encodeURIComponent(r.id)}`, "0.55", "monthly"))
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
  await fs.writeFile(sitemapLoops, xml, "utf8");
}

async function ensureRobotsLoopsSitemap() {
  let robots = await fs.readFile(robotsFile, "utf8");
  const line = `Sitemap: ${ORIGIN}/sitemap-loops.xml`;
  if (!robots.includes(line)) {
    robots = `${robots.trim()}\n${line}\n`;
    await fs.writeFile(robotsFile, robots, "utf8");
  }
}

async function ensureIndexNowKeyFile(key) {
  const keyFile = path.join(publicDir, `${key}.txt`);
  try {
    const existing = await fs.readFile(keyFile, "utf8");
    if (existing.trim() === key) return;
  } catch {
    // missing file
  }
  await fs.writeFile(keyFile, `${key}\n`, "utf8");
}

async function submitIndexNow(urls) {
  const key = process.env.INDEXNOW_KEY || "producerhit-indexnow-key";
  if (!key || key.length < 8) {
    console.warn("growth-sync: INDEXNOW_KEY too short — skipping IndexNow");
    return;
  }

  await ensureIndexNowKeyFile(key);
  const list = [...new Set(urls)].slice(0, 10000);
  if (!list.length) return;

  const body = {
    host: "www.producerhit.com",
    key,
    keyLocation: `${ORIGIN}/${encodeURIComponent(key)}.txt`,
    urlList: list,
  };

  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });

  if (res.ok || res.status === 202) {
    console.log(`growth-sync: IndexNow submitted ${list.length} URLs`);
  } else {
    console.warn(`growth-sync: IndexNow ${res.status} ${await res.text()}`);
  }
}

async function collectIndexNowUrls(loopRows) {
  const urls = [`${ORIGIN}/`, `${ORIGIN}/community`, `${ORIGIN}/blog`, `${ORIGIN}/pricing`];
  for (const p of GENRE_SEO_PATHS) urls.push(`${ORIGIN}${p}`);
  for (const r of loopRows) urls.push(`${ORIGIN}/loop/${encodeURIComponent(r.id)}`);
  return urls;
}

async function main() {
  await ensureGenreUrlsInMainSitemap();
  const rows = await fetchPublicLoopIds();
  await writeLoopsSitemap(rows);
  await ensureRobotsLoopsSitemap();
  const indexUrls = await collectIndexNowUrls(rows);
  await submitIndexNow(indexUrls);
  console.log(`growth-sync: ${rows.length} public loop URLs, genre SEO URLs synced`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
