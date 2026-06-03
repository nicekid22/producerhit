/**
 * Ajoute les URLs SEO_PAGES manquantes dans public/sitemap.xml
 */
import { buildSync } from "esbuild";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repoRoot = process.cwd();
const outFile = path.join(repoRoot, ".tmp", "seo-pages-bundle.cjs");
const sitemapFile = path.join(repoRoot, "public", "sitemap.xml");
const origin = "https://www.producerhit.com";
const lastmod = new Date().toISOString().slice(0, 10);

buildSync({
  entryPoints: [path.join(repoRoot, "scripts", "seo-pages-entry.ts")],
  bundle: true,
  platform: "node",
  format: "cjs",
  outfile: outFile,
  logLevel: "silent",
});

const mod = await import(pathToFileURL(outFile).href);
const paths = mod.SEO_PAGE_PATHS ?? [];
let xml = readFileSync(sitemapFile, "utf8");
let added = 0;

for (const p of paths) {
  const loc = `${origin}${p}`;
  if (xml.includes(`<loc>${loc}</loc>`)) continue;
  const priority = p.includes("music-ai") || p.includes("music-ia") || p.includes("sommeil") ? "0.88" : "0.82";
  const node = `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>
`;
  xml = xml.replace("</urlset>", `${node}</urlset>`);
  added += 1;
}

writeFileSync(sitemapFile, xml, "utf8");
console.log(`sync-seo-sitemap: ${added} URL(s) added (${paths.length} total SEO paths)`);
