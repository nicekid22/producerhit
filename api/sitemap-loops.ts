const ORIGIN = "https://www.producerhit.com";

function formatDateYmd(d = new Date()) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function urlNode(loc: string, priority = "0.55", changefreq = "monthly") {
  const lastmod = formatDateYmd();
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>
`;
}

type LoopRow = { id: string; created_at?: string | null };

async function fetchPublicLoopIds(limit = 500): Promise<LoopRow[]> {
  const url =
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://pmfnzenqemnonpglmjqx.supabase.co";
  const key =
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";
  if (!key) return [];

  const endpoint =
    `${url.replace(/\/$/, "")}/rest/v1/loops?select=id,created_at` +
    `&is_public=eq.true&audio_url=not.is.null&order=created_at.desc&limit=${limit}`;
  const res = await fetch(endpoint, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) return [];
  const rows = (await res.json()) as LoopRow[];
  return rows.filter((r) => typeof r.id === "string");
}

function buildSitemapXml(rows: LoopRow[]): string | null {
  if (!rows.length) return null;
  const body = rows.map((r) => urlNode(`${ORIGIN}/loop/${encodeURIComponent(r.id)}`)).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

export default async function handler(
  _req: unknown,
  res: {
    setHeader: (key: string, value: string) => void;
    status: (code: number) => { send: (body: string) => void };
  },
) {
  try {
    const rows = await fetchPublicLoopIds(500);
    const xml = buildSitemapXml(rows);
    if (!xml) {
      res.status(503).send("Sitemap temporarily unavailable");
      return;
    }
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    res.status(200).send(xml);
  } catch {
    res.status(503).send("Sitemap temporarily unavailable");
  }
}
