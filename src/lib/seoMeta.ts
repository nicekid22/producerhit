import type { AppLocale } from "@/i18n/config";
import { buildLoopPageSeoCopy } from "@/i18n/loopPageSeoCatalog";

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
  locale?: AppLocale;
  /** @deprecated use locale */
  isFr?: boolean;
}): string[] {
  const locale: AppLocale = opts.locale ?? (opts.isFr ? "fr" : "en");
  return buildLoopPageSeoCopy(locale).keywords(opts);
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
  locale?: AppLocale;
  /** @deprecated use locale */
  isFr?: boolean;
  /** Paragraphe unique « à propos » pour meta + JSON-LD */
  seoDescription?: string;
  lyricsSnippet?: string | null;
}) {
  const locale: AppLocale = opts.locale ?? (opts.isFr ? "fr" : "en");
  const seo = buildLoopPageSeoCopy(locale);
  const descriptionParts = [opts.genre, opts.mood, opts.bpm && opts.bpm > 0 ? `${opts.bpm} BPM` : null].filter(Boolean);
  const description = opts.seoDescription?.trim() || descriptionParts.join(" · ") || seo.defaultDescription;

  const recording: Record<string, unknown> = {
    "@type": "MusicRecording",
    "@id": `${opts.pageUrl}#recording`,
    name: opts.name,
    url: opts.pageUrl,
    image: opts.imageUrl,
    description,
    genre: opts.genre || undefined,
    datePublished: opts.createdAt || undefined,
    inLanguage: seo.inLanguage,
    isAccessibleForFree: true,
    publisher: { "@type": "Organization", name: "ProducerHit", url: "https://www.producerhit.com" },
  };

  if (opts.audioUrl) recording.contentUrl = opts.audioUrl;
  if (opts.lyricsSnippet?.trim()) recording.lyricist = { "@type": "Person", name: "AI (Song Mode)" };
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
          { "@type": "ListItem", position: 1, name: seo.home, item: "https://www.producerhit.com/" },
          {
            "@type": "ListItem",
            position: 2,
            name: seo.community,
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
  locale?: AppLocale;
  /** @deprecated use locale */
  isFr?: boolean;
  /** Paragraphe unique « à propos » pour meta + JSON-LD */
  seoDescription?: string;
  lyricsSnippet?: string | null;
}) {
  const locale: AppLocale = opts.locale ?? (opts.isFr ? "fr" : "en");
  const seo = buildLoopPageSeoCopy(locale);
  const pageUrl = `https://www.producerhit.com/loop/${opts.id}`;
  const title = seo.pageTitle(opts.name, opts.genre);

  const description =
    opts.seoDescription?.trim() ||
    [
      opts.name,
      (opts.genre ?? "").trim(),
      opts.mood,
      opts.bpm && opts.bpm > 0 ? `${opts.bpm} BPM` : null,
      seo.ogPitch,
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
    locale,
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
      locale,
      seoDescription: opts.seoDescription,
      lyricsSnippet: opts.lyricsSnippet,
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
