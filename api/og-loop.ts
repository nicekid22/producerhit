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
  const h2 = (h1 + 35 + ((seed >>> 8) % 40)) % 360;
  const h3 = (h2 + 35 + ((seed >>> 16) % 40)) % 360;
  return [
    { offset: "0%", color: `hsl(${h1}, 88%, 52%)` },
    { offset: "50%", color: `hsl(${h2}, 90%, 48%)` },
    { offset: "100%", color: `hsl(${h3}, 85%, 45%)` },
  ];
}

export default function handler(req: { query?: Record<string, string | string[] | undefined> }, res: {
  setHeader: (key: string, value: string) => void;
  status: (code: number) => { send: (body: string) => void };
}) {
  const q = req.query ?? {};
  const id = String(q.id ?? "track");
  const title = escapeXml(String(q.title ?? "ProducerHit Track").slice(0, 72));
  const genre = escapeXml(String(q.genre ?? "AI Beat").slice(0, 32));
  const bpm = String(q.bpm ?? "").trim();
  const subtitle = bpm ? `${genre} · ${escapeXml(bpm)} BPM` : genre;
  const stops = gradientStops(id);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      ${stops.map((s) => `<stop offset="${s.offset}" stop-color="${s.color}"/>`).join("")}
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="35%" r="60%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.22)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#050508"/>
  <rect width="1200" height="630" fill="url(#bg)" opacity="0.92"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <text x="72" y="120" fill="rgba(255,255,255,0.55)" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="600">producerhit</text>
  <text x="72" y="290" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="800">${title}</text>
  <text x="72" y="360" fill="rgba(255,255,255,0.82)" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="600">${subtitle}</text>
  <text x="72" y="560" fill="rgba(255,255,255,0.65)" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="600">Listen · Remix · Generate with AI</text>
</svg>`;

  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400");
  res.status(200).send(svg);
}
