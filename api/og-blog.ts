function hashString(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function gradientStops(seedInput: string) {
  const seed = hashString(seedInput);
  const h1 = seed % 360;
  const h2 = (h1 + 42 + ((seed >>> 8) % 35)) % 360;
  return [
    { offset: "0%", color: `hsl(${h1}, 82%, 48%)` },
    { offset: "100%", color: `hsl(${h2}, 88%, 42%)` },
  ];
}

const CATEGORY_LABEL: Record<string, string> = {
  "beat-generator": "AI Beat Generator",
  "type-beat": "Type Beat",
  "song-vocals": "Song & Vocals",
  "genre-guides": "Genre Guide",
  comparisons: "Comparison",
  workflow: "Workflow",
  monetization: "Monetization",
  community: "Community",
};

export default function handler(req: { query?: Record<string, string | string[] | undefined> }, res: {
  setHeader: (key: string, value: string) => void;
  status: (code: number) => { send: (body: string) => void };
}) {
  const q = req.query ?? {};
  const slug = String(q.slug ?? "blog");
  const title = escapeXml(String(q.title ?? "ProducerHit Blog").slice(0, 72));
  const category = escapeXml(CATEGORY_LABEL[String(q.category ?? "")] ?? "Producer Guide");
  const stops = gradientStops(slug);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      ${stops.map((s) => `<stop offset="${s.offset}" stop-color="${s.color}"/>`).join("")}
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="#07070c"/>
  <rect width="1200" height="630" fill="url(#bg)" opacity="0.88"/>
  <text x="64" y="96" fill="rgba(255,255,255,0.5)" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="600">ProducerHit Blog</text>
  <text x="64" y="280" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="52" font-weight="800">${title}</text>
  <text x="64" y="350" fill="rgba(255,255,255,0.78)" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="600">${category}</text>
  <rect x="64" y="520" width="220" height="44" rx="22" fill="rgba(255,255,255,0.12)"/>
  <text x="174" y="549" text-anchor="middle" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700">Read on producerhit.com</text>
</svg>`;

  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400");
  res.status(200).send(svg);
}
