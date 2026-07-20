/**
 * Refonte Landing — CLOUD DRIP
 * producerhit-refonte-prompt.md — 5 scenes, GSAP scrollytelling, 3 interactions
 *
 * Route: /refonte (test — swap avec / une fois validé)
 * Animation: GSAP ScrollTrigger + Lenis (chargés dynamiquement, budget <300KB)
 * Mascotte: cursor-tracking 3D tilt (CSS perspective, pas Three.js pour perf)
 * Données: fetchPublicLoops (pas de génération API directe)
 */

import { useEffect, useRef, useState, lazy } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useLocaleStore } from "@/stores/localeStore";
import { usePlayerStore } from "@/stores/playerStore";
import { buildAuthUrl } from "@/lib/authRoutes";
import { fetchPublicLoops, type PublicLoopRow } from "@/lib/publicLoops";
import { resolvePublicRowCoverUrl } from "@/lib/coverArt";
import "@/styles/refonte-landing.css";

// ─── GSAP loader (lazy, after hero mount) ──────────────────────────────────────
type GSAPState = {
  gsap: any;
  ScrollTrigger: any;
  lenis: any;
  ready: boolean;
};

function useGSAP() {
  const [state, setState] = useState<GSAPState>({
    gsap: null,
    ScrollTrigger: null,
    lenis: null,
    ready: false,
  });
  const lenisRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [gsap, { ScrollTrigger }, lenisModule] = await Promise.all([
          import("gsap"),
          import("gsap/ScrollTrigger"),
          import("lenis"),
        ]);
        if (cancelled) return;

        gsap.gsap.registerPlugin(ScrollTrigger);

        const LenisCtor = (lenisModule as any).default ?? lenisModule;
        const lenis = new LenisCtor({ lerp: 0.1, smoothWheel: true });
        lenisRef.current = lenis;
        lenis.on("scroll", ScrollTrigger.update);
        gsap.gsap.ticker.add((time: number) => lenis.raf(time * 1000));
        gsap.gsap.ticker.lagSmoothing(0);

        setState({
          gsap: gsap.gsap,
          ScrollTrigger,
          lenis,
          ready: true,
        });
      } catch (e) {
        console.warn("[Refonte] GSAP/Lenis load failed:", e);
      }
    })();

    return () => {
      cancelled = true;
      lenisRef.current?.destroy();
    };
  }, []);

  return state;
}

// ─── Copy ──────────────────────────────────────────────────────────────────────
const COPY = {
  fr: {
    nav: { logo: "ProducerHit", features: "Fonctionnalités", community: "Communauté", pricing: "Tarifs", cta: "Commencer" },
    hero: {
      headline: "Chaque son est un drop.",
      sub: "L'IA qui transforme une idée en morceau fini — pendant que tu regardes.",
      cta: "Lance ton premier son",
      ctaOutline: "Voir les tarifs",
      scrollHint: "Scroll pour découvrir",
    },
    universe: {
      eyebrow: "Notre vision",
      title: <>Un studio dans les nuages,<br /><em>une culture dans les oreilles.</em></>,
      sub: "ProducerHit ne ressemble à aucun autre outil IA musical. On a construit un espace qui a l'air d'un drop collector, pas d'un SaaS de plus.",
    },
    modes: {
      eyebrow: "4 façons de créer",
      title: "4 modes.\nDes sons qui claquent.",
      chanson: { name: "Chanson", icon: "♪", desc: "Une histoire, une voix, un son complet. De l'idée au master en une génération.", tag: "Populaire" },
      typeBeat: { name: "Type Beat", icon: "⚡", desc: "L'instru qui claque avant même que t'aies fini de la penser. Quelque part entre Ye et Metro Boomin.", tag: "100% original" },
      cover: { name: "Cover", icon: "◎", desc: "N'importe quel morceau, dans ton style à toi. Tu donnes la ref, on te rend ta version.", tag: "Singulier" },
      remix: { name: "Remix", icon: "⟲", desc: "Prends un son. Retourne-le. Le classique ne sonnait jamais aussi bon que dans ta tête.", tag: "Créatif" },
    },
    social: {
      title: "Ce que la communauté a lâché\ncette semaine.",
      sub: "Des tracks générées par des producteurs comme toi.",
    },
    pricing: {
      eyebrow: "Tarifs",
      title: "Pas d'abonnement\ncompliqué.",
      sub: "Juste des sons. Commence gratuitement, upgrade quand tu veux.",
      plans: {
        free: { name: "Free", price: "0€", period: "pour toujours", features: ["3 sons / mois", "Qualité standard", "Accès aux 4 modes", "Export MP3"] },
        starter: { name: "Starter", price: "9€", period: "/ mois", features: ["20 sons / mois", "Haute qualité", "Covers + Remixes", "Export WAV", "Mastering intégré"] },
        pro: { name: "Pro", price: "19€", period: "/ mois", features: ["60 sons / mois", "Qualités max + stems", "Tout unlocked", "Export WAV + stems", "Mastering + distribution"], featured: true },
      },
    },
    footer: {
      copy: "© 2026 ProducerHit — Tous droits réservés.",
      privacy: "Confidentialité",
      terms: "CGU",
      contact: "Contact",
    },
  },
  en: {
    nav: { logo: "ProducerHit", features: "Features", community: "Community", pricing: "Pricing", cta: "Get started" },
    hero: {
      headline: "Every track is a drop.",
      sub: "AI that turns an idea into a finished song — while you watch.",
      cta: "Start your first track",
      ctaOutline: "See pricing",
      scrollHint: "Scroll to explore",
    },
    universe: {
      eyebrow: "Our vision",
      title: <>A studio in the clouds,<br /><em>a culture in your ears.</em></>,
      sub: "ProducerHit doesn't look like any other AI music tool. Built like a collector drop, not another SaaS dashboard.",
    },
    modes: {
      eyebrow: "4 ways to create",
      title: "4 modes.\nBeats that hit.",
      chanson: { name: "Song", icon: "♪", desc: "A story, a voice, a complete track. From idea to master in one generation.", tag: "Popular" },
      typeBeat: { name: "Type Beat", icon: "⚡", desc: "The beat that slaps before you even finish thinking it. Somewhere between Ye and Metro Boomin.", tag: "100% original" },
      cover: { name: "Cover", icon: "◎", desc: "Any track, in your own style. You give the reference, we give you your version.", tag: "Unique" },
      remix: { name: "Remix", icon: "⟲", desc: "Take a track. Flip it. The classic never sounded as good as in your head.", tag: "Creative" },
    },
    social: {
      title: "What the community dropped\nthis week.",
      sub: "Tracks generated by producers like you.",
    },
    pricing: {
      eyebrow: "Pricing",
      title: "No complicated\nsubscription.",
      sub: "Just tracks. Start free, upgrade when you're ready.",
      plans: {
        free: { name: "Free", price: "$0", period: "forever", features: ["3 tracks / month", "Standard quality", "All 4 modes", "MP3 export"] },
        starter: { name: "Starter", price: "$9", period: "/ month", features: ["20 tracks / month", "High quality", "Covers + Remixes", "WAV export", "Built-in mastering"] },
        pro: { name: "Pro", price: "$19", period: "/ month", features: ["60 tracks / month", "Max quality + stems", "Everything unlocked", "WAV + stems export", "Mastering + distribution"], featured: true },
      },
    },
    footer: {
      copy: "© 2026 ProducerHit — All rights reserved.",
      privacy: "Privacy",
      terms: "Terms",
      contact: "Contact",
    },
  },
};

type Locale = "fr" | "en";

// ─── Nav ───────────────────────────────────────────────────────────────────────
function RefonteNav({ t }: { t: typeof COPY.fr }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`refonte-nav${scrolled ? " refonte-nav--scrolled" : ""}`}>
      <a href="/" className="refonte-nav-logo">
        <span className="refonte-nav-logo-dot" />
        {t.nav.logo}
      </a>
      <ul className="refonte-nav-links">
        <li><a href="#features">{t.nav.features}</a></li>
        <li><a href="#community">{t.nav.community}</a></li>
        <li><a href="#pricing">{t.nav.pricing}</a></li>
        <li>
          <a href={buildAuthUrl({ mode: "signup" })}>
            <button className="refonte-cta" style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem" }}>
              {t.nav.cta}
            </button>
          </a>
        </li>
      </ul>
    </nav>
  );
}

// ─── Scene 1 — Hero ───────────────────────────────────────────────────────────
function SceneHero({ t, gsap, ScrollTrigger, ready }: { t: typeof COPY.fr.hero; } & GSAPState) {
  const heroRef = useRef<HTMLDivElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ready || !gsap || !ScrollTrigger || !heroRef.current) return;

    const ctx = gsap.context(() => {
      // Wordmark entrance
      gsap.fromTo(
        ".refonte-hero-wordmark",
        { opacity: 0, y: 30, skewY: 2 },
        { opacity: 1, y: 0, skewY: 0, duration: 1, ease: "power3.out", delay: 0.15 }
      );

      // Headline + CTAs staggered entrance
      gsap.fromTo(
        [".refonte-hero-coral-rule", ".refonte-hero-headline", ".refonte-hero-sub", ".refonte-hero-ctas"],
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.7, ease: "power2.out", stagger: 0.1, delay: 0.5 }
      );

      // Scroll hint pulse
      gsap.fromTo(
        ".refonte-scroll-hint",
        { opacity: 0 },
        { opacity: 1, duration: 0.6, delay: 1.6, ease: "power2.out" }
      );

      // Wordmark parallax on scroll (wordmark exits at top)
      gsap.to(".refonte-hero-wordmark", {
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "60% top",
          scrub: 1,
        },
        y: -120,
        opacity: 0,
        scale: 0.9,
        ease: "none",
      });

      // Headline exits slightly after
      gsap.to(".refonte-hero-headline, .refonte-hero-sub, .refonte-hero-ctas", {
        scrollTrigger: {
          trigger: heroRef.current,
          start: "20% top",
          end: "50% top",
          scrub: 1,
        },
        y: -60,
        opacity: 0,
        ease: "none",
      });

      // Wave bars ambient animation (staggered random)
      const bars = document.querySelectorAll(".refonte-hero-wave-bar");
      gsap.fromTo(
        bars,
        { scaleY: 0 },
        {
          scaleY: (i: number) => 0.2 + ((i * 37) % 10) / 14,
          duration: 0.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          stagger: { each: 0.03, from: "random" },
          delay: Math.random() * 0.5,
        }
      );
    }, heroRef);

    return () => ctx.revert();
  }, [ready]);

  return (
    <section className="refonte-hero refonte-scene" ref={heroRef}>
      {/* Wave bars */}
      <div className="refonte-hero-wave" aria-hidden="true">
        {Array.from({ length: 48 }).map((_, i) => (
          <div
            key={i}
            className="refonte-hero-wave-bar"
            style={{ height: `${15 + ((i * 37 + 11) % 10) * 8}%` }}
          />
        ))}
      </div>

      <div className="refonte-hero-wordmark refonte-display" ref={wordmarkRef}>
        Producer<br />Hit
      </div>

      <div className="refonte-hero-coral-rule" />

      <p className="refonte-hero-headline">{t.headline}</p>

      <p
        className="refonte-hero-sub"
        style={{
          fontSize: "1rem",
          color: "rgba(244,240,232,0.52)",
          maxWidth: 440,
          margin: "0 auto 2.5rem",
          lineHeight: 1.65,
        }}
      >
        {t.sub}
      </p>

      <div className="refonte-hero-ctas" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
        <a href={buildAuthUrl({ mode: "signup" })}>
          <button className="refonte-cta" style={{ fontSize: "1rem", padding: "1rem 2.5rem" }}>
            {t.cta}
          </button>
        </a>
        <a href="#pricing">
          <button className="refonte-cta refonte-cta-outline">{t.ctaOutline}</button>
        </a>
      </div>

      <div className="refonte-scroll-hint" aria-hidden="true">
        <svg width="14" height="20" viewBox="0 0 14 20" fill="none">
          <rect x="1" y="1" width="12" height="18" rx="6" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="7" cy="6" r="2" fill="currentColor" />
        </svg>
        {t.scrollHint}
      </div>
    </section>
  );
}

// ─── Scene 2 — Universe ──────────────────────────────────────────────────────
function SceneUniverse({ t, gsap, ScrollTrigger, ready }: { t: typeof COPY.fr.universe } & GSAPState) {
  const sectionRef = useRef<HTMLElement>(null);
  const mascotRef = useRef<HTMLDivElement>(null);

  // Cursor-tracking mascot (3D tilt, interaction #1)
  useEffect(() => {
    const el = mascotRef.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const dx = ((e.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * 14;
      const dy = ((e.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * -10;
      el.style.transform = `perspective(700px) rotateY(${dx}deg) rotateX(${dy}deg) scale3d(1.03, 1.03, 1.03)`;
    };
    const onLeave = () => {
      el.style.transform = "perspective(700px) rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)";
    };
    window.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  // GSAP scroll animations
  useEffect(() => {
    if (!ready || !gsap || !ScrollTrigger || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".refonte-universe-copy",
        { opacity: 0, x: -40 },
        {
          opacity: 1, x: 0, duration: 0.9, ease: "power3.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 75%", toggleActions: "play none none reverse" },
        }
      );
      gsap.fromTo(
        ".refonte-universe-mascot",
        { opacity: 0, x: 40 },
        {
          opacity: 1, x: 0, duration: 0.9, ease: "power3.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 75%", toggleActions: "play none none reverse" },
        }
      );
      gsap.fromTo(
        ".refonte-universe-sub",
        { opacity: 0, y: 20 },
        {
          opacity: 1, y: 0, duration: 0.7, ease: "power2.out", delay: 0.2,
          scrollTrigger: { trigger: sectionRef.current, start: "top 70%", toggleActions: "play none none reverse" },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [ready]);

  return (
    <section className="refonte-universe refonte-scene" id="universe" ref={sectionRef}>
      <div className="refonte-universe-inner">
        <div>
          <p className="refonte-mono" style={{ color: "var(--cd-coral)", marginBottom: "1.25rem" }}>
            {t.eyebrow}
          </p>
          <h2 className="refonte-universe-copy refonte-display" style={{
            fontSize: "clamp(2rem, 4.5vw, 3.6rem)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.0,
            textTransform: "uppercase",
          }}>
            {t.title}
          </h2>
          <p className="refonte-universe-sub">{t.sub}</p>
        </div>

        <div className="refonte-universe-mascot">
          {/* Interaction #1: cursor-tracked vinyl toy */}
          <div
            className="refonte-mascot-vinyl"
            ref={mascotRef}
            aria-label="ProducerHit mascot — drag cursor to explore"
            title="Drag your cursor over the vinyl"
          />
        </div>
      </div>
    </section>
  );
}

// ─── Scene 3 — 4 Modes ───────────────────────────────────────────────────────
function SceneModes({
  t,
  gsap,
  ScrollTrigger,
  ready,
  locale,
}: {
  t: typeof COPY.fr.modes;
  locale: Locale;
} & GSAPState) {
  const sectionRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const modes = [
    { key: "chanson", ...t.chanson },
    { key: "typeBeat", ...t.typeBeat },
    { key: "cover", ...t.cover },
    { key: "remix", ...t.remix },
  ];

  const handleModeClick = (mode: string) => {
    if (user) {
      navigate(`/dashboard?mode=${mode}`);
    } else {
      navigate(`/auth?redirect=/dashboard?mode=${mode}`);
    }
  };

  // GSAP scroll animations — cards stagger in
  useEffect(() => {
    if (!ready || !gsap || !ScrollTrigger || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Header
      gsap.fromTo(
        [".refonte-modes-eyebrow", ".refonte-modes-title"],
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.1,
          scrollTrigger: { trigger: sectionRef.current, start: "top 78%", toggleActions: "play none none reverse" },
        }
      );
      // Cards stagger
      gsap.fromTo(
        ".refonte-mode-card",
        { opacity: 0, y: 50, scale: 0.96 },
        {
          opacity: 1, y: 0, scale: 1,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.1,
          scrollTrigger: { trigger: ".refonte-modes-grid", start: "top 82%", toggleActions: "play none none reverse" },
        }
      );
      // Hover glow on cards (triggered by scroll position)
      const cards = document.querySelectorAll(".refonte-mode-card");
      cards.forEach((card) => {
        gsap.fromTo(
          card,
          { "--cd-coral-soft": "rgba(255,91,53,0)" },
          {
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              end: "top 50%",
              scrub: true,
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [ready]);

  const ctaLabel = locale === "fr" ? "Commencer maintenant" : "Start now";

  return (
    <section className="refonte-modes refonte-scene" id="features" ref={sectionRef}>
      <div className="refonte-modes-header">
        <p className="refonte-modes-eyebrow refonte-mono">{t.eyebrow}</p>
        <h2 className="refonte-modes-title refonte-display">
          {t.title.split("\n").map((line, i) => (
            <span key={i} style={{ display: "block" }}>{line}</span>
          ))}
        </h2>
      </div>

      <div className="refonte-modes-grid">
        {modes.map((mode) => (
          <button
            key={mode.key}
            className="refonte-mode-card"
            onClick={() => handleModeClick(mode.key)}
          >
            <span className="refonte-mode-icon" aria-hidden="true">{mode.icon}</span>
            <span className="refonte-mode-tag refonte-mono">{mode.tag}</span>
            <h3 className="refonte-mode-name">{mode.name}</h3>
            <p className="refonte-mode-desc">{mode.desc}</p>
          </button>
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: "3rem" }}>
        <a href={buildAuthUrl({ mode: "signup" })}>
          <button className="refonte-cta" style={{ padding: "1rem 2.5rem" }}>
            {ctaLabel}
          </button>
        </a>
      </div>
    </section>
  );
}

// ─── Scene 4 — Social / Preuve ─────────────────────────────────────────────────
function SceneSocial({ t }: { t: typeof COPY.fr.social }) {
  const [tracks, setTracks] = useState<PublicLoopRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { setCurrent, setPlaying } = usePlayerStore();

  useEffect(() => {
    fetchPublicLoops({ limit: 16 })
      .then((rows) => setTracks(rows.slice(0, 12)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handlePlay = async (row: PublicLoopRow) => {
    try {
      const { resolvePlayableCommunityAudio } = await import("@/lib/publicLoops");
      const url = await resolvePlayableCommunityAudio(row);
      if (url) {
        setCurrent(row as any, true);
        setPlaying(true);
      }
    } catch (_) {}
  };

  return (
    <section className="refonte-social refonte-scene" id="community">
      <div className="refonte-social-inner">
        <div className="refonte-social-header">
          <h2 className="refonte-social-title refonte-display">
            {t.title.split("\n").map((line, i) => (
              <span key={i} style={{ display: "block" }}>{line}</span>
            ))}
          </h2>
          <p className="refonte-social-sub">{t.sub}</p>
        </div>

        {loading ? (
          <div
            style={{
              display: "flex",
              gap: "1.25rem",
              overflowX: "auto",
              paddingBottom: "1rem",
              scrollbarWidth: "none",
            }}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="refonte-track-card"
                style={{ opacity: 0.35, flexShrink: 0 }}
              >
                <div
                  className="refonte-track-cover"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                />
                <div className="refonte-track-meta">
                  <div
                    style={{
                      height: 11,
                      background: "rgba(255,255,255,0.1)",
                      borderRadius: 4,
                      marginBottom: 5,
                    }}
                  />
                  <div
                    style={{
                      height: 9,
                      background: "rgba(255,255,255,0.06)",
                      borderRadius: 4,
                      width: "55%",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              gap: "1.25rem",
              overflowX: "auto",
              paddingBottom: "1rem",
              scrollbarWidth: "none",
            }}
          >
            {tracks.map((row) => (
              <button
                key={row.id}
                className="refonte-track-card"
                onClick={() => handlePlay(row)}
                style={{ flexShrink: 0, textAlign: "left", border: "none", cursor: "pointer" }}
              >
                <div className="refonte-track-cover">
                  {row.cover_url ? (
                    <img
                      src={resolvePublicRowCoverUrl(row)}
                      alt={row.name ?? ""}
                      className="refonte-track-cover-art"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        background: "linear-gradient(135deg, var(--cd-static), rgba(42,40,51,0.5))",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span style={{ fontSize: "2.5rem", opacity: 0.25 }}>♪</span>
                    </div>
                  )}
                  <div className="refonte-track-play">
                    <div className="refonte-track-play-icon">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 1.5L10.5 6L2.5 10.5V1.5Z" fill="white" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="refonte-track-meta">
                  <p className="refonte-track-title">{row.name ?? "Untitled"}</p>
                  <p className="refonte-track-author">{row.author?.username ?? "ProducerHit"}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Scene 5 — Pricing ────────────────────────────────────────────────────────
function ScenePricing({
  t,
  gsap,
  ScrollTrigger,
  ready,
}: { t: typeof COPY.fr.pricing } & GSAPState) {
  const sectionRef = useRef<HTMLElement>(null);
  const { user } = useAuthStore();

  // GSAP scroll entrance
  useEffect(() => {
    if (!ready || !gsap || !ScrollTrigger || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        [".refonte-pricing-eyebrow", ".refonte-pricing-title", ".refonte-pricing-sub"],
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.1,
          scrollTrigger: { trigger: sectionRef.current, start: "top 78%", toggleActions: "play none none reverse" },
        }
      );
      gsap.fromTo(
        ".refonte-plan",
        { opacity: 0, y: 40, scale: 0.96 },
        {
          opacity: 1, y: 0, scale: 1,
          duration: 0.7, ease: "power3.out", stagger: 0.12,
          scrollTrigger: { trigger: ".refonte-plans", start: "top 82%", toggleActions: "play none none reverse" },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [ready]);

  const handlePlanClick = (plan: string) => {
    if (plan === "free") {
      window.location.href = buildAuthUrl({ mode: "signup" });
    } else {
      window.location.href = user ? "/dashboard?tab=billing" : buildAuthUrl({ mode: "signup", next: "/pricing" });
    }
  };

  const plans = [t.plans.free, t.plans.starter, t.plans.pro];

  return (
    <section className="refonte-pricing refonte-scene" id="pricing" ref={sectionRef}>
      <div className="refonte-pricing-inner">
        <p className="refonte-mono refonte-pricing-eyebrow" style={{ color: "var(--cd-coral)", marginBottom: "1rem" }}>
          {t.eyebrow}
        </p>
        <h2 className="refonte-pricing-title refonte-display">
          {t.title.split("\n").map((line, i) => (
            <span key={i} style={{ display: "block" }}>{line}</span>
          ))}
        </h2>
        <p className="refonte-pricing-sub">{t.sub}</p>

        <div className="refonte-plans">
          {plans.map((plan: any, i: number) => (
            <div
              key={i}
              className={`refonte-plan${plan.featured ? " refonte-plan--featured" : ""}`}
            >
              {plan.featured && (
                <p className="refonte-plan-label refonte-mono" style={{ color: "var(--cd-coral)", marginBottom: "0.75rem" }}>
                  Meilleure valeur
                </p>
              )}
              <h3 className="refonte-plan-name">{plan.name}</h3>
              <p className="refonte-plan-price">
                {plan.price}
                <span> {plan.period}</span>
              </p>
              <ul className="refonte-plan-features">
                {plan.features.map((f: string) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <button
                className={`refonte-cta refonte-plan-cta${plan.featured ? "" : " refonte-cta-outline"}`}
                onClick={() => handlePlanClick(["free", "starter", "pro"][i])}
                style={{ width: "100%", justifyContent: "center" }}
              >
                {["free", "starter", "pro"].includes(["free", "starter", "pro"][i]) &&
                 ["free", "starter", "pro"][i] === "free"
                  ? "Commencer"
                  : "Choisir"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function RefonteFooter({ t }: { t: typeof COPY.fr.footer }) {
  return (
    <footer className="refonte-footer">
      <div className="refonte-footer-inner">
        <a href="/" className="refonte-footer-logo">ProducerHit</a>
        <p className="refonte-footer-copy">{t.copy}</p>
        <ul className="refonte-footer-links">
          <li><a href="/legal">{t.privacy}</a></li>
          <li><a href="/legal">{t.terms}</a></li>
          <li><a href="/">{t.contact}</a></li>
        </ul>
      </div>
    </footer>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function RefonteLanding() {
  const { locale } = useLocaleStore();
  const safeLocale: Locale = locale === "en" ? "en" : "fr";
  const t = COPY[safeLocale];
  const gsapState = useGSAP();

  return (
    <div className="refonte-root">
      <RefonteNav t={t} />
      <main>
        <SceneHero t={t.hero} {...gsapState} />
        <SceneUniverse t={t.universe} {...gsapState} />
        <SceneModes t={t.modes} locale={safeLocale} {...gsapState} />
        <SceneSocial t={t.social} />
        <ScenePricing t={t.pricing} {...gsapState} />
      </main>
      <RefonteFooter t={t.footer} />
    </div>
  );
}