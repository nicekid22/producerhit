import fs from "node:fs";
import path from "node:path";

type PrerenderPage = {
  locale: string;
  pair: string;
  title: string;
  description: string;
  h1: string;
  verdict: string;
  updatedAt: string;
  matrix: Array<{ label: string; values: Array<{ name: string; value: string; highlight?: boolean }> }>;
  faq: Array<{ q: string; a: string }>;
};

type Manifest = { pages: Record<string, PrerenderPage> };

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function loadManifest(): Manifest {
  const file = path.join(process.cwd(), "public", "seo-prerender.json");
  const raw = fs.readFileSync(file, "utf8");
  return JSON.parse(raw) as Manifest;
}

function renderPage(origin: string, pagePath: string, page: PrerenderPage) {
  const canonical = `${origin}${pagePath}`;
  const enUrl = page.locale === "en" ? canonical : `${origin}${page.pair}`;
  const frUrl = page.locale === "fr" ? canonical : `${origin}${page.pair}`;

  const matrixRows = page.matrix
    .map((row) => {
      const cells = row.values
        .map((c) => `<td${c.highlight ? ' style="font-weight:600"' : ""}>${escapeHtml(c.value)}</td>`)
        .join("");
      return `<tr><th scope="row">${escapeHtml(row.label)}</th>${cells}</tr>`;
    })
    .join("");

  const headerCells = page.matrix[0]?.values.map((c) => `<th scope="col">${escapeHtml(c.name)}</th>`).join("") ?? "";

  const faqHtml = page.faq
    .map((f) => `<details><summary>${escapeHtml(f.q)}</summary><p>${escapeHtml(f.a)}</p></details>`)
    .join("");

  const faqJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  });

  return `<!doctype html>
<html lang="${page.locale}">
<head>
  <meta charset="utf-8"/>
  <title>${escapeHtml(page.title)}</title>
  <meta name="description" content="${escapeHtml(page.description)}"/>
  <meta name="robots" content="index,follow"/>
  <link rel="canonical" href="${canonical}"/>
  <link rel="alternate" hreflang="en" href="${enUrl}"/>
  <link rel="alternate" hreflang="fr" href="${frUrl}"/>
  <link rel="alternate" hreflang="x-default" href="${enUrl}"/>
  <meta property="og:type" content="website"/>
  <meta property="og:site_name" content="ProducerHit"/>
  <meta property="og:title" content="${escapeHtml(page.title)}"/>
  <meta property="og:description" content="${escapeHtml(page.description)}"/>
  <meta property="og:url" content="${canonical}"/>
  <meta property="og:image" content="${origin}/og-image.svg"/>
  <script type="application/ld+json">${faqJsonLd}</script>
  <style>
    body{font-family:system-ui,sans-serif;max-width:960px;margin:0 auto;padding:24px;line-height:1.5;color:#111}
    table{border-collapse:collapse;width:100%;margin:24px 0}
    th,td{border:1px solid #ddd;padding:8px;text-align:left;vertical-align:top}
    th{background:#f5f5f5}
    details{margin:12px 0;padding:12px;border:1px solid #eee;border-radius:8px}
    .cta{display:inline-block;margin-top:16px;padding:12px 20px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:999px;font-weight:600}
    .verdict{background:#f3e8ff;border:1px solid #ddd6fe;border-radius:12px;padding:16px;margin:16px 0}
  </style>
</head>
<body>
  <header>
    <p><a href="${origin}/">ProducerHit</a></p>
    <h1>${escapeHtml(page.h1)}</h1>
    <p><small>Updated ${escapeHtml(page.updatedAt)}</small></p>
  </header>
  <section class="verdict"><strong>${page.locale === "fr" ? "Réponse rapide" : "Quick answer"}</strong><p>${escapeHtml(page.verdict)}</p></section>
  <table>
    <thead><tr><th scope="col">${page.locale === "fr" ? "Critère" : "Feature"}</th>${headerCells}</tr></thead>
    <tbody>${matrixRows}</tbody>
  </table>
  <section><h2>FAQ</h2>${faqHtml}</section>
  <p><a class="cta" href="${origin}/auth">${page.locale === "fr" ? "Commencer gratuitement" : "Start free"}</a></p>
  <p><a href="${origin}${pagePath}">Open interactive version</a></p>
</body>
</html>`;
}

export default async function handler(
  req: { query?: Record<string, string | string[] | undefined> },
  res: {
    setHeader: (key: string, value: string) => void;
    status: (code: number) => { send: (body: string) => void; end: () => void };
  },
) {
  const pagePath = String(req.query?.path ?? "").trim();
  if (!pagePath.startsWith("/")) {
    res.status(400).send("Invalid path");
    return;
  }

  let manifest: Manifest;
  try {
    manifest = loadManifest();
  } catch {
    res.status(500).send("SEO manifest missing — run npm run generate:seo");
    return;
  }

  const page = manifest.pages[pagePath];
  if (!page) {
    res.status(404).send("Not found");
    return;
  }

  const origin = "https://www.producerhit.com";
  const html = renderPage(origin, pagePath, page);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400");
  res.status(200).send(html);
}
