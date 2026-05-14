import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const blogFile = path.join(repoRoot, "src", "content", "blog.ts");
const sitemapFile = path.join(repoRoot, "public", "sitemap.xml");
const rssFile = path.join(repoRoot, "public", "rss.xml");

function slugify(input) {
  return input
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function escapeTsString(s) {
  return s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
}

function formatDateYmd(d) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatRssDate(d) {
  return d.toUTCString();
}

function buildEntryTs(post) {
  const blocks = post.blocks
    .map((b) => {
      if (b.type === "p" || b.type === "h2" || b.type === "h3") {
        return `{ type: "${b.type}", text: \`${escapeTsString(b.text)}\` }`;
      }
      if (b.type === "ul") {
        const items = b.items.map((it) => `\`${escapeTsString(it)}\``).join(", ");
        return `{ type: "ul", items: [${items}] }`;
      }
      throw new Error(`Unknown block type: ${b.type}`);
    })
    .join(",\n      ");

  const keywords = post.keywords.map((k) => `\`${escapeTsString(k)}\``).join(", ");
  return `{
    slug: "${post.slug}",
    title: \`${escapeTsString(post.title)}\`,
    description: \`${escapeTsString(post.description)}\`,
    keywords: [${keywords}],
    publishedAt: "${post.publishedAt}",
    updatedAt: "${post.updatedAt}",
    blocks: [
      ${blocks}
    ],
  }`;
}

async function callOpenAI({ apiKey, model, topic }) {
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "text",
              text: "You write SEO blog posts for a music web app called ProducerHit. Output must be strict JSON only (no markdown), matching the provided schema. Avoid medical/legal claims. Do not mention being an AI. Keep it useful and non-spammy.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Topic: ${topic}\n\nSchema:\n{\n  \"title\": string,\n  \"description\": string (max 180 chars),\n  \"keywords\": string[] (3-8 items),\n  \"blocks\": Array<\n    | { \"type\": \"p\", \"text\": string }\n    | { \"type\": \"h2\", \"text\": string }\n    | { \"type\": \"h3\", \"text\": string }\n    | { \"type\": \"ul\", \"items\": string[] }\n  >\n}\n\nRequirements:\n- Write for keywords like \"AI beat generator\", \"AI music generator\", \"type beat generator AI\", \"generate beats online free\".\n- Include at least 5 headings (h2/h3) and 2 bullet lists.\n- Include one short 'Prompt template' section.\n- Keep tone practical for producers.\n- No links.\n`,
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${text}`);
  }

  const json = await res.json();
  const outputText = json.output_text;
  if (typeof outputText !== "string" || !outputText.trim()) throw new Error("OpenAI returned empty output_text");
  return JSON.parse(outputText);
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY ?? "";
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  let topic = process.env.BLOG_TOPIC ?? "";

  if (!apiKey.trim()) {
    throw new Error("OPENAI_API_KEY is required for auto publishing");
  }

  const now = new Date();
  const ymd = formatDateYmd(now);
  const rssDate = formatRssDate(now);

  const blogSrcBefore = await fs.readFile(blogFile, "utf8");
  const existingSlugs = new Set(Array.from(blogSrcBefore.matchAll(/slug:\s+"([^"]+)"/g)).map((m) => m[1]));

  if (!topic.trim()) {
    const defaultTopics = [
      "AI beat generator: trap type beat prompt template",
      "Generate beats online free: how to iterate fast with seed variations",
      "Type beat generator AI: drill prompts that keep the mix clean",
      "AI music generator: how to improve consistency with short generations",
      "AI beat generator: beginner workflow to get producer-ready results",
    ];
    const firstUnused = defaultTopics.find((t) => !existingSlugs.has(slugify(t))) ?? defaultTopics[0];
    topic = firstUnused;
  }

  const generated = await callOpenAI({ apiKey, model, topic });
  const title = String(generated.title ?? "").trim();
  const description = String(generated.description ?? "").trim();
  const keywords = Array.isArray(generated.keywords) ? generated.keywords.map((x) => String(x).trim()).filter(Boolean) : [];
  const blocks = Array.isArray(generated.blocks) ? generated.blocks : [];

  if (!title || !description || keywords.length < 3 || blocks.length < 6) {
    throw new Error("Generated content is missing required fields");
  }

  const slug = slugify(topic || title);
  const post = {
    slug,
    title,
    description: description.slice(0, 180),
    keywords: keywords.slice(0, 8),
    publishedAt: ymd,
    updatedAt: ymd,
    blocks,
  };

  if (existingSlugs.has(post.slug)) {
    throw new Error(`Post already exists: ${post.slug}`);
  }

  const entry = buildEntryTs(post);
  const insertAt = blogSrcBefore.indexOf("export const BLOG_POSTS: BlogPost[] = [");
  if (insertAt === -1) throw new Error("BLOG_POSTS array not found");
  const bracketAt = blogSrcBefore.indexOf("[", insertAt);
  if (bracketAt === -1) throw new Error("BLOG_POSTS opening bracket not found");
  const blogUpdated = `${blogSrcBefore.slice(0, bracketAt + 1)}\n  ${entry},\n${blogSrcBefore.slice(bracketAt + 1)}`;
  await fs.writeFile(blogFile, blogUpdated, "utf8");

  const url = `https://www.producerhit.com/blog/${post.slug}`;

  const sitemapSrc = await fs.readFile(sitemapFile, "utf8");
  if (!sitemapSrc.includes(url)) {
    const urlNode = `  <url>\n    <loc>${url}</loc>\n    <lastmod>${ymd}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
    const sitemapUpdated = sitemapSrc.replace("</urlset>", `${urlNode}</urlset>`);
    await fs.writeFile(sitemapFile, sitemapUpdated, "utf8");
  }

  const rssSrc = await fs.readFile(rssFile, "utf8");
  if (!rssSrc.includes(url)) {
    const item = `    <item>\n      <title>${post.title.replace(/&/g, "&amp;")}</title>\n      <link>${url}</link>\n      <guid>${url}</guid>\n      <pubDate>${rssDate}</pubDate>\n      <description><![CDATA[${post.description}]]></description>\n    </item>\n`;
    const rssUpdated = rssSrc.replace("  </channel>", `${item}  </channel>`);
    await fs.writeFile(rssFile, rssUpdated, "utf8");
  }

  process.stdout.write(`Published: ${url}\n`);
}

main().catch((err) => {
  process.stderr.write(`${err?.message ?? String(err)}\n`);
  process.exit(1);
});
