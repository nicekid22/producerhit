import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthBootstrap } from "@/components/AuthBootstrap";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RouteFade } from "@/components/RouteFade";
import { LoopsBootstrap } from "@/components/LoopsBootstrap";
import { ThemeBootstrap } from "@/components/ThemeBootstrap";
import { AppToaster } from "@/components/AppToaster";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Library from "@/pages/Library";
import Pricing from "@/pages/Pricing";
import Settings from "@/pages/Settings";
import Legal from "@/pages/Legal";
import { AudioPlayer } from "@/components/AudioPlayer";
import { useLocaleStore } from "@/stores/localeStore";
import { BLOG_POSTS, getBlogPostBySlug } from "@/content/blog";

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

function SeoBootstrap() {
  const { pathname, search } = useLocation();
  const locale = useLocaleStore((s) => s.locale);

  useEffect(() => {
    const origin = "https://www.producerhit.com";
    const canonicalUrl = `${origin}${pathname}`;
    const ogImageUrl = `${origin}/og-image.svg`;

    const isAppRoute =
      pathname.startsWith("/dashboard") || pathname.startsWith("/library") || pathname.startsWith("/settings") || pathname.startsWith("/auth");
    const robots = isAppRoute ? "noindex,nofollow" : "index,follow";

    const slugKey = (() => {
      if (pathname === "/") return "home";
      if (pathname === "/blog") return "blog";
      if (pathname.startsWith("/blog/")) return "blog-post";
      if (pathname === "/pricing") return "pricing";
      if (pathname === "/legal") return "legal";
      if (pathname === "/auth") return "auth";
      if (pathname === "/dashboard") return "dashboard";
      if (pathname === "/library") return "library";
      if (pathname === "/settings") return "settings";
      if (pathname === "/ai-beat-generator") return "ai-beat-generator";
      if (pathname === "/ai-music-generator") return "ai-music-generator";
      if (pathname === "/type-beat-generator-ai") return "type-beat-generator-ai";
      if (pathname === "/generate-beats-online-free") return "generate-beats-online-free";
      return "other";
    })();

    const t = (en: string, fr: string) => (locale === "fr" ? fr : en);

    const title = (() => {
      if (slugKey === "home") return t("ProducerHit — AI Beat Generator & AI Music Generator", "ProducerHit — Générateur de beats IA & musique IA");
      if (slugKey === "blog") return t("Blog — ProducerHit", "Blog — ProducerHit");
      if (slugKey === "blog-post") return t("Blog — ProducerHit", "Blog — ProducerHit");
      if (slugKey === "pricing") return t("Pricing — ProducerHit", "Tarifs — ProducerHit");
      if (slugKey === "auth") return t("Sign Up Free — ProducerHit", "Inscription gratuite — ProducerHit");
      if (slugKey === "dashboard") return t("My Studio — ProducerHit", "Mon studio — ProducerHit");
      if (slugKey === "library") return t("My Library — ProducerHit", "Ma bibliothèque — ProducerHit");
      if (slugKey === "settings") return t("Settings — ProducerHit", "Paramètres — ProducerHit");
      if (slugKey === "ai-beat-generator") return t("AI Beat Generator — Create Type Beats Online | ProducerHit", "Générateur de beats IA — Type beats en ligne | ProducerHit");
      if (slugKey === "ai-music-generator") return t("AI Music Generator — Generate Songs & Beats | ProducerHit", "Générateur de musique IA — Songs & beats | ProducerHit");
      if (slugKey === "type-beat-generator-ai") return t("Type Beat Generator AI — Producer-Ready Beats | ProducerHit", "Type beat generator IA — Beats pro | ProducerHit");
      if (slugKey === "generate-beats-online-free") return t("Generate Beats Online Free — AI Beat Generator | ProducerHit", "Générer des beats en ligne gratuit — IA | ProducerHit");
      if (slugKey === "legal") return t("Legal — ProducerHit", "Mentions légales — ProducerHit");
      return t("ProducerHit — AI Beat Generator", "ProducerHit — Générateur de beats IA");
    })();

    const description = (() => {
      if (slugKey === "home")
        return t(
          "ProducerHit is an AI beat generator and AI music generator to create type beats and full songs online. Short clips by default, seed variations, MP3/WAV exports.",
          "ProducerHit est un générateur de beats IA et de musique IA pour créer des type beats et des chansons en ligne. Clips courts, variations via seed, exports MP3/WAV.",
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
      if (slugKey === "pricing") return t("Simple pricing for AI beats and AI songs. Upgrade for more credits and WAV exports.", "Tarifs simples pour beats IA et songs IA. Upgrade pour plus de crédits et l’export WAV.");
      return t("ProducerHit is an AI beat generator to create type beats online.", "ProducerHit est un générateur de beats IA pour créer des type beats en ligne.");
    })();

    const blogSlug = slugKey === "blog-post" ? pathname.replace("/blog/", "").split("/")[0] : null;
    const blogPost = blogSlug ? getBlogPostBySlug(blogSlug) : null;
    const effectiveTitle = blogPost ? `${blogPost.title} | ProducerHit` : title;
    const effectiveDescription = blogPost ? blogPost.description : description;
    const effectiveCanonicalUrl = blogPost ? `${origin}/blog/${blogPost.slug}` : canonicalUrl;

    document.title = effectiveTitle;
    setMeta("description", effectiveDescription, "name");
    setMeta("robots", robots, "name");
    setMeta("googlebot", robots, "name");

    setMeta("og:type", "website", "property");
    setMeta("og:site_name", "ProducerHit", "property");
    setMeta("og:title", effectiveTitle, "property");
    setMeta("og:description", effectiveDescription, "property");
    setMeta("og:url", effectiveCanonicalUrl, "property");
    setMeta("og:image", ogImageUrl, "property");
    setMeta("twitter:card", "summary_large_image", "name");
    setMeta("twitter:title", effectiveTitle, "name");
    setMeta("twitter:description", effectiveDescription, "name");
    setMeta("twitter:image", ogImageUrl, "name");

    setLink("canonical", effectiveCanonicalUrl);
    setLink("alternate", `${origin}${pathname}?lang=en`, { hreflang: "en" });
    setLink("alternate", `${origin}${pathname}?lang=fr`, { hreflang: "fr" });

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
          { "@type": "Offer", name: "Free Plan", price: "0", priceCurrency: "EUR", description: "3 AI generated tracks per month" },
          { "@type": "Offer", name: "Pro Plan", price: "10", priceCurrency: "EUR", description: "75 AI generated tracks per month" },
          { "@type": "Offer", name: "Studio Plan", price: "30", priceCurrency: "EUR", description: "250 AI generated tracks per month" },
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

    if (slugKey === "ai-beat-generator") {
      setJsonLd([
        ...baseJsonLd,
        faq([
          {
            q: "What is an AI beat generator?",
            a: "An AI beat generator creates instrumental beats from a text description (genre, mood, tempo). ProducerHit generates short clips by default so you can pick the best idea and iterate with variations.",
          },
          {
            q: "How do I get better results?",
            a: "Start with shorter generations, generate 2 versions, then use seed-based variations to keep the vibe while exploring new details.",
          },
          { q: "Can I export my beat?", a: "Yes. Export MP3 for free plans and WAV on paid plans." },
        ]),
      ]);
      return;
    }

    if (slugKey === "generate-beats-online-free") {
      setJsonLd([
        ...baseJsonLd,
        faq([
          { q: "Can I generate beats online for free?", a: "Yes. ProducerHit includes a free tier so you can generate beats online and download MP3." },
          { q: "Do I get two versions at once?", a: "You can switch Versions to 2 to generate two candidates and choose the best one." },
        ]),
      ]);
      return;
    }

    if (slugKey === "blog") {
      setJsonLd([
        ...baseJsonLd,
        {
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "ProducerHit Blog",
          url: `${origin}/blog`,
          blogPost: BLOG_POSTS.slice(0, 20).map((p) => ({
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
  }, [locale, pathname, search]);

  return null;
}

export default function App() {
  return (
    <Router>
      <AuthBootstrap>
        <ThemeBootstrap>
          <LoopsBootstrap>
            <AppToaster />
            <SeoBootstrap />
            <RouteFade>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/home" element={<Navigate to="/" replace />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/ai-beat-generator" element={<Home />} />
                <Route path="/ai-music-generator" element={<Home />} />
                <Route path="/type-beat-generator-ai" element={<Home />} />
                <Route path="/generate-beats-online-free" element={<Home />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/legal" element={<Legal />} />

                <Route path="/dashboard" element={<Dashboard />} />

                <Route element={<ProtectedRoute />}>
                  <Route path="/library" element={<Library />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </RouteFade>
            <AudioPlayer />
          </LoopsBootstrap>
        </ThemeBootstrap>
      </AuthBootstrap>
    </Router>
  );
}
