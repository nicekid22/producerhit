import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const blogFile = path.join(repoRoot, "src", "content", "blog.ts");
const rssFile = path.join(repoRoot, "public", "rss.xml");

const src = readFileSync(blogFile, "utf8");
const origin = "https://www.producerhit.com";

const posts = [];
const blockRe = /slug:\s+"([^"]+)"[\s\S]*?title:\s+"([^"]+)"[\s\S]*?description:\s+"([^"]+)"[\s\S]*?publishedAt:\s+"([^"]+)"/g;
let m;
while ((m = blockRe.exec(src)) !== null) {
  posts.push({ slug: m[1], title: m[2], description: m[3], publishedAt: m[4] });
}

posts.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));

function rssDate(ymd) {
  const d = new Date(`${ymd}T12:00:00Z`);
  return d.toUTCString();
}

const items = posts
  .map((p) => {
    const url = `${origin}/blog/${p.slug}`;
    const title = p.title.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const desc = p.description.replace(/]]>/g, "]]&gt;");
    return `    <item>
      <title>${title}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${rssDate(p.publishedAt)}</pubDate>
      <description><![CDATA[${desc}]]></description>
    </item>`;
  })
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
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
