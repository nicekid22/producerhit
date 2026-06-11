/**
 * Prerender HTML crawlable pour /community, /community/vibe/* et /trending (Googlebot).
 */

const ORIGIN = "https://www.producerhit.com";

const VIBES: Record<string, { en: { title: string; desc: string }; fr: { title: string; desc: string } }> = {
  bedroom: {
    en: { title: "Bedroom AI beats", desc: "R&B, neo-soul & intimate late-night AI beats from the ProducerHit community." },
    fr: { title: "Beats Bedroom IA", desc: "R&B, neo-soul & vibes intimes — beats IA communauté ProducerHit." },
  },
  "night-drive": {
    en: { title: "Night Drive AI beats", desc: "Synthwave, phonk & midnight lane AI beats — community feed." },
    fr: { title: "Beats Night Drive IA", desc: "Synthwave, phonk & routes nocturnes — flux communauté." },
  },
  club: {
    en: { title: "Club & Dance AI beats", desc: "House, techno, EDM & dancefloor AI beats to remix." },
    fr: { title: "Beats Club & Dance IA", desc: "House, techno, EDM — beats IA à remixer." },
  },
  hiphop: {
    en: { title: "Hip-Hop Lab AI beats", desc: "Trap, drill, boom bap & street AI beats — remix ready." },
    fr: { title: "Hip-Hop Lab beats IA", desc: "Trap, drill, boom bap — beats IA communauté." },
  },
  lofi: {
    en: { title: "Lo-Fi & Chill AI beats", desc: "Study, rain & coffee AI beats from real creators." },
    fr: { title: "Lo-Fi & Chill beats IA", desc: "Études, pluie & café — beats IA publics." },
  },
  cinematic: {
    en: { title: "Cinematic AI beats", desc: "Ambient, orchestral & score AI beats on ProducerHit." },
    fr: { title: "Beats Cinematic IA", desc: "Ambiant, orchestral & scores — communauté ProducerHit." },
  },
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pageMeta(path: string) {
  if (path === "/community") {
    return {
      title: "Community AI beats — listen, remix & create | ProducerHit",
      description:
        "Stream public AI beats on ProducerHit: community feed, ratings, comments, remix workflows, and vibe pages.",
      h1: "The Feed — Community AI beats",
      links: [
        { href: "/trending", label: "Trending AI beats" },
        { href: "/community/vibe/hiphop", label: "Hip-Hop Lab" },
        { href: "/community/vibe/lofi", label: "Lo-Fi & Chill" },
        { href: "/remix-cover-ai", label: "AI remix guide" },
        { href: "/best-ai-beat-generator-for-producers", label: "Best AI beat generator" },
      ],
    };
  }
  if (path === "/trending") {
    return {
      title: "Trending AI beats 2026 — remix hot vibes | ProducerHit",
      description:
        "Most-loved AI beats right now on ProducerHit. Stream TikTok-ready trending tracks and remix community vibes.",
      h1: "Trending AI beats 2026",
      links: [
        { href: "/community", label: "Community feed" },
        { href: "/suno-alternatives", label: "Suno alternatives" },
        { href: "/ai-music-generator-comparison-2026", label: "AI music comparison 2026" },
        { href: "/remix-cover-ai", label: "Remix cover AI" },
      ],
    };
  }
  const vibeMatch = path.match(/^\/community\/vibe\/([a-z-]+)$/);
  if (vibeMatch) {
    const id = vibeMatch[1]!;
    const vibe = VIBES[id];
    if (!vibe) return null;
    return {
      title: `${vibe.en.title} — community | ProducerHit`,
      description: vibe.en.desc,
      h1: vibe.en.title,
      links: [
        { href: "/community", label: "All vibes" },
        { href: "/trending", label: "Trending" },
        { href: `/community/vibe/${id}`, label: vibe.en.title },
      ],
    };
  }
  return null;
}

export default async function handler(
  req: { query?: Record<string, string | string[] | undefined> },
  res: {
    setHeader: (key: string, value: string) => void;
    status: (code: number) => { send: (body: string) => void };
  },
) {
  const rawPath = String(req.query?.path ?? "/community").trim();
  const path = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
  const meta = pageMeta(path);
  if (!meta) {
    res.status(404).send("Not found");
    return;
  }

  const pageUrl = `${ORIGIN}${path}`;
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const h1 = escapeHtml(meta.h1);
  const linksHtml = meta.links
    .map((l) => `<li><a href="${ORIGIN}${l.href}">${escapeHtml(l.label)}</a></li>`)
    .join("");

  const jsonLd = escapeHtml(
    JSON.stringify({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: meta.h1,
      url: pageUrl,
      description: meta.description,
      isPartOf: { "@type": "WebSite", name: "ProducerHit", url: ORIGIN },
    }),
  );

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${title}</title>
  <meta name="description" content="${description}"/>
  <meta name="robots" content="index,follow"/>
  <link rel="canonical" href="${pageUrl}"/>
  <meta property="og:type" content="website"/>
  <meta property="og:title" content="${title}"/>
  <meta property="og:description" content="${description}"/>
  <meta property="og:url" content="${pageUrl}"/>
  <script type="application/ld+json">${jsonLd}</script>
</head>
<body>
  <main>
    <h1>${h1}</h1>
    <p>${description}</p>
    <ul>${linksHtml}</ul>
    <p><a href="${pageUrl}">Open on ProducerHit</a></p>
  </main>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=3600");
  res.status(200).send(html);
}
