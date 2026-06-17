/**
 * Génère public/sitemap-index.xml (sitemap principal + blog + loops).
 */
import { writeFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const outFile = path.join(repoRoot, "public", "sitemap-index.xml");
const origin = "https://www.producerhit.com";
const lastmod = new Date().toISOString().slice(0, 10);

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${origin}/sitemap.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${origin}/sitemap-blog.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${origin}/sitemap-loops.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
</sitemapindex>
`;

writeFileSync(outFile, xml, "utf8");
console.log(`sync-sitemap-index: wrote ${outFile} (lastmod=${lastmod})`);
