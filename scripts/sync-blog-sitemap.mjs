/**
 * Sitemap blog dynamique + sync dans sitemap.xml
 */
import { buildSync } from "esbuild";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repoRoot = process.cwd();
const outFile = path.join(repoRoot, ".tmp", "blog-posts-bundle.cjs");
const sitemapMain = path.join(repoRoot, "public", "sitemap.xml");
const sitemapBlog = path.join(repoRoot, "public", "sitemap-blog.xml");
const origin = "https://www.producerhit.com";
const lastmod = new Date().toISOString().slice(0, 10);

buildSync({
  entryPoints: [path.join(repoRoot, "scripts", "blog-posts-entry.ts")],
  bundle: true,
  platform: "node",
  format: "cjs",
  outfile: outFile,
  logLevel: "silent",
});

const mod = await import(pathToFileURL(outFile).href);
const posts = mod.BLOG_POSTS ?? [];

const CATEGORY_PATHS = [
  "/blog",
  "/blog/category/beat-generator",
  "/blog/category/type-beat",
  "/blog/category/song-vocals",
  "/blog/category/genre-guides",
  "/blog/category/comparisons",
  "/blog/category/workflow",
  "/blog/category/monetization",
  "/blog/category/community",
];

const urls = [
  ...CATEGORY_PATHS.map((p) => ({ loc: `${origin}${p}`, priority: p === "/blog" ? "0.85" : "0.75", changefreq: "weekly" })),
  ...posts.map((p) => ({
    loc: `${origin}/blog/${p.slug}`,
    lastmod: p.updatedAt ?? lastmod,
    priority: "0.72",
    changefreq: "monthly",
  })),
];

const tagSet = new Set();
for (const p of posts) {
  for (const t of p.tags ?? []) tagSet.add(t);
}
for (const tag of tagSet) {
  urls.push({ loc: `${origin}/blog/tag/${tag}`, priority: "0.65", changefreq: "weekly", lastmod });
}

const blogXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod ?? lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

writeFileSync(sitemapBlog, blogXml, "utf8");

let mainXml = readFileSync(sitemapMain, "utf8");
let added = 0;
for (const p of posts) {
  const loc = `${origin}/blog/${p.slug}`;
  if (mainXml.includes(`<loc>${loc}</loc>`)) continue;
  const node = `  <url>
    <loc>${loc}</loc>
    <lastmod>${p.updatedAt ?? lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.72</priority>
  </url>
`;
  mainXml = mainXml.replace("</urlset>", `${node}</urlset>`);
  added += 1;
}

writeFileSync(sitemapMain, mainXml, "utf8");
console.log(`sync-blog-sitemap: ${posts.length} posts → sitemap-blog.xml (+${added} in sitemap.xml)`);
