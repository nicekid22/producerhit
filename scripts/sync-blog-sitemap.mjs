/**
 * Ajoute les URLs /blog/* manquantes dans public/sitemap.xml
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const blogFile = path.join(repoRoot, "src", "content", "blog.ts");
const sitemapFile = path.join(repoRoot, "public", "sitemap.xml");
const origin = "https://www.producerhit.com";
const lastmod = new Date().toISOString().slice(0, 10);

const src = readFileSync(blogFile, "utf8");
const slugs = [];
const slugRe = /slug:\s+"([^"]+)"/g;
let m;
while ((m = slugRe.exec(src)) !== null) slugs.push(m[1]);

let xml = readFileSync(sitemapFile, "utf8");
let added = 0;

for (const slug of slugs) {
  const loc = `${origin}/blog/${slug}`;
  if (xml.includes(`<loc>${loc}</loc>`)) continue;
  const node = `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.72</priority>
  </url>
`;
  xml = xml.replace("</urlset>", `${node}</urlset>`);
  added += 1;
}

writeFileSync(sitemapFile, xml, "utf8");
console.log(`sync-blog-sitemap: ${added} URL(s) added (${slugs.length} total blog posts)`);
