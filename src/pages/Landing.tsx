import { Link, useLocation, useNavigate } from "react-router-dom";
import { ensureLandingMobileStyles } from "@/lib/themeStyles";
import { useEffect, useMemo, useRef, useState, useCallback, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/stores/authStore";
import { supabase, trackClientEvent } from "@/lib/supabaseClient";
import { trackLandingView } from "@/lib/growthFunnelEvents";
import { useLocaleStore } from "@/stores/localeStore";
import { LanguagePicker } from "@/components/LanguagePicker";
import { Menu, Mic2, X } from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";
import {
  findPublicRowIndex,
  landingTrackToPublicRow,
  LANDING_COMMUNITY_QUEUE_SOURCE,
  playPublicRowsInQueue,
} from "@/lib/communityPlaybackQueue";
import { isPersistedStorageCoverUrl, publicRowToCoverLoop, resolvePublicRowCoverUrl } from "@/lib/coverArt";
import { UNIFIED_STORED_COVERS, CLOUD_THEME_ENABLED } from "@/lib/featureFlags";
import {
  consumeJustAuthenticated,
  hasOAuthCallbackParams,
} from "@/lib/postAuthRedirect";
import { COVER_SURFACE_CLASS, hashString } from "@/lib/utils";
import {
  extractAceTaskId,
  fetchPublicLoops,
  isPlayablePublicLoop,
  resolveAceAudioUrl,
  type PublicLoopRow,
} from "@/lib/publicLoops";
import { LandingPrismScene } from "@/components/landing/LandingPrismScene";
import { BrandLogo } from "@/components/landing/BrandLogo";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingGeneratorBottomBand } from "@/components/landing/LandingGeneratorBottomBand";
import { TestimonialsStrip } from "@/components/landing/TestimonialsStrip";
import { LandingCommunityRail } from "@/components/landing/LandingCommunityRail";
import { LandingBenefits } from "@/components/landing/LandingBenefits";
import { LandingPricingTeaser } from "@/components/landing/LandingPricingTeaser";
import { LandingCloudMoodsSection } from "@/components/landing/LandingCloudMoodsSection";
import { LandingHeroMoodStrip } from "@/components/landing/LandingHeroMoodStrip";
import { LandingStickyCta } from "@/components/landing/LandingStickyCta";
import { BackdropTextureVeil } from "@/components/BackdropTextureVeil";
import { LandingMobileTrendingStrip } from "@/components/landing/LandingMobileTrendingStrip";
import { LandingGenerator, type GeneratorSideCard } from "@/components/landing/LandingGenerator";
import { LandingWorkflow } from "@/components/landing/LandingWorkflow";
import { HeroCtaButton } from "@/components/landing/HeroCtaButton";
import { HeroDreamHeadline } from "@/components/landing/HeroDreamHeadline";
import { ThemeAndAccentPicker } from "@/components/ThemeAndAccentPicker";
import { WarmGlassBackdrop } from "@/components/WarmGlassBackdrop";
import { CloudBackdrop } from "@/components/CloudBackdrop";
import { useVisualThemeStore, isCloudTheme, isWarmGlassTheme } from "@/stores/visualThemeStore";
import { useCloudAccentStore } from "@/stores/cloudAccentStore";
import { landingCopy, landingFlowSectionClass, landingSectionClass } from "@/lib/landingContent";
import { landingHeroDreamCopy } from "@/lib/landingHeroDreamCopy";
import { clearLandingPendingGeneration, saveLandingPendingGeneration } from "@/lib/landingPendingGeneration";
import { handoffRemixToDashboard } from "@/lib/remixHandoff";
import { buildAuthUrl, resolvePostAuthRedirect } from "@/lib/authRoutes";
import { cn } from "@/lib/utils";
import { normalizePlan } from "@/lib/billing";
import { hostedAudioRetentionSummary } from "@/lib/loopAudioRetention";
import { COMMERCIAL_RIGHTS_FAQ } from "@/lib/planPricing";
import { LANDING_MOBILE_V2 } from "@/lib/featureFlags";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { PublicProfileCard } from "@/lib/creatorProfile";

type CreateMode = "song" | "beat";

const SIDE_CARD_POOL_LIMIT = 24;
const SIDE_CARD_ROTATE_MIN_MS = 48_000;
const SIDE_CARD_ROTATE_MAX_MS = 92_000;

function mergeSideCardPool(existing: GeneratorSideCard[], incoming: GeneratorSideCard[]): GeneratorSideCard[] {
  const byId = new Map<string, GeneratorSideCard>();
  for (const card of existing) byId.set(card.id, card);
  for (const card of incoming) byId.set(card.id, card);
  return Array.from(byId.values()).slice(0, SIDE_CARD_POOL_LIMIT);
}

function pickRandomSideCards(pool: GeneratorSideCard[], count: number, seed: string) {
  if (pool.length <= count) return pool;
  const items = [...pool];
  let h = hashString(seed);
  for (let i = items.length - 1; i > 0; i--) {
    h = (h * 1664525 + 1013904223) >>> 0;
    const j = h % (i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items.slice(0, count);
}

function pickNextSideCard(pool: GeneratorSideCard[], visible: GeneratorSideCard[]): GeneratorSideCard | null {
  const visibleIds = new Set(visible.map((c) => c.id));
  const candidates = pool.filter((c) => !visibleIds.has(c.id));
  if (!candidates.length) return null;
  return candidates[Math.floor(Math.random() * candidates.length)] ?? null;
}

function classifyTrack(genre: string, mood: string, name: string) {
  const hay = `${genre} ${mood} ${name}`.toLowerCase();
  const looksLikeSong = ["song", "vocals", "vocal", "afro", "afrobeats", "pop"].some((k) => hay.includes(k));
  if (looksLikeSong) return { kind: "song" as const, badge: "Song" as const };
  const looksLikeBeat = ["type beat", "beat", "trap", "drill", "trapsoul", "rnb"].some((k) => hay.includes(k));
  return looksLikeBeat ? { kind: "beat" as const, badge: "Type Beat" as const } : { kind: "song" as const, badge: "Song" as const };
}

function RevealSection({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [mode, setMode] = useState<"pending" | "scroll" | "shown">("pending");

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setMode("shown");
      return;
    }

    // Scroll-driven blur reste instable sur mobile (voile persistant sur le texte).
    const preferSimpleReveal = window.matchMedia("(max-width: 767px)").matches;

    const supportsScrollTimeline =
      !preferSimpleReveal &&
      typeof CSS !== "undefined" &&
      CSS.supports("animation-timeline: view()") &&
      CSS.supports("animation-range: entry 0% cover 42%");

    if (supportsScrollTimeline) {
      setMode("scroll");
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setMode("shown");
          observer.disconnect();
        }
      },
      { threshold: 0.04, rootMargin: "96px 0px 72px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id={id}
      ref={ref}
      className={[
        "pk-prism-reveal",
        mode === "scroll" && "pk-prism-reveal--scroll",
        mode === "pending" && "pk-prism-reveal--hidden",
        mode === "shown" && "pk-prism-reveal--shown",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </section>
  );
}

export default function Landing() {
  useEffect(() => {
    void ensureLandingMobileStyles();
  }, []);

  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const authStatus = useAuthStore((s) => s.status);
  const profile = useAuthStore((s) => s.profile);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const locale = useLocaleStore((s) => s.locale);
  const visualTheme = useVisualThemeStore((s) => s.theme);
  const warmGlass = isWarmGlassTheme(visualTheme);
  const cloud = isCloudTheme(visualTheme);
  const cloudAccent = useCloudAccentStore((s) => s.accent);
  const copy = useMemo(() => landingCopy(locale), [locale]);
  const dreamCopy = useMemo(() => landingHeroDreamCopy(locale), [locale]);
  const isMobileViewport = useMediaQuery("(max-width: 767px)");
  const mobileLandingFocus = LANDING_MOBILE_V2 && isMobileViewport;

  useEffect(() => {
    trackLandingView({ locale });
  }, [locale]);

  const [mobileOpen, setMobileOpen] = useState(false);

  const [mode, setMode] = useState<CreateMode>("song");
  const [prompt, setPrompt] = useState("");
  const [focused, setFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const [beatArtist, setBeatArtist] = useState("");
  const [beatBpm, setBeatBpm] = useState(130);
  const [beatMood, setBeatMood] = useState("Hype");
  const [beatGenres, setBeatGenres] = useState<string[]>(["Trap"]);

  const [generating, setGenerating] = useState(false);

  const current = usePlayerStore((s) => s.current);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const setPlaying = usePlayerStore((s) => s.setPlaying);

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const pageRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const reduceMotion = useMemo(() => {
    try {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      return false;
    }
  }, []);
  const allowPointer = useMemo(() => {
    try {
      return window.matchMedia("(pointer: fine)").matches;
    } catch {
      return true;
    }
  }, []);
  const [spot, setSpot] = useState<{ x: number; y: number }>({ x: 56, y: 32 });
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (reduceMotion || !allowPointer) return;
    const el = heroRef.current;
    if (!el) return;

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)));
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / Math.max(1, rect.height)));
      lastRef.current = { x, y };
      if (rafRef.current) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        const v = lastRef.current;
        if (!v) return;
        setSpot({ x: Math.round(v.x * 1000) / 10, y: Math.round(v.y * 1000) / 10 });
      });
    };

    el.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      el.removeEventListener("pointermove", onMove);
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastRef.current = null;
    };
  }, [allowPointer, reduceMotion]);

  const attachMagnetic = (strength: number) => {
    if (reduceMotion || !allowPointer) return {};
    return {
      onMouseMove: (e: ReactMouseEvent<HTMLElement>) => {
        const t = e.currentTarget as HTMLElement;
        const rect = t.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
        const y = ((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
        t.style.transform = `translate3d(${x * strength}px, ${y * strength}px, 0)`;
      },
      onMouseLeave: (e: ReactMouseEvent<HTMLElement>) => {
        (e.currentTarget as HTMLElement).style.transform = "translate3d(0,0,0)";
      },
    } as const;
  };

  const placeholders = useMemo(() => {
    const song =
      locale === "fr"
        ? [
            "Une chanson R&B mélancolique sur les nuits en ville…",
            "Un anthem dark trap avec une grosse hook et des vocals gritty…",
            "Un hit Afrobeats d'été avec guitares lumineuses et refrain catchy…",
            "Une ballade pop émotionnelle avec une montée cinématique…",
          ]
        : [
            "A melancholic R&B song about late nights in the city...",
            "A dark trap anthem with gritty vocals and a huge hook...",
            "An Afrobeats summer song with bright guitars and a catchy chorus...",
            "A pop ballad with emotional vocals and a cinematic build...",
          ];
    const beat =
      locale === "fr"
        ? [
            "Type beat Metro Boomin avec dark bounce et 808 clean…",
            "Type beat Drill avec bass qui slide et hats serrés…",
            "Loop Trapsoul avec chords chauds et drums moody…",
            "Type beat UK garage à 130 BPM avec swing et chords brillants…",
          ]
        : [
            "Metro Boomin type beat with dark bounce and clean 808s...",
            "Drill type beat with sliding bass and tight hats...",
            "Trapsoul loop with warm chords and moody drums...",
            "UK garage type beat at 130 BPM with swing and bright chords...",
          ];
    return mode === "beat" ? beat : song;
  }, [locale, mode]);

  const [generatorSideCards, setGeneratorSideCards] = useState<GeneratorSideCard[]>([]);
  const sideCardPoolRef = useRef<GeneratorSideCard[]>([]);
  const sideCardRotateSlotRef = useRef(0);
  const sideCardPoolReadyRef = useRef(false);
  const activeCardIdRef = useRef<string | null>(null);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    activeCardIdRef.current = current?.id ?? null;
    isPlayingRef.current = isPlaying;
  }, [current?.id, isPlaying]);

  const mapRowToSideCard = useCallback((r: PublicLoopRow): GeneratorSideCard | null => {
    if (typeof r.id !== "string") return null;
    if (!isPlayablePublicLoop(r.audio_url, r.stems_url, r.created_at)) return null;

    const name = (r.name ?? "Untitled").trim() || "Untitled";
    const genre = (r.genre ?? "").trim();
    const mood = (r.mood ?? "").trim();
    const bpm = typeof r.bpm === "number" ? r.bpm : null;
    const { badge } = classifyTrack(genre, mood, name);
    const prompt = (r.prompt ?? "").trim() || [name, genre, mood, bpm ? `${bpm} BPM` : ""].filter(Boolean).join(", ");
    const audioUrlRaw = typeof r.audio_url === "string" ? r.audio_url.trim() : "";
    const stemsUrlObj = (() => {
      if (r.stems_url && typeof r.stems_url === "object") return r.stems_url as Record<string, unknown>;
      if (typeof r.stems_url === "string") {
        const raw = r.stems_url.trim();
        if (!raw) return null;
        try {
          const parsed = JSON.parse(raw) as unknown;
          return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
        } catch {
          return null;
        }
      }
      return null;
    })();
    const loopForCover = publicRowToCoverLoop(r);
    const subtitle = [badge, genre || mood, bpm ? `${bpm} BPM` : ""].filter((x) => x.length > 0).join(" · ");
    const coverUrl = resolvePublicRowCoverUrl(r);
    if (!coverUrl.startsWith("http")) return null;

    return {
      id: r.id,
      title: name,
      subtitle,
      coverUrl,
      coverBg: COVER_SURFACE_CLASS,
      audioUrl: audioUrlRaw.length > 0 ? audioUrlRaw : null,
      stemsUrl: stemsUrlObj,
      name,
      genre: genre || null,
      mood: mood || null,
      bpm,
      prompt,
    };
  }, []);

  const mapTrackToSideCard = useCallback(
    (t: PublicTrack): GeneratorSideCard | null => {
      const row = {
        id: t.id,
        name: t.name,
        genre: t.genre,
        mood: t.mood,
        bpm: t.bpm,
        prompt: t.prompt,
        stems_url: t.stemsUrl ?? null,
        seed: t.seed ?? null,
        created_at: t.createdAt,
      };
      const loopForCover = publicRowToCoverLoop(row);
      const coverUrl = t.coverUrl?.trim() || resolvePublicRowCoverUrl(row);
      if (!coverUrl.startsWith("http")) return null;
      return {
        id: t.id,
        title: t.name,
        subtitle: t.tags.slice(0, 3).join(" · ") || t.badge,
        coverUrl,
        coverBg: COVER_SURFACE_CLASS,
        audioUrl: t.audioUrl,
        stemsUrl: t.stemsUrl ?? null,
        name: t.name,
        genre: t.genre,
        mood: t.mood,
        bpm: t.bpm,
        prompt: t.prompt,
      };
    },
    [],
  );

  useEffect(() => {
    const onScroll = () => {
      const header = headerRef.current;
      if (!header) return;
      const scrolled = window.scrollY > 8;
      header.classList.toggle("pk-landing-header--scrolled", scrolled);
      header.classList.toggle("shadow-none", !scrolled);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    try {
      if (window.matchMedia("(pointer: coarse)").matches) return;
    } catch {
      return;
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 180);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (focused) return;
    if (prompt.trim().length > 0) return;
    const t = window.setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % placeholders.length);
    }, 2300);
    return () => window.clearInterval(t);
  }, [focused, placeholders.length, prompt]);

  const toggleGenre = (g: string) => {
    setBeatGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [g, ...prev].slice(0, 3)));
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    if (location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.hash]);

  useEffect(() => {
    const raw = location.hash || "";
    const id = raw.startsWith("#") ? raw.slice(1) : raw;
    if (!id) return;
    window.setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  }, [location.hash]);

  const inferBeatPrompt = () => {
    const base = prompt.trim();
    if (base) return base;
    const artist = beatArtist.trim() ? `${beatArtist.trim()} vibe, ` : "";
    const bpm = beatBpm > 0 ? `${beatBpm} BPM, ` : "";
    const tags = beatGenres.length > 0 ? beatGenres.join(", ") : "Type beat";
    return `${tags}, ${artist}${bpm}${beatMood} mood, clean mix, hook-ready`.replace(/\s+/g, " ").trim();
  };

  const onGenerate = () => {
    if (generating) return;

    const userPrompt = prompt.trim();

    if (mode === "song" && !userPrompt) {
      trackClientEvent("landing_create_empty", { mode: "song" });
      clearLandingPendingGeneration();
      const dashboardNext = "/dashboard?mode=song";
      if (!user) {
        navigate(buildAuthUrl({ next: dashboardNext }));
        return;
      }
      navigate(dashboardNext);
      return;
    }

    const promptValue = mode === "beat" ? userPrompt || inferBeatPrompt() : userPrompt;
    if (!promptValue.trim()) {
      clearLandingPendingGeneration();
      const dashboardNext = `/dashboard?mode=${mode}`;
      if (!user) {
        navigate(buildAuthUrl({ next: dashboardNext }));
        return;
      }
      navigate(dashboardNext);
      return;
    }

    saveLandingPendingGeneration({ prompt: promptValue, mode });
    const dashboardNext = `/dashboard?prompt=${encodeURIComponent(promptValue)}&mode=${mode}`;
    if (!user) {
      trackClientEvent("landing_generate_click", { mode, auth_required: true });
      navigate(buildAuthUrl({ next: dashboardNext }));
      return;
    }
    trackClientEvent("landing_generate_click", { mode, auth_required: false });
    navigate(dashboardNext);
  };

  const startCreateFromTrack = (track: PublicTrack) => {
    const promptValue =
      track.prompt?.trim() ||
      [track.name, track.genre, track.mood, track.bpm ? `${track.bpm} BPM` : ""].filter(Boolean).join(", ");
    if (!promptValue.trim()) return;
    saveLandingPendingGeneration({ prompt: promptValue, mode: track.kind });
    const dashboardNext = `/dashboard?prompt=${encodeURIComponent(promptValue)}&mode=${track.kind}`;
    trackClientEvent("landing_create_similar", { loop_id: track.id, mode: track.kind });
    if (!user) {
      navigate(buildAuthUrl({ next: dashboardNext }));
      return;
    }
    navigate(dashboardNext);
  };

  const remixFromLandingTrack = (track: PublicTrack) => {
    trackClientEvent("landing_trending_remix", { mode: track.kind, loop_id: track.id, handoff: "dashboard_remix" });
    void (async () => {
      const result = await handoffRemixToDashboard(
        {
          id: track.id,
          name: track.name,
          prompt: track.prompt,
          genre: track.genre,
          mood: track.mood,
          bpm: track.bpm,
          audioUrl: track.audioUrl,
          stemsUrl: track.stemsUrl ?? null,
        },
        "landing",
      );
      if (!result.ok) {
        toast.error(
          locale === "fr" ? "Remix indisponible — prompt copié dans le générateur" : "Remix unavailable — prompt copied to generator",
        );
        applyTrackPrompt(track.prompt, track.kind);
        return;
      }
      if (!user) {
        navigate(buildAuthUrl({ next: "/dashboard?remix=1" }));
        return;
      }
      navigate("/dashboard?remix=1");
    })();
  };

  const applyTrackPrompt = (nextPrompt: string, nextMode: CreateMode) => {
    trackClientEvent("landing_trending_remix", { mode: nextMode });
    try {
      window.localStorage.setItem("producerhit_pending_source", "landing");
    } catch {
      void 0;
    }
    setPrompt(nextPrompt);
    setMode(nextMode);
    window.setTimeout(() => inputRef.current?.focus(), 250);
    scrollTo("create");
  };

  type PublicTrack = {
    id: string;
    name: string;
    genre: string | null;
    mood: string | null;
    bpm: number | null;
    audioUrl: string | null;
    createdAt: string | null;
    seed?: number | null;
    stemsUrl?: Record<string, unknown> | null;
    kind: CreateMode;
    badge: "Song" | "Type Beat";
    tags: string[];
    duration?: string;
    color: string;
    prompt: string;
    coverUrl?: string | null;
    author?: PublicProfileCard | null;
  };

  const [trending, setTrending] = useState<PublicTrack[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [trendingTimedOut, setTrendingTimedOut] = useState(false);
  const [trendingError, setTrendingError] = useState<string | null>(null);
  const [trendingRefreshKey, setTrendingRefreshKey] = useState(0);
  const [repairingPublicLinks, setRepairingPublicLinks] = useState(false);
  const [repairFixedCount, setRepairFixedCount] = useState<number | null>(null);

  const getTrackGradient = (id: string) => {
    const gradients = ["from-violet-900 to-blue-900", "from-purple-900 to-pink-900", "from-blue-900 to-cyan-900", "from-rose-900 to-orange-900", "from-green-900 to-teal-900", "from-yellow-900 to-red-900"];
    const index = id.charCodeAt(0) % gradients.length;
    return gradients[index] ?? gradients[0];
  };

  const syncSideCardPool = useCallback((incoming: GeneratorSideCard[]) => {
    if (!incoming.length) return;
    sideCardPoolRef.current = mergeSideCardPool(sideCardPoolRef.current, incoming);
    if (sideCardPoolRef.current.length >= 2) {
      sideCardPoolReadyRef.current = true;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const cacheKey = "producerhit_landing_gen_cards_v6_stored";
    const seedKey = "producerhit_landing_gen_cards_seed";

    const hasValidCoverUrl = (cards: GeneratorSideCard[]) =>
      cards.length >= 2 && cards.every((c) => typeof c.coverUrl === "string" && c.coverUrl.startsWith("http"));

    const persistSideCards = (cards: GeneratorSideCard[]) => {
      try {
        window.sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), cards: cards.slice(0, 2) }));
      } catch {
        // ignore
      }
    };

    const commitSideCards = (cards: GeneratorSideCard[]) => {
      if (cancelled || cards.length < 2) return;
      setGeneratorSideCards(cards.slice(0, 2));
      persistSideCards(cards);
    };

    void (async () => {
      try {
        const raw = window.sessionStorage.getItem(cacheKey);
        if (raw) {
          const parsed = JSON.parse(raw) as { ts?: unknown; cards?: unknown };
          const ts = typeof parsed?.ts === "number" ? parsed.ts : 0;
          const cached = Array.isArray(parsed?.cards) ? (parsed.cards as GeneratorSideCard[]) : [];
          const ok = Date.now() - ts < 15 * 60 * 1000 && hasValidCoverUrl(cached);
          if (ok) {
            commitSideCards(cached);
            syncSideCardPool(cached);
          }
        }
      } catch {
        // ignore
      }

      if (cancelled) return;

      try {
        const rows = await fetchPublicLoops({ limit: 48, timeoutMs: 8000, playableOnly: true });
        if (cancelled) return;

        const pool = rows
          .map(mapRowToSideCard)
          .filter((c): c is GeneratorSideCard => c !== null);

        if (!pool.length || cancelled) return;

        syncSideCardPool(pool);

        let seed = "";
        try {
          seed = window.sessionStorage.getItem(seedKey) ?? "";
          if (!seed) {
            seed = `${Date.now()}-${hashString(pool.map((p) => p.id).join(":"))}`;
            window.sessionStorage.setItem(seedKey, seed);
          }
        } catch {
          seed = `${Date.now()}`;
        }

        const picked = pickRandomSideCards(pool, 2, seed);
        if (cancelled) return;
        commitSideCards(picked);
      } catch {
        // ignore — cards stay hidden if fetch fails
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mapRowToSideCard, syncSideCardPool]);

  useEffect(() => {
    if (!trending.length) return;
    const fromTrending = trending
      .map(mapTrackToSideCard)
      .filter((c): c is GeneratorSideCard => c !== null);
    syncSideCardPool(fromTrending);
  }, [trending, mapTrackToSideCard, syncSideCardPool]);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | null = null;

    const randomRotateDelay = () =>
      SIDE_CARD_ROTATE_MIN_MS +
      Math.floor(Math.random() * (SIDE_CARD_ROTATE_MAX_MS - SIDE_CARD_ROTATE_MIN_MS + 1));

    const scheduleNext = () => {
      if (cancelled) return;
      timeoutId = window.setTimeout(tick, randomRotateDelay());
    };

    const tick = () => {
      if (cancelled) return;
      if (document.hidden) {
        scheduleNext();
        return;
      }

      const pool = sideCardPoolRef.current;
      if (!sideCardPoolReadyRef.current || pool.length < 3) {
        scheduleNext();
        return;
      }

      setGeneratorSideCards((prev) => {
        if (prev.length < 2) return prev;

        let slot = sideCardRotateSlotRef.current % 2;
        sideCardRotateSlotRef.current += 1;

        const playingId = activeCardIdRef.current;
        const playing = isPlayingRef.current;
        if (playing && playingId && prev[slot]?.id === playingId) {
          slot = slot === 0 ? 1 : 0;
          if (prev[slot]?.id === playingId) return prev;
        }

        const next = pickNextSideCard(pool, prev);
        if (!next) return prev;

        const updated: GeneratorSideCard[] = [...prev];
        updated[slot] = next;
        try {
          window.sessionStorage.setItem(
            "producerhit_landing_gen_cards_v6_stored",
            JSON.stringify({ ts: Date.now(), cards: updated.slice(0, 2) }),
          );
        } catch {
          // ignore
        }
        return updated;
      });

      scheduleNext();
    };

    scheduleNext();
    return () => {
      cancelled = true;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, []);

  const handlePlay = (track: PublicTrack, queueTracks?: PublicTrack[]) => {
    if (track.id.startsWith("ph-")) {
      toast(locale === "fr" ? "Aperçu bientôt disponible" : "Preview coming soon");
      return;
    }
    if (current?.id === track.id) {
      setPlaying(!isPlaying);
      return;
    }
    trackClientEvent("landing_trending_play", { loop_id: track.id });
    void (async () => {
      const queue = queueTracks ?? trending.slice(0, 12);
      const rows = queue.map((t) =>
        landingTrackToPublicRow({
          id: t.id,
          name: t.name,
          genre: t.genre,
          mood: t.mood,
          bpm: t.bpm,
          audioUrl: t.audioUrl,
          stemsUrl: t.stemsUrl,
          prompt: t.prompt,
          createdAt: t.createdAt,
        }),
      );
      const idx = findPublicRowIndex(rows, track.id);
      const ok = await playPublicRowsInQueue(rows, idx >= 0 ? idx : 0, {
        source: LANDING_COMMUNITY_QUEUE_SOURCE,
        onRowUrlResolved: (rowId, url) => {
          setTrending((prev) => prev.map((t) => (t.id === rowId ? { ...t, audioUrl: url } : t)));
          setGeneratorSideCards((prev) => prev.map((c) => (c.id === rowId ? { ...c, audioUrl: url } : c)));
        },
      });
      if (!ok) {
        toast.error(locale === "fr" ? "Audio indisponible" : "Audio unavailable");
      }
    })();
  };

  const handlePlaySideCard = (card: GeneratorSideCard) => {
    trackClientEvent("landing_gen_card_play", { loop_id: card.id });
    if (card.id.startsWith("ph-")) {
      toast(locale === "fr" ? "Aperçu bientôt disponible" : "Preview coming soon");
      return;
    }
    if (current?.id === card.id) {
      setPlaying(!isPlaying);
      return;
    }
    void (async () => {
      const rows = generatorSideCards.map((c) =>
        landingTrackToPublicRow({
          id: c.id,
          name: c.name,
          genre: c.genre,
          mood: c.mood,
          bpm: c.bpm,
          audioUrl: c.audioUrl,
          stemsUrl: c.stemsUrl,
          prompt: c.prompt,
        }),
      );
      const idx = findPublicRowIndex(rows, card.id);
      const ok = await playPublicRowsInQueue(rows, idx >= 0 ? idx : 0, {
        source: LANDING_COMMUNITY_QUEUE_SOURCE,
        onRowUrlResolved: (rowId, url) => {
          setTrending((prev) => prev.map((t) => (t.id === rowId ? { ...t, audioUrl: url } : t)));
          setGeneratorSideCards((prev) => prev.map((c) => (c.id === rowId ? { ...c, audioUrl: url } : c)));
        },
      });
      if (!ok) {
        toast.error(locale === "fr" ? "Audio indisponible" : "Audio unavailable");
      }
    })();
  };

  const homeTrendingCards = useMemo(() => {
    return trending.slice(0, 12);
  }, [trending]);

  const repairMyPublicAudioLinks = async () => {
    if (!user || repairingPublicLinks) return;
    setRepairingPublicLinks(true);
    setRepairFixedCount(null);
    trackClientEvent("landing_repair_public_links_click");
    try {
      const { data, error } = await supabase
        .from("loops")
        .select("id, audio_url, stems_url")
        .eq("user_id", user.id)
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(24);
      if (error) throw error;
      const rows = (data ?? []) as Array<{ id: string; audio_url: string | null; stems_url: unknown }>;
      const candidates = rows
        .filter((r) => !(typeof r.audio_url === "string" && r.audio_url.trim().length > 0))
        .map((r) => ({ id: r.id, taskId: extractAceTaskId(r.stems_url) }))
        .filter((x) => x.taskId.length > 0)
        .slice(0, 8);

      let fixed = 0;
      for (const c of candidates) {
        const url = await resolveAceAudioUrl(c.taskId).catch(() => "");
        if (!url) continue;
        const { error: upErr } = await supabase.from("loops").update({ audio_url: url }).eq("id", c.id).eq("user_id", user.id);
        if (!upErr) fixed += 1;
      }

      setRepairFixedCount(fixed);
      try {
        window.sessionStorage.removeItem("producerhit_landing_trending_cache_v7");
        window.sessionStorage.removeItem("producerhit_community_cache_v7");
      } catch {
        void 0;
      }
      setTrendingRefreshKey((k) => k + 1);
    } catch {
      setRepairFixedCount(0);
    } finally {
      setRepairingPublicLinks(false);
    }
  };

  const [shouldLoadTrending, setShouldLoadTrending] = useState(false);

  useEffect(() => {
    /* Mobile v2 : strip visible dans le hero — le rail desktop (#trending) est hidden lg:block */
    if (mobileLandingFocus) {
      setShouldLoadTrending(true);
      return;
    }

    const el = document.getElementById("trending");
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoadTrending(true);
          observer.disconnect();
        }
      },
      { rootMargin: "480px 0px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [mobileLandingFocus]);

  /* Mobile v2 : hauteur hero = viewport réel (évite le débordement des stats) */
  useEffect(() => {
    if (!mobileLandingFocus) return;
    const pageEl = pageRef.current;
    if (!pageEl) return;

    const syncHeroViewport = () => {
      const dock = getComputedStyle(pageEl).getPropertyValue("--pk-mobile-dock-player").trim() || "0px";
      const dockPx = Number.parseFloat(dock) || 0;
      pageEl.style.setProperty("--pk-mobile-hero-h", `${Math.max(0, window.innerHeight - dockPx)}px`);
    };

    syncHeroViewport();
    window.addEventListener("resize", syncHeroViewport, { passive: true });
    window.visualViewport?.addEventListener("resize", syncHeroViewport);

    return () => {
      window.removeEventListener("resize", syncHeroViewport);
      window.visualViewport?.removeEventListener("resize", syncHeroViewport);
      pageEl.style.removeProperty("--pk-mobile-hero-h");
    };
  }, [mobileLandingFocus]);

  useEffect(() => {
    if (!shouldLoadTrending) return;
    let cancelled = false;
    const cacheKey = "producerhit_landing_trending_cache_v9";
    let loadedFromCache = false;
    try {
      const raw = window.sessionStorage.getItem(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { ts?: unknown; items?: unknown };
        const ts = typeof parsed?.ts === "number" ? parsed.ts : 0;
        const items = Array.isArray(parsed?.items) ? (parsed.items as unknown[]) : [];
        if (Date.now() - ts < 10 * 60 * 1000 && items.length) {
          const cached = items as PublicTrack[];
          setTrending(cached);
          setTrendingLoading(false);
          loadedFromCache = true;
        }
      }
    } catch {
      // ignore
    }

    if (!loadedFromCache) setTrendingLoading(true);
    setTrendingTimedOut(false);
    setTrendingError(null);
    const slowTimer = window.setTimeout(() => {
      if (!cancelled) setTrendingTimedOut(true);
    }, 6500);

    void (async () => {
      try {
        const rows = await fetchPublicLoops({ limit: 48, timeoutMs: 6500, playableOnly: true });
        if (cancelled) return;
        window.clearTimeout(slowTimer);
        setTrendingTimedOut(false);

        const mapped: PublicTrack[] = rows
          .filter((r) => typeof r.id === "string")
          .map((r) => {
            const name = (r.name ?? "Untitled").trim() || "Untitled";
            const genre = (r.genre ?? "").trim();
            const mood = (r.mood ?? "").trim();
            const bpm = typeof r.bpm === "number" ? r.bpm : null;
            const { kind, badge } = classifyTrack(genre, mood, name);
            const tags = [genre, mood, bpm ? `${bpm} BPM` : ""].filter((x) => x.length > 0);
            const color = getTrackGradient(r.id);
            const prompt = (r.prompt ?? "").trim() || [name, genre, mood, bpm ? `${bpm} BPM` : ""].filter(Boolean).join(", ");
            const audioUrlRaw = typeof r.audio_url === "string" ? r.audio_url.trim() : "";
            const stemsUrlObj = (() => {
              if (r.stems_url && typeof r.stems_url === "object") return r.stems_url as Record<string, unknown>;
              if (typeof r.stems_url === "string") {
                const raw = r.stems_url.trim();
                if (!raw) return null;
                try {
                  const parsed = JSON.parse(raw) as unknown;
                  return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
                } catch {
                  return null;
                }
              }
              return null;
            })();
            const coverUrl = resolvePublicRowCoverUrl(r);
            return {
              id: r.id,
              name,
              genre: genre || null,
              mood: mood || null,
              bpm,
              audioUrl: audioUrlRaw.length > 0 ? audioUrlRaw : null,
              stemsUrl: stemsUrlObj,
              createdAt: r.created_at ?? null,
              seed: typeof r.seed === "number" ? r.seed : null,
              kind,
              badge,
              tags,
              color,
              prompt,
              coverUrl,
              author: r.author ?? null,
            };
          });

        const next = mapped.slice(0, 12);
        setTrending(next);
        setTrendingLoading(false);
        try {
          window.sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), items: next }));
        } catch {
          void 0;
        }
      } catch {
        if (!cancelled) {
          window.clearTimeout(slowTimer);
          setTrendingTimedOut(false);
          setTrendingError(locale === "fr" ? "Impossible de charger la section communauté." : "Failed to load community section.");
          if (!loadedFromCache) setTrending([]);
          setTrendingLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
      window.clearTimeout(slowTimer);
    };
  }, [shouldLoadTrending, trendingRefreshKey, locale]);

  const currentPlan = normalizePlan(profile?.plan);

  useEffect(() => {
    if (!user?.id || profile) return;
    void refreshProfile();
  }, [user?.id, profile, refreshProfile]);

  useEffect(() => {
    if (authStatus !== "ready" || !user) return;
    const stayHome = new URLSearchParams(location.search).get("home") === "1";
    if (stayHome) return;
    if (!consumeJustAuthenticated() && !hasOAuthCallbackParams()) return;
    navigate(resolvePostAuthRedirect("/dashboard"), { replace: true });
  }, [authStatus, location.search, navigate, user]);

  const faqs = useMemo(() => {
    if (locale === "fr") {
      return [
        {
          q: "ProducerHit est-il un générateur de chansons IA royalty-free ?",
          a: "Oui — crée, écoute et exporte pour tes projets perso en Free. Pour monétiser (Spotify, YouTube, clients), passe Pro, Studio ou Plus.",
        },
        {
          q: "Usage commercial & propriété ?",
          a: COMMERCIAL_RIGHTS_FAQ.fr.a,
        },
        {
          q: "Puis-je exporter en WAV ?",
          a: "Oui — l'export WAV est disponible sur les offres Pro, Studio et Plus.",
        },
        {
          q: "Les liens audio expirent-ils ?",
          a: hostedAudioRetentionSummary("fr"),
        },
      ];
    }
    return [
      {
        q: "Is ProducerHit a royalty-free AI song creator?",
        a: "Yes — create, preview, and export tracks for personal projects on Free. Commercial monetization requires Pro, Studio, or Plus.",
      },
      {
        q: "Commercial use & ownership?",
        a: COMMERCIAL_RIGHTS_FAQ.en.a,
      },
      {
        q: "Can I download WAV?",
        a: "Yes — WAV export is available on Pro, Studio, and Plus plans.",
      },
      {
        q: "Do hosted audio links expire?",
        a: hostedAudioRetentionSummary("en"),
      },
    ];
  }, [locale]);

  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  return (
    <div
      ref={pageRef}
      className={cn(
        "relative min-h-screen pk-prism-stage pk-prism-stage--landing text-white",
        warmGlass && "pk-warm-glass-stage",
        cloud && "pk-cloud-stage",
        mobileLandingFocus && "pk-landing--mobile-focus",
        !user && "max-sm:pb-24",
      )}
      data-pk-cloud-accent={cloud ? cloudAccent : undefined}
    >
      {warmGlass ? (
        <div className="pk-warm-backdrop pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
          <WarmGlassBackdrop />
          <BackdropTextureVeil variant="marketing" />
        </div>
      ) : cloud ? (
        <div className="pk-warm-backdrop pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
          <CloudBackdrop />
        </div>
      ) : (
        <BackdropTextureVeil variant="landing" />
      )}

      <header
        ref={headerRef}
        className={cn(
          "pk-landing-header fixed inset-x-0 top-0 z-30 bg-transparent shadow-none transition-[box-shadow,backdrop-filter] duration-300",
          mobileLandingFocus && "pk-landing-header--mobile-focus-mode",
          mobileOpen && "pk-landing-header--menu-open",
        )}
      >
        <div className="pk-landing-header__bar mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-5 sm:py-3.5 lg:px-6">
          <div
            className={cn(
              "pk-landing-header__brand-slot min-w-0",
              mobileLandingFocus && "pk-landing-header__brand-slot--mobile sm:block",
            )}
          >
            <BrandLogo compact={mobileLandingFocus} />
          </div>

          <nav className="hidden items-center gap-3 sm:flex">
            <Link to="/community" className="text-sm font-semibold text-white/70 transition-colors hover:text-white">
              {locale === "fr" ? "Communauté" : "Community"}
            </Link>
            <Link to="#pricing" className="text-sm font-semibold text-white/70 transition-colors hover:text-white">
              {locale === "fr" ? "Tarifs" : "Pricing"}
            </Link>
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="pk-prism-btn inline-flex h-10 items-center justify-center rounded-full px-6 text-sm font-semibold"
                >
                  {locale === "fr" ? "Studio" : "Studio"}
                </Link>
              </>
            ) : (
              <>
                <Link
                  to={buildAuthUrl({ mode: "login" })}
                  className="pk-glass-btn pk-glass-btn--ghost inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-semibold"
                >
                  {locale === "fr" ? "Connexion" : "Login"}
                </Link>
                <HeroCtaButton to={buildAuthUrl()} variant="spark" size="nav">
                  {locale === "fr" ? "Essayer gratuit" : "Start Free"}
                </HeroCtaButton>
              </>
            )}
            <ThemeAndAccentPicker variant="nav-icon" />
            <LanguagePicker variant="nav" />
          </nav>

          <button
            type="button"
            className={cn(
              "pk-landing-mobile-nav__trigger inline-flex h-10 w-10 items-center justify-center rounded-full sm:hidden",
              mobileOpen && "is-open",
            )}
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label={locale === "fr" ? "Menu navigation" : "Navigation menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen ? (
          <div className="pk-landing-mobile-nav sm:hidden">
            <div className="pk-landing-mobile-nav__panel">
              <nav className="pk-landing-mobile-nav__list" aria-label={locale === "fr" ? "Menu mobile" : "Mobile menu"}>
                {user ? (
                  <Link
                    to="/dashboard"
                    className="pk-landing-mobile-nav__item pk-landing-mobile-nav__item--primary"
                    onClick={() => setMobileOpen(false)}
                  >
                    {locale === "fr" ? "Ouvrir le studio" : "Open studio"}
                  </Link>
                ) : null}
                <Link
                  to="/community"
                  className="pk-landing-mobile-nav__item"
                  onClick={() => setMobileOpen(false)}
                >
                  {locale === "fr" ? "Communauté" : "Community"}
                </Link>
                <Link
                  to="#pricing"
                  className="pk-landing-mobile-nav__item"
                  onClick={() => setMobileOpen(false)}
                >
                  {locale === "fr" ? "Tarifs" : "Pricing"}
                </Link>
                {!user ? (
                  <>
                    <Link
                      to={buildAuthUrl({ mode: "login" })}
                      className="pk-landing-mobile-nav__item"
                      onClick={() => setMobileOpen(false)}
                    >
                      {locale === "fr" ? "Connexion" : "Login"}
                    </Link>
                    <HeroCtaButton
                      to={buildAuthUrl()}
                      variant="spark"
                      size="nav"
                      className="pk-landing-mobile-nav__item pk-landing-mobile-nav__item--cta w-full rounded-[0.875rem]"
                      onClick={() => setMobileOpen(false)}
                    >
                      {locale === "fr" ? "Essayer gratuit" : "Start free"}
                    </HeroCtaButton>
                  </>
                ) : (
                  <Link
                    to="/?home=1"
                    className="pk-landing-mobile-nav__item pk-landing-mobile-nav__item--muted"
                    onClick={() => setMobileOpen(false)}
                  >
                    {locale === "fr" ? "Rester sur l’accueil" : "Stay on home"}
                  </Link>
                )}
              </nav>
              <div className="pk-landing-mobile-nav__footer">
                <ThemeAndAccentPicker variant="nav-icon" className="pk-landing-mobile-nav__theme" />
                <LanguagePicker variant="mobile" className="pk-landing-mobile-nav__locale" onChange={() => setMobileOpen(false)} />
              </div>
            </div>
          </div>
        ) : null}
      </header>

      <main ref={heroRef} className="relative z-10">
        {!warmGlass && !cloud ? (
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <LandingPrismScene spot={spot} reduceMotion={reduceMotion} />
          </div>
        ) : null}
        <RevealSection className={landingFlowSectionClass()}>
          <section
            className={cn(
              "pk-landing-flow__stack w-full",
              mobileLandingFocus && "pk-landing-flow__stack--mobile",
            )}
            aria-label="Hero"
          >
            <div
              className={cn(
                "pk-landing-flow__intro mx-auto w-full max-w-2xl text-center",
                mobileLandingFocus && "pk-landing-flow__intro--mobile",
              )}
            >
              {!mobileLandingFocus ? (
                <p className="font-semibold uppercase tracking-[0.18em] text-[10px] text-white/40">
                  {copy.heroTagline}
                </p>
              ) : null}
              <HeroDreamHeadline
                locale={locale}
                reduceMotion={reduceMotion}
                className={mobileLandingFocus ? "pk-hero-dream-wrap--mobile mt-3" : "mt-2"}
              />
              <p
                className={cn(
                  "pk-landing-hero-dream-sub mx-auto max-w-md text-pretty leading-relaxed text-white/55",
                  mobileLandingFocus ? "mt-2 text-[11px]" : "mt-3 text-xs sm:text-[13px]",
                )}
              >
                {dreamCopy.subline}
              </p>
              {CLOUD_THEME_ENABLED ? (
                <LandingHeroMoodStrip
                  locale={locale}
                  cloudActive={cloud}
                  compact={mobileLandingFocus}
                  minimal
                />
              ) : null}
            </div>

            {!mobileLandingFocus ? <div className="pk-landing-flow__handoff" aria-hidden /> : null}

            <div className={cn(mobileLandingFocus && "pk-landing-flow__gen-zone")}>
            <LandingGenerator
              embedded
              compactMobile={mobileLandingFocus}
              reduceMotion={reduceMotion}
              locale={locale}
              mode={mode}
              setMode={setMode}
              prompt={prompt}
              setPrompt={setPrompt}
              placeholders={placeholders}
              placeholderIndex={placeholderIndex}
              inputRef={inputRef}
              focused={focused}
              setFocused={setFocused}
              generating={generating}
              onGenerate={onGenerate}
              beatArtist={beatArtist}
              setBeatArtist={setBeatArtist}
              beatBpm={beatBpm}
              setBeatBpm={setBeatBpm}
              beatMood={beatMood}
              setBeatMood={setBeatMood}
              beatGenres={beatGenres}
              toggleGenre={toggleGenre}
              sideCards={generatorSideCards}
              activeCardId={current?.id ?? null}
              isPlaying={isPlaying}
              onPlayCard={handlePlaySideCard}
            />
            </div>

            {mobileLandingFocus ? (
              <LandingMobileTrendingStrip
                locale={locale}
                tracks={homeTrendingCards}
                loading={trendingLoading || !shouldLoadTrending}
                activeTrackId={current?.id ?? null}
                isPlaying={isPlaying}
                onPlay={(track) => {
                  const row = trending.find((t) => t.id === track.id);
                  if (row) handlePlay(row, trending.slice(0, 12));
                }}
                onCreateSimilar={(track) => {
                  const row = trending.find((t) => t.id === track.id);
                  if (row) startCreateFromTrack(row);
                }}
              />
            ) : (
              <p className="pk-landing-hero-reassurance mx-auto mt-4 max-w-md text-center text-[11px] font-semibold tracking-wide text-white/40">
                {copy.heroReassurance}
              </p>
            )}
          </section>
        </RevealSection>

        {CLOUD_THEME_ENABLED && mobileLandingFocus ? (
          <RevealSection className={`${landingSectionClass("pk-landing-section--cloud-moods-compact")} pk-landing-below-fold`}>
            <LandingCloudMoodsSection locale={locale} user={!!user} cloudActive={cloud} />
          </RevealSection>
        ) : null}

        {mobileLandingFocus ? (
          <RevealSection className={`${landingSectionClass("pk-landing-section--trust pk-landing-section--trust-compact")} pk-landing-below-fold`}>
            <LandingGeneratorBottomBand locale={locale} compact loggedIn={!!user} />
          </RevealSection>
        ) : (
          <RevealSection className={`${landingSectionClass("pk-landing-section--trust")} pk-landing-below-fold`}>
            <LandingGeneratorBottomBand locale={locale} loggedIn={!!user} />
          </RevealSection>
        )}

        {CLOUD_THEME_ENABLED && !mobileLandingFocus ? (
          <RevealSection className={`${landingSectionClass()} pk-landing-below-fold`}>
            <LandingCloudMoodsSection locale={locale} user={!!user} cloudActive={cloud} />
          </RevealSection>
        ) : null}

        <RevealSection className={`${landingSectionClass()} pk-landing-below-fold${mobileLandingFocus ? " hidden lg:block" : ""}`}>
          <LandingCommunityRail
            locale={locale}
            title={copy.communityTitle}
            lead={mobileLandingFocus ? (locale === "fr" ? "Tracks publics — écoute, remixe, publie." : "Public tracks — listen, remix, publish.") : copy.communityLead}
            tracks={homeTrendingCards}
            loading={trendingLoading || !shouldLoadTrending}
            activeTrackId={current?.id ?? null}
            isPlaying={isPlaying}
            onPlay={handlePlay}
            onRemix={remixFromLandingTrack}
            onRefresh={() => setTrendingRefreshKey((k) => k + 1)}
            footer={
              !trendingLoading && (trendingError || trendingTimedOut || typeof repairFixedCount === "number") ? (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#2d2d3d] bg-[#0a0a0f] px-4 py-3">
                  <div className="text-sm font-semibold text-white/80">
                    {typeof repairFixedCount === "number"
                      ? locale === "fr"
                        ? `Réparation: ${repairFixedCount} lien(s) restauré(s).`
                        : `Repair: ${repairFixedCount} link(s) restored.`
                      : trendingError
                        ? trendingError
                        : trendingTimedOut
                          ? locale === "fr"
                        ? "Chargement lent…"
                        : "Slow load…"
                          : ""}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setTrendingRefreshKey((k) => k + 1)}
                      className="inline-flex h-10 items-center justify-center rounded-full border border-[#2d2d3d] bg-transparent px-5 text-sm font-semibold text-white/80 transition-all hover:border-[#7c3aed]/50 hover:text-white"
                    >
                      {locale === "fr" ? "Réessayer" : "Retry"}
                    </button>
                    {user ? (
                      <button
                        type="button"
                        onClick={() => void repairMyPublicAudioLinks()}
                        disabled={repairingPublicLinks}
                        className={[
                          "inline-flex h-10 items-center justify-center rounded-full border border-[#2d2d3d] bg-transparent px-5 text-sm font-semibold transition-all",
                          repairingPublicLinks ? "cursor-not-allowed text-white/40 opacity-70" : "text-white/80 hover:border-[#7c3aed]/50 hover:text-white",
                        ].join(" ")}
                      >
                    {repairingPublicLinks ? (locale === "fr" ? "Réparation…" : "Repairing…") : locale === "fr" ? "Réparer mes Public" : "Repair my Public"}
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null
            }
          />
        </RevealSection>

        <RevealSection className={`${landingSectionClass()} pk-landing-below-fold`}>
          <LandingBenefits locale={locale} />
        </RevealSection>

        <RevealSection id="how" className={`${landingSectionClass()} pk-landing-below-fold`}>
          <LandingWorkflow locale={locale} />
        </RevealSection>

        <RevealSection className={`${landingSectionClass()} pk-landing-below-fold`}>
          <LandingPricingTeaser locale={locale} user={!!user} currentPlan={currentPlan} />
        </RevealSection>

        <RevealSection className={`${landingSectionClass()} pk-landing-below-fold`}>
          <TestimonialsStrip locale={locale} compact />
        </RevealSection>

        <RevealSection className={`${landingSectionClass()} pk-landing-below-fold`}>
          <div className="pk-prism-card relative overflow-hidden p-6 sm:p-10">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(157,124,255,0.08)_0%,transparent_72%)]" />
            </div>
            <div className="relative">
              <div className="text-balance text-[clamp(1.75rem,4.2vw,3rem)] font-extrabold tracking-tight text-white">{copy.ctaTitle}</div>
              <div className="mt-3 text-balance text-[clamp(0.95rem,2vw,1.125rem)] font-semibold leading-relaxed text-white/55">
                {copy.ctaLead}
              </div>
              <div className="mt-8">
                <HeroCtaButton to={buildAuthUrl()} variant="beam" size="lg">
                  {copy.ctaButton}
                </HeroCtaButton>
              </div>
            </div>
          </div>
        </RevealSection>

        <RevealSection className={`${landingSectionClass()} pk-landing-below-fold`}>
          <div className="pk-prism-card p-5 sm:p-8">
            <h2 className="pk-landing-section-head__title text-left">FAQ</h2>
            <div className="mt-6 grid gap-2">
              {faqs.map((f, i) => {
                const open = faqOpen === i;
                return (
                  <details
                    key={f.q}
                    open={open}
                    onToggle={(e) => {
                      const isOpen = (e.currentTarget as HTMLDetailsElement).open;
                      setFaqOpen(isOpen ? i : null);
                    }}
                    className="rounded-2xl border border-white/10 bg-white/[0.03]"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left">
                      <span className="text-sm font-semibold text-white">{f.q}</span>
                      <span className="text-sm font-semibold text-white/45">{open ? "–" : "+"}</span>
                    </summary>
                    <div className="px-5 pb-5 text-sm text-white/55">{f.a}</div>
                  </details>
                );
              })}
            </div>
          </div>
        </RevealSection>

        <LandingFooter locale={locale} user={user} />
      </main>

      <LandingStickyCta locale={locale} user={!!user} visible={!mobileLandingFocus} />
    </div>
  );
}
