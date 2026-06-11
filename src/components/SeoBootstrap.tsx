import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useLocaleStore } from "@/stores/localeStore";
import { PLAN_LIMITS } from "@/lib/planLimits";
import {
  COMPARISON_PAGE_PATH_SET,
  SEO_PAGE_PATH_SET,
} from "@/generated/marketingRoutePaths";

function setMeta(nameOrProp: string, value: string, kind: "name" | "property") {
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

function setLink(rel: string, href: string, extra?: Record<string, string>) {
  const extras = extra ?? {};
  const selector =
    rel === "alternate" && extras.hreflang
      ? `link[rel="alternate"][hreflang="${extras.hreflang}"]`
      : rel === "alternate" && extras.type
        ? `link[rel="alternate"][type="${extras.type}"]`
        : rel === "canonical"
          ? `link[rel="canonical"]`
          : `link[rel="${rel}"]`;
  let el = document.head.querySelector(selector) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    Object.entries(extras).forEach(([k, v]) => el.setAttribute(k, v));
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setJsonLd(data: unknown) {
  let el = document.getElementById("pk-jsonld") as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.id = "pk-jsonld";
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.text = JSON.stringify(data);
}

function slugKeyFromPath(pathname: string): string {
  if (pathname === "/") return "home";
  if (pathname === "/blog") return "blog";
  if (pathname.startsWith("/blog/")) return "blog-post";
  if (pathname.startsWith("/community/vibe/")) return "community-vibe";
  if (pathname === "/trending") return "trending";
  if (pathname === "/explore" || pathname === "/community") return "explore";
  if (pathname.startsWith("/loop/")) return "loop";
  if (pathname === "/pricing") return "pricing";
  if (pathname === "/legal") return "legal";
  if (pathname === "/auth") return "auth";
  if (pathname === "/dashboard") return "dashboard";
  if (pathname === "/library") return "library";
  if (pathname === "/sample-lab") return "sample-lab";
  if (pathname === "/settings") return "settings";
  if (pathname === "/ai-beat-generator") return "ai-beat-generator";
  if (pathname === "/ai-music-generator") return "ai-music-generator";
  if (pathname === "/type-beat-generator-ai") return "type-beat-generator-ai";
  if (pathname === "/generate-beats-online-free") return "generate-beats-online-free";
  if (COMPARISON_PAGE_PATH_SET.has(pathname)) return "comparison";
  if (SEO_PAGE_PATH_SET.has(pathname)) return "seo-landing";
  return "other";
}

export function SeoBootstrap() {
  const { pathname, search } = useLocation();
  const locale = useLocaleStore((s) => s.locale);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const origin = "https://www.producerhit.com";
      const canonicalUrl = `${origin}${pathname}`;
      const ogImageUrl = `${origin}/og-image.svg`;

      const isAppRoute =
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/library") ||
        pathname.startsWith("/sample-lab") ||
        pathname.startsWith("/settings") ||
        pathname.startsWith("/auth");
      const robots = isAppRoute ? "noindex,nofollow" : "index,follow";

      let seoPage: Awaited<ReturnType<typeof import("@/lib/seoPages").getSeoPageByPath>> = null;
      let comparisonPage: Awaited<ReturnType<typeof import("@/lib/seoComparisons").getComparisonByPath>> = null;
      let blogPost: Awaited<ReturnType<typeof import("@/content/blog").getBlogPostBySlug>> = null;
      let blogPostsPreview: Awaited<typeof import("@/content/blog").BLOG_POSTS> | null = null;

      let getSeoPageLocaleForPath: typeof import("@/lib/seoPages").getSeoPageLocaleForPath | null = null;
      let getSeoPageCanonicalPath: typeof import("@/lib/seoPages").getSeoPageCanonicalPath | null = null;
      let getComparisonLocaleForPath: typeof import("@/lib/seoComparisons").getComparisonLocaleForPath | null = null;
      let getComparisonCanonicalPath: typeof import("@/lib/seoComparisons").getComparisonCanonicalPath | null = null;

      if (COMPARISON_PAGE_PATH_SET.has(pathname)) {
        const mod = await import("@/lib/seoComparisons");
        if (cancelled) return;
        comparisonPage = mod.getComparisonByPath(pathname);
        getComparisonLocaleForPath = mod.getComparisonLocaleForPath;
        getComparisonCanonicalPath = mod.getComparisonCanonicalPath;
      }

      if (!comparisonPage && SEO_PAGE_PATH_SET.has(pathname)) {
        const mod = await import("@/lib/seoPages");
        if (cancelled) return;
        seoPage = mod.getSeoPageByPath(pathname);
        getSeoPageLocaleForPath = mod.getSeoPageLocaleForPath;
        getSeoPageCanonicalPath = mod.getSeoPageCanonicalPath;
      }

      const blogSlug = pathname.startsWith("/blog/") ? pathname.replace("/blog/", "").split("/")[0] : null;
      if (blogSlug) {
        const mod = await import("@/content/blog");
        if (cancelled) return;
        blogPost = mod.getBlogPostBySlug(blogSlug);
      } else if (pathname === "/blog") {
        const mod = await import("@/content/blog");
        if (cancelled) return;
        blogPostsPreview = mod.BLOG_POSTS.slice(0, 20);
      }

      const comparisonLocale = comparisonPage && getComparisonLocaleForPath
        ? getComparisonLocaleForPath(pathname)
        : locale;
      const seoPageLocale = seoPage && getSeoPageLocaleForPath ? getSeoPageLocaleForPath(pathname) : locale;
      const contentLocale = comparisonPage ? comparisonLocale : seoPage ? seoPageLocale : locale;

      const slugKey = slugKeyFromPath(pathname);

      if (slugKey === "community-vibe" || slugKey === "trending") {
        return;
      }

      const t = (en: string, fr: string) => (locale === "fr" ? fr : en);

      const title = (() => {
        if (comparisonPage) return contentLocale === "fr" ? comparisonPage.titleFr : comparisonPage.titleEn;
        if (seoPage) return contentLocale === "fr" ? seoPage.titleFr : seoPage.titleEn;
        if (slugKey === "home")
          return t(
            "ProducerHit — AI Song Creator & Type Beat Generator | Royalty-Free",
            "ProducerHit — Créateur de chansons IA & générateur de type beats | Royalty-free",
          );
        if (slugKey === "blog") return t("Blog — ProducerHit", "Blog — ProducerHit");
        if (slugKey === "blog-post") return t("Blog — ProducerHit", "Blog — ProducerHit");
        if (slugKey === "explore")
          return t(
            "Community AI beats — listen, remix & create | ProducerHit",
            "Beats IA communauté — écoute, remixe & crée | ProducerHit",
          );
        if (slugKey === "loop") return t("Track — ProducerHit", "Track — ProducerHit");
        if (slugKey === "pricing") return t("Pricing — ProducerHit", "Tarifs — ProducerHit");
        if (slugKey === "auth") return t("Sign Up Free — ProducerHit", "Inscription gratuite — ProducerHit");
        if (slugKey === "dashboard") return t("My Studio — ProducerHit", "Mon studio — ProducerHit");
        if (slugKey === "library") return t("My Library — ProducerHit", "Ma bibliothèque — ProducerHit");
        if (slugKey === "sample-lab") return t("AI Sample Lab — ProducerHit", "AI Sample Lab — ProducerHit");
        if (slugKey === "settings") return t("Settings — ProducerHit", "Paramètres — ProducerHit");
        if (slugKey === "ai-beat-generator")
          return t(
            "AI Beat Generator — Create Type Beats Online | ProducerHit",
            "Générateur de beats IA — Type beats en ligne | ProducerHit",
          );
        if (slugKey === "ai-music-generator")
          return t(
            "AI Music Generator — Generate Songs & Beats | ProducerHit",
            "Générateur de musique IA — Songs & beats | ProducerHit",
          );
        if (slugKey === "type-beat-generator-ai")
          return t(
            "Type Beat Generator AI — Producer-Ready Beats | ProducerHit",
            "Type beat generator IA — Beats pro | ProducerHit",
          );
        if (slugKey === "generate-beats-online-free")
          return t(
            "Generate Beats Online Free — AI Beat Generator | ProducerHit",
            "Générer des beats en ligne gratuit — IA | ProducerHit",
          );
        if (slugKey === "legal") return t("Legal — ProducerHit", "Mentions légales — ProducerHit");
        return t("ProducerHit — AI Beat Generator", "ProducerHit — Générateur de beats IA");
      })();

      const description = (() => {
        if (comparisonPage) return contentLocale === "fr" ? comparisonPage.descriptionFr : comparisonPage.descriptionEn;
        if (seoPage) return contentLocale === "fr" ? seoPage.descriptionFr : seoPage.descriptionEn;
        if (slugKey === "home")
          return t(
            "ProducerHit is an AI song creator and type beat generator: Song Mode, Remix covers, royalty-free MP3/WAV exports, video clips, and mastering — Spotify Ready for producers and artists.",
            "ProducerHit est un créateur de chansons IA et générateur de type beats : Song Mode, covers Remix, exports MP3/WAV royalty-free, clips vidéo et mastering — Spotify Ready pour producteurs et artistes.",
          );
        if (slugKey === "ai-beat-generator")
          return t(
            "Use ProducerHit as your AI beat generator: generate type beats fast, try 2 versions, and refine with seed-based variations. Export MP3/WAV.",
            "Utilise ProducerHit comme générateur de beats IA : crée des type beats rapidement, génère 2 versions, et fais des variations via seed. Export MP3/WAV.",
          );
        if (slugKey === "ai-music-generator")
          return t(
            "AI music generator for songs and type beats. Describe a vibe, generate, iterate with variations, and export your track.",
            "Générateur de musique IA pour chansons et type beats. Décris une vibe, génère, itère avec des variations, et exporte ton track.",
          );
        if (slugKey === "type-beat-generator-ai")
          return t(
            "Type beat generator AI built for producers: modern genres, clean mix, quick iterations, and reproducible seeds for variations.",
            "Type beat generator IA pensé pour les producteurs : genres modernes, mix clean, itérations rapides, seeds reproductibles.",
          );
        if (slugKey === "generate-beats-online-free")
          return t(
            "Generate beats online free with ProducerHit. Start with short clips, pick the best version, then iterate with variations. Export MP3 (free) and WAV (Pro).",
            "Génère des beats en ligne gratuitement avec ProducerHit. Commence par des clips courts, choisis la meilleure version, puis itère avec des variations. Export MP3 (gratuit) et WAV (Pro).",
          );
        if (slugKey === "blog")
          return t(
            "ProducerHit blog: guides, prompts, and workflows for AI beat generators and AI music generators.",
            "Blog ProducerHit : guides, prompts et workflows pour générer des beats et de la musique avec l’IA.",
          );
        if (slugKey === "explore")
          return t(
            "Stream public AI beats on ProducerHit: community feed, ratings, comments, remix workflows, and vibe pages (Trap, Lo-Fi, R&B…).",
            "Écoute des beats IA publics sur ProducerHit : flux communautaire, notes, commentaires, remix et pages vibes (Trap, Lo-Fi, R&B…).",
          );
        if (slugKey === "loop")
          return t(
            "Listen to a public track made with ProducerHit, then remix a similar version using seed-based variation.",
            "Écoute un track public créé avec ProducerHit, puis remix une version similaire grâce aux variations via seed.",
          );
        if (slugKey === "pricing")
          return t(
            "Simple pricing for AI beats and AI songs. Upgrade for more credits and WAV exports.",
            "Tarifs simples pour beats IA et songs IA. Upgrade pour plus de crédits et l’export WAV.",
          );
        return t(
          "ProducerHit is an AI beat generator to create type beats online.",
          "ProducerHit est un générateur de beats IA pour créer des type beats en ligne.",
        );
      })();

      const effectiveTitle = blogPost ? `${blogPost.title} | ProducerHit` : title;
      const effectiveDescription = blogPost ? blogPost.description : description;
      const effectiveCanonicalUrl = (() => {
        if (blogPost) return `${origin}/blog/${blogPost.slug}`;
        if (comparisonPage && getComparisonCanonicalPath && getComparisonLocaleForPath) {
          const pageLocale = getComparisonLocaleForPath(pathname);
          return `${origin}${getComparisonCanonicalPath(comparisonPage, pageLocale)}`;
        }
        if (seoPage && getSeoPageCanonicalPath && getSeoPageLocaleForPath) {
          const pageLocale = getSeoPageLocaleForPath(pathname);
          return `${origin}${getSeoPageCanonicalPath(seoPage, pageLocale)}`;
        }
        if (slugKey === "explore") return `${origin}/community`;
        return canonicalUrl;
      })();

      if (cancelled) return;

      document.title = effectiveTitle;
      setMeta("description", effectiveDescription, "name");
      setMeta("robots", robots, "name");
      setMeta("googlebot", robots, "name");
      setMeta(
        "keywords",
        blogPost
          ? blogPost.keywords.join(", ")
          : comparisonPage
            ? comparisonPage.keywords.join(", ")
            : seoPage
              ? seoPage.keywords.join(", ")
              : "",
        "name",
      );

      setMeta("og:type", blogPost ? "article" : "website", "property");
      setMeta("og:site_name", "ProducerHit", "property");
      setMeta("og:title", effectiveTitle, "property");
      setMeta("og:description", effectiveDescription, "property");
      setMeta("og:url", effectiveCanonicalUrl, "property");
      setMeta("og:image", ogImageUrl, "property");
      if (blogPost) {
        setMeta("article:published_time", `${blogPost.publishedAt}T00:00:00.000Z`, "property");
        setMeta("article:modified_time", `${blogPost.updatedAt}T00:00:00.000Z`, "property");
      } else {
        setMeta("article:published_time", "", "property");
        setMeta("article:modified_time", "", "property");
      }
      setMeta("twitter:card", "summary_large_image", "name");
      setMeta("twitter:title", effectiveTitle, "name");
      setMeta("twitter:description", effectiveDescription, "name");
      setMeta("twitter:image", ogImageUrl, "name");

      setLink("canonical", effectiveCanonicalUrl);
      setLink("alternate", `${origin}/rss.xml`, { type: "application/rss+xml", title: "ProducerHit Blog RSS" });
      if (comparisonPage) {
        setLink("alternate", `${origin}${comparisonPage.path}`, { hreflang: "en" });
        setLink("alternate", `${origin}${comparisonPage.pathFr}`, { hreflang: "fr" });
        setLink("alternate", `${origin}${comparisonPage.path}`, { hreflang: "x-default" });
      } else if (seoPage) {
        setLink("alternate", `${origin}${seoPage.path}`, { hreflang: "en" });
        setLink("alternate", `${origin}${seoPage.pathFr}`, { hreflang: "fr" });
        setLink("alternate", `${origin}${seoPage.path}`, { hreflang: "x-default" });
      } else {
        setLink("alternate", `${origin}${pathname}?lang=en`, { hreflang: "en" });
        setLink("alternate", `${origin}${pathname}?lang=fr`, { hreflang: "fr" });
      }

      const faq = (items: { q: string; a: string }[]) => ({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((x) => ({
          "@type": "Question",
          name: x.q,
          acceptedAnswer: { "@type": "Answer", text: x.a },
        })),
      });

      const baseJsonLd = [
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "ProducerHit",
          url: origin,
        },
        {
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "ProducerHit",
          applicationCategory: "MusicApplication",
          operatingSystem: "Web Browser",
          url: canonicalUrl,
          description,
          offers: [
            {
              "@type": "Offer",
              name: "Free Plan",
              price: "0",
              priceCurrency: "EUR",
              description: `${PLAN_LIMITS.free} AI generated tracks per month`,
            },
            {
              "@type": "Offer",
              name: "Pro Plan",
              price: "10",
              priceCurrency: "EUR",
              description: `${PLAN_LIMITS.pro} AI generated tracks per month`,
            },
            {
              "@type": "Offer",
              name: "Studio Plan",
              price: "30",
              priceCurrency: "EUR",
              description: `${PLAN_LIMITS.studio} AI generated tracks per month`,
            },
            {
              "@type": "Offer",
              name: "Plus Plan",
              price: "89",
              priceCurrency: "EUR",
              description: `${PLAN_LIMITS.plus} AI generated tracks per month`,
            },
          ],
          creator: { "@type": "Organization", name: "ProducerHit", url: origin },
          featureList: [
            "AI Beat Generation",
            "AI Song Generation with Vocals",
            "Type Beat Mode",
            "Song Mode",
            "MP3 and WAV Download",
            "Multiple Genres",
            "BPM and Key Control",
            "Seed Variations",
          ],
        },
      ];

      if (seoPage && getSeoPageCanonicalPath) {
        const faqItems = contentLocale === "fr" ? seoPage.faqFr : seoPage.faqEn;
        setJsonLd([
          ...baseJsonLd,
          ...(faqItems.length ? [faq(faqItems)] : []),
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: contentLocale === "fr" ? seoPage.h1Fr : seoPage.h1En,
            description: contentLocale === "fr" ? seoPage.descriptionFr : seoPage.descriptionEn,
            url: `${origin}${getSeoPageCanonicalPath(seoPage, seoPageLocale)}`,
            inLanguage: seoPageLocale,
            isPartOf: { "@type": "WebSite", name: "ProducerHit", url: origin },
          },
        ]);
        return;
      }

      if (slugKey === "blog" && blogPostsPreview) {
        setJsonLd([
          ...baseJsonLd,
          {
            "@context": "https://schema.org",
            "@type": "Blog",
            name: "ProducerHit Blog",
            url: `${origin}/blog`,
            blogPost: blogPostsPreview.map((p) => ({
              "@type": "BlogPosting",
              headline: p.title,
              description: p.description,
              datePublished: p.publishedAt,
              dateModified: p.updatedAt,
              url: `${origin}/blog/${p.slug}`,
            })),
          },
        ]);
        return;
      }

      if (slugKey === "explore") {
        setJsonLd([
          ...baseJsonLd,
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: locale === "fr" ? "Flux communauté ProducerHit" : "ProducerHit Community Feed",
            url: `${origin}/community`,
            description:
              locale === "fr"
                ? "Beats IA publics, remix et vibes communautaires"
                : "Public AI beats, remix culture, and community vibes",
          },
        ]);
        return;
      }

      if (slugKey === "blog-post" && blogPost) {
        setJsonLd([
          ...baseJsonLd,
          {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: blogPost.title,
            description: blogPost.description,
            datePublished: blogPost.publishedAt,
            dateModified: blogPost.updatedAt,
            url: `${origin}/blog/${blogPost.slug}`,
            isPartOf: { "@type": "Blog", name: "ProducerHit Blog", url: `${origin}/blog` },
            author: { "@type": "Organization", name: "ProducerHit", url: origin },
            publisher: { "@type": "Organization", name: "ProducerHit", url: origin },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
              { "@type": "ListItem", position: 2, name: "Blog", item: `${origin}/blog` },
              { "@type": "ListItem", position: 3, name: blogPost.title, item: `${origin}/blog/${blogPost.slug}` },
            ],
          },
        ]);
        return;
      }

      if (comparisonPage && getComparisonCanonicalPath) {
        const faqItems = contentLocale === "fr" ? comparisonPage.faqFr : comparisonPage.faqEn;
        setJsonLd([
          ...baseJsonLd,
          faq(faqItems),
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: contentLocale === "fr" ? comparisonPage.h1Fr : comparisonPage.h1En,
            description: contentLocale === "fr" ? comparisonPage.descriptionFr : comparisonPage.descriptionEn,
            url: `${origin}${getComparisonCanonicalPath(comparisonPage, comparisonLocale)}`,
            dateModified: comparisonPage.updatedAt,
            inLanguage: comparisonLocale,
            isPartOf: { "@type": "WebSite", name: "ProducerHit", url: origin },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
              {
                "@type": "ListItem",
                position: 2,
                name: contentLocale === "fr" ? "Comparatifs" : "Comparisons",
                item: `${origin}${comparisonPage.pathFr}`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: contentLocale === "fr" ? comparisonPage.h1Fr : comparisonPage.h1En,
                item: `${origin}${getComparisonCanonicalPath(comparisonPage, comparisonLocale)}`,
              },
            ],
          },
        ]);
        return;
      }

      if (slugKey === "home" || slugKey === "pricing") {
        setJsonLd([
          ...baseJsonLd,
          faq([
            {
              q: "Can I use the generated music commercially?",
              a: "You can download and use the audio you generate. For commercial releases, always make sure you are comfortable with the underlying model provider terms and your platform rules.",
            },
            {
              q: "Does ProducerHit generate full songs with vocals?",
              a: "Yes. Song Mode generates complete songs with vocals, verse-chorus structure and professional mix quality. Type Beat Mode generates instrumental beats for producers.",
            },
            {
              q: "What genres does ProducerHit support?",
              a: "ProducerHit supports multiple genres including Trap, Drill, 90s R&B, Neo Soul, Afrobeats, Amapiano, Reggaeton, Jersey Club, Pop, UK Garage, Hyperpop, Baile Funk, Afrotrap and Dancehall.",
            },
            {
              q: "How fast does ProducerHit generate music?",
              a: "Most beats and songs generate in about 20 to 45 seconds depending on the length and complexity.",
            },
            { q: "Can I download beats as WAV files?", a: "Yes. ProducerHit supports MP3 downloads and WAV exports on paid plans." },
          ]),
        ]);
        return;
      }

      setJsonLd(baseJsonLd);
      void search;
    })();

    return () => {
      cancelled = true;
    };
  }, [locale, pathname, search]);

  return null;
}
