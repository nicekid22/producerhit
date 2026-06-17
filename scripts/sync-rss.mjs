import { buildSync } from "esbuild";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repoRoot = process.cwd();
const outFile = path.join(repoRoot, ".tmp", "blog-rss-bundle.cjs");
const rssFile = path.join(repoRoot, "public", "rss.xml");
const origin = "https://www.producerhit.com";

buildSync({
  entryPoints: [path.join(repoRoot, "scripts", "blog-posts-entry.ts")],
  bundle: true,
  platform: "node",
  format: "cjs",
  outfile: outFile,
  logLevel: "silent",
});

const mod = await import(pathToFileURL(outFile).href);
const posts = (mod.BLOG_POSTS ?? []).slice().sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));

function rssDate(ymd) {
  return new Date(`${ymd}T12:00:00Z`).toUTCString();
}

function escXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

const items = posts
  .map((p) => {
    const url = `${origin}/blog/${p.slug}`;
    const og = `${origin}/api/og-blog?slug=${encodeURIComponent(p.slug)}&title=${encodeURIComponent(p.title.slice(0, 80))}${p.categoryId ? `&category=${encodeURIComponent(p.categoryId)}` : ""}`;
    return `    <item>
      <title>${escXml(p.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${rssDate(p.publishedAt)}</pubDate>
      <description><![CDATA[${p.description.replace(/]]>/g, "]]&gt;")}]]></description>
      <enclosure url="${og}" type="image/svg+xml" length="0"/>
    </item>`;
  })
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>ProducerHit Blog</title>
    <link>${origin}/blog</link>
    <description>Guides and tactics to get better beats and music from AI — prompts, workflows, comparisons.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;

writeFileSync(rssFile, xml, "utf8");
console.log(`sync-rss: ${posts.length} items → public/rss.xml`);
