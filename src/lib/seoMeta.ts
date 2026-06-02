export function setDocumentMeta(nameOrProp: string, value: string, kind: "name" | "property") {
  if (typeof document === "undefined") return;
  const selector = kind === "name" ? `meta[name="${nameOrProp}"]` : `meta[property="${nameOrProp}"]`;
  let el = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    if (kind === "name") el.setAttribute("name", nameOrProp);
    else el.setAttribute("property", nameOrProp);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

export function setCanonicalLink(href: string) {
  if (typeof document === "undefined") return;
  let el = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.href = href;
}

export function setJsonLdScript(id: string, data: unknown) {
  if (typeof document === "undefined") return;
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.id = id;
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export function buildLoopKeywords(opts: {
  name: string;
  genre?: string;
  mood?: string;
  bpm?: number | null;
  isFr?: boolean;
}): string[] {
  const genre = (opts.genre ?? "").trim();
  const mood = (opts.mood ?? "").trim();
  const name = (opts.name ?? "").trim();
  const bpm = typeof opts.bpm === "number" && opts.bpm > 0 ? `${opts.bpm} BPM` : "";
  if (opts.isFr) {
    return [
      "beat IA",
      "type beat IA",
      "générateur beats IA",
      genre ? `beat ${genre} IA` : "",
      mood ? `beat ${mood}` : "",
      name,
      bpm,
      "ProducerHit",
      "remix IA",
    ].filter(Boolean);
  }
  return [
    "AI beat",
    "AI type beat",
    "AI beat generator",
    genre ? `${genre} AI beat` : "",
    mood ? `${mood} beat` : "",
    name,
    bpm,
    "ProducerHit",
    "AI remix",
  ].filter(Boolean);
}

export function buildLoopStructuredData(opts: {
  id: string;
  name: string;
  genre?: string;
  mood?: string;
  bpm?: number | null;
  prompt?: string;
  createdAt?: string;
  pageUrl: string;
  audioUrl?: string | null;
  imageUrl: string;
  authorName?: string | null;
  ratingValue?: number | null;
  ratingCount?: number;
  isFr?: boolean;
}) {
  const descriptionParts = [opts.genre, opts.mood, opts.bpm && opts.bpm > 0 ? `${opts.bpm} BPM` : null].filter(Boolean);
  const description =
    descriptionParts.join(" · ") ||
    (opts.isFr ? "Track IA public sur ProducerHit" : "Public AI track on ProducerHit");

  const recording: Record<string, unknown> = {
    "@type": "MusicRecording",
    "@id": `${opts.pageUrl}#recording`,
    name: opts.name,
    url: opts.pageUrl,
    image: opts.imageUrl,
    description,
    genre: opts.genre || undefined,
    datePublished: opts.createdAt || undefined,
    inLanguage: opts.isFr ? "fr" : "en",
    isAccessibleForFree: true,
    publisher: { "@type": "Organization", name: "ProducerHit", url: "https://www.producerhit.com" },
  };

  if (opts.audioUrl) recording.contentUrl = opts.audioUrl;
  if (opts.authorName) recording.byArtist = { "@type": "Person", name: opts.authorName };
  if (typeof opts.ratingValue === "number" && opts.ratingCount && opts.ratingCount > 0) {
    recording.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: opts.ratingValue,
      ratingCount: opts.ratingCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: opts.isFr ? "Accueil" : "Home", item: "https://www.producerhit.com/" },
          {
            "@type": "ListItem",
            position: 2,
            name: opts.isFr ? "Communauté" : "Community",
            item: "https://www.producerhit.com/community",
          },
          { "@type": "ListItem", position: 3, name: opts.name, item: opts.pageUrl },
        ],
      },
      {
        "@type": "WebPage",
        "@id": opts.pageUrl,
        url: opts.pageUrl,
        name: opts.name,
        description,
        primaryImageOfPage: opts.imageUrl,
        isPartOf: { "@type": "WebSite", name: "ProducerHit", url: "https://www.producerhit.com" },
        mainEntity: { "@id": `${opts.pageUrl}#recording` },
      },
      recording,
    ],
  };
}

export function setLoopOpenGraph(opts: {
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  keywords?: string[];
  audioUrl?: string | null;
}) {
  document.title = opts.title;
  setDocumentMeta("description", opts.description, "name");
  setCanonicalLink(opts.url);
  if (opts.keywords?.length) setDocumentMeta("keywords", opts.keywords.join(", "), "name");
  setDocumentMeta("og:type", "music.song", "property");
  setDocumentMeta("og:site_name", "ProducerHit", "property");
  setDocumentMeta("og:title", opts.title, "property");
  setDocumentMeta("og:description", opts.description, "property");
  setDocumentMeta("og:url", opts.url, "property");
  setDocumentMeta("og:image", opts.imageUrl, "property");
  if (opts.audioUrl) setDocumentMeta("og:audio", opts.audioUrl, "property");
  setDocumentMeta("twitter:card", "summary_large_image", "name");
  setDocumentMeta("twitter:title", opts.title, "name");
  setDocumentMeta("twitter:description", opts.description, "name");
  setDocumentMeta("twitter:image", opts.imageUrl, "name");
}

export function setLoopPageSeo(opts: {
  id: string;
  name: string;
  genre?: string;
  mood?: string;
  bpm?: number | null;
  prompt?: string;
  createdAt?: string;
  audioUrl?: string | null;
  coverImageUrl: string;
  authorName?: string | null;
  ratingValue?: number | null;
  ratingCount?: number;
  isFr?: boolean;
}) {
  const pageUrl = `https://www.producerhit.com/loop/${opts.id}`;
  const genreLabel = (opts.genre ?? "").trim();
  const title = genreLabel
    ? `${opts.name} — ${genreLabel} ${opts.isFr ? "IA" : "AI"} | ProducerHit`
    : `${opts.name} — ${opts.isFr ? "Track IA" : "AI Track"} | ProducerHit`;

  const description = [
    opts.name,
    genreLabel,
    opts.mood,
    opts.bpm && opts.bpm > 0 ? `${opts.bpm} BPM` : null,
    opts.isFr
      ? "Écoute ce beat IA, remixe la vibe et crée le tien gratuitement sur ProducerHit."
      : "Listen to this AI beat, remix the vibe, and create your own free on ProducerHit.",
  ]
    .filter(Boolean)
    .join(" · ");

  const ogImage = buildOgLoopImageUrl({
    id: opts.id,
    title: opts.name,
    genre: opts.genre,
    bpm: opts.bpm,
  });

  const imageUrl = opts.coverImageUrl || ogImage;
  const keywords = buildLoopKeywords({
    name: opts.name,
    genre: opts.genre,
    mood: opts.mood,
    bpm: opts.bpm,
    isFr: opts.isFr,
  });

  setLoopOpenGraph({
    title,
    description,
    url: pageUrl,
    imageUrl,
    keywords,
    audioUrl: opts.audioUrl,
  });

  setJsonLdScript(
    "pk-loop-jsonld",
    buildLoopStructuredData({
      id: opts.id,
      name: opts.name,
      genre: opts.genre,
      mood: opts.mood,
      bpm: opts.bpm,
      prompt: opts.prompt,
      createdAt: opts.createdAt,
      pageUrl,
      audioUrl: opts.audioUrl,
      imageUrl,
      authorName: opts.authorName,
      ratingValue: opts.ratingValue,
      ratingCount: opts.ratingCount,
      isFr: opts.isFr,
    }),
  );
}

export function buildOgLoopImageUrl(opts: { id: string; title: string; genre?: string; bpm?: number | null }) {
  const origin = "https://www.producerhit.com";
  const params = new URLSearchParams();
  params.set("id", opts.id);
  params.set("title", opts.title.slice(0, 80));
  if (opts.genre) params.set("genre", opts.genre.slice(0, 40));
  if (typeof opts.bpm === "number" && opts.bpm > 0) params.set("bpm", String(opts.bpm));
  return `${origin}/api/og-loop?${params.toString()}`;
}
