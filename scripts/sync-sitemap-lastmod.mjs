/**
 * Met à jour <lastmod> sur les URLs core du sitemap principal.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const sitemapFile = path.join(repoRoot, "public", "sitemap.xml");
const origin = "https://www.producerhit.com";
const lastmod = new Date().toISOString().slice(0, 10);

const CORE_PATHS = [
  "/",
  "/blog",
  "/community",
  "/trending",
  "/pricing",
  "/legal",
  "/ai-beat-generator",
  "/ai-music-generator",
  "/ai-song-generator",
  "/type-beat-generator-ai",
  "/generate-beats-online-free",
  "/suno-alternatives",
  "/udio-alternatives",
  "/producerhit-vs-suno",
  "/producerhit-vs-udio",
];

let xml = readFileSync(sitemapFile, "utf8");
let updated = 0;

for (const p of CORE_PATHS) {
  const loc = `${origin}${p === "/" ? "/" : p}`;
  const re = new RegExp(
    `(<loc>${loc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</loc>\\s*<lastmod>)[^<]+(</lastmod>)`,
    "g",
  );
  const next = xml.replace(re, `$1${lastmod}$2`);
  if (next !== xml) {
    updated += 1;
    xml = next;
  }
}

writeFileSync(sitemapFile, xml, "utf8");
console.log(`sync-sitemap-lastmod: ${updated} core URL(s) refreshed to ${lastmod}`);
