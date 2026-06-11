/**
 * Ajoute /community/vibe/*, /trending et /community au sitemap principal.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const sitemapFile = path.join(repoRoot, "public", "sitemap.xml");
const origin = "https://www.producerhit.com";
const lastmod = new Date().toISOString().slice(0, 10);

const COMMUNITY_PATHS = [
  { loc: "/community", priority: "0.92", changefreq: "daily" },
  { loc: "/trending", priority: "0.9", changefreq: "daily" },
  { loc: "/community/vibe/bedroom", priority: "0.85", changefreq: "weekly" },
  { loc: "/community/vibe/night-drive", priority: "0.85", changefreq: "weekly" },
  { loc: "/community/vibe/club", priority: "0.85", changefreq: "weekly" },
  { loc: "/community/vibe/hiphop", priority: "0.88", changefreq: "weekly" },
  { loc: "/community/vibe/lofi", priority: "0.88", changefreq: "weekly" },
  { loc: "/community/vibe/cinematic", priority: "0.85", changefreq: "weekly" },
];

let xml = readFileSync(sitemapFile, "utf8");
let added = 0;

for (const entry of COMMUNITY_PATHS) {
  const loc = `${origin}${entry.loc}`;
  if (xml.includes(`<loc>${loc}</loc>`)) continue;
  const node = `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>
`;
  xml = xml.replace("</urlset>", `${node}</urlset>`);
  added += 1;
}

writeFileSync(sitemapFile, xml, "utf8");
console.log(`sync-community-sitemap: ${added} URL(s) added (${COMMUNITY_PATHS.length} community paths)`);
