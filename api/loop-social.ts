type LoopRow = {
  id: string;
  name: string | null;
  genre: string | null;
  mood: string | null;
  bpm: number | null;
  is_public: boolean | null;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildOgImageUrl(row: LoopRow) {
  const origin = "https://www.producerhit.com";
  const params = new URLSearchParams();
  params.set("id", row.id);
  params.set("title", (row.name ?? "Track").slice(0, 80));
  if (row.genre) params.set("genre", row.genre.slice(0, 40));
  if (typeof row.bpm === "number" && row.bpm > 0) params.set("bpm", String(row.bpm));
  return `${origin}/api/og-loop?${params.toString()}`;
}

async function fetchPublicLoop(id: string): Promise<LoopRow | null> {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const endpoint = `${url.replace(/\/$/, "")}/rest/v1/loops?select=id,name,genre,mood,bpm,is_public&id=eq.${encodeURIComponent(id)}&is_public=eq.true&limit=1`;
  const res = await fetch(endpoint, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) return null;
  const rows = (await res.json()) as LoopRow[];
  return rows[0] ?? null;
}

export default async function handler(req: { query?: Record<string, string | string[] | undefined> }, res: {
  setHeader: (key: string, value: string) => void;
  status: (code: number) => { send: (body: string) => void; end: () => void };
}) {
  const id = String(req.query?.id ?? "").trim();
  if (!id) {
    res.status(400).send("Missing id");
    return;
  }

  const row = await fetchPublicLoop(id);
  if (!row) {
    res.status(404).send("Not found");
    return;
  }

  const origin = "https://www.producerhit.com";
  const pageUrl = `${origin}/loop/${encodeURIComponent(id)}`;
  const title = escapeHtml(`${row.name ?? "Track"} — ${row.genre ?? "Beat"} | ProducerHit`);
  const description = escapeHtml(
    [row.genre, row.mood, row.bpm ? `${row.bpm} BPM` : null, "Listen and remix on ProducerHit"].filter(Boolean).join(" · "),
  );
  const image = escapeHtml(buildOgImageUrl(row));

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${title}</title>
  <meta name="description" content="${description}"/>
  <meta property="og:type" content="music.song"/>
  <meta property="og:site_name" content="ProducerHit"/>
  <meta property="og:title" content="${title}"/>
  <meta property="og:description" content="${description}"/>
  <meta property="og:url" content="${pageUrl}"/>
  <meta property="og:image" content="${image}"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${title}"/>
  <meta name="twitter:description" content="${description}"/>
  <meta name="twitter:image" content="${image}"/>
  <meta http-equiv="refresh" content="0;url=${pageUrl}"/>
  <link rel="canonical" href="${pageUrl}"/>
</head>
<body><p><a href="${pageUrl}">Open track on ProducerHit</a></p></body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=3600");
  res.status(200).send(html);
}
