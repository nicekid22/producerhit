import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState, useCallback, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/stores/authStore";
import { supabase, trackClientEvent } from "@/lib/supabaseClient";
import { useLocaleStore } from "@/stores/localeStore";
import { FolderOpen, Keyboard, Menu, Mic2, Sparkles, Video, X, Zap } from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";
import type { Loop } from "@/types/loop";
import { publicRowToCoverLoop, resolvePublicRowCoverUrl } from "@/lib/coverArt";
import { LANDING_PINTEREST_COVERS } from "@/lib/featureFlags";
import {
  enrichTracksWithPinterestCovers,
  isPinterestSideCard,
  resolveSideCardsWithPinterest,
  warmLandingPinterestCovers,
} from "@/lib/pinterestCoverFetch";
import {
  consumeJustAuthenticated,
  hasOAuthCallbackParams,
} from "@/lib/postAuthRedirect";
import { coverGradient, hashString } from "@/lib/utils";
import {
  extractAceTaskId,
  fetchPublicLoops,
  isPlayablePublicLoop,
  resolveAceAudioUrl,
  resolvePlayableCommunityAudio,
  type PublicLoopRow,
} from "@/lib/publicLoops";
import { LandingPrismScene } from "@/components/landing/LandingPrismScene";
import { BrandLogo } from "@/components/landing/BrandLogo";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LogoMarquee } from "@/components/landing/LogoMarquee";
import { SocialProofStats } from "@/components/landing/SocialProofStats";
import { TestimonialsStrip } from "@/components/landing/TestimonialsStrip";
import { LandingSocialFeed } from "@/components/landing/LandingSocialFeed";
import { LandingCommunityRail } from "@/components/landing/LandingCommunityRail";
import { LandingGenerator, type GeneratorSideCard } from "@/components/landing/LandingGenerator";
import { LandingWorkflow } from "@/components/landing/LandingWorkflow";
import { HeroCtaButton } from "@/components/landing/HeroCtaButton";
import { HeroTypewriterPrompt } from "@/components/landing/HeroTypewriterPrompt";
import { LandingValueGrid } from "@/components/landing/LandingValueGrid";
import { LandingPitchSections } from "@/components/landing/LandingPitchSections";
import { landingCopy, landingFeatureCards, landingFlowSectionClass, landingSectionClass } from "@/lib/landingContent";
import { PLAN_LIMITS } from "@/lib/planLimits";
import { isRecommendedPlan, normalizePlan, pricingCtaHref, pricingCtaMeta } from "@/lib/billing";
import { plusPermanentAudioBenefit } from "@/lib/loopAudioRetention";
import { PricingPlanButton } from "@/components/pricing/PricingPlanButton";
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
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (shown) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.14, rootMargin: "0px 0px -10% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [shown]);

  return (
    <section
      id={id}
      ref={ref}
      className={[
        "pk-prism-reveal",
        shown ? "pk-prism-reveal--shown" : "pk-prism-reveal--hidden",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </section>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const authStatus = useAuthStore((s) => s.status);
  const profile = useAuthStore((s) => s.profile);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const copy = useMemo(() => landingCopy(locale), [locale]);

  const [navScrolled, setNavScrolled] = useState(false);
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
  const setCurrent = usePlayerStore((s) => s.setCurrent);
  const setPlaying = usePlayerStore((s) => s.setPlaying);

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const pageRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLDivElement | null>(null);
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
      coverBg: coverGradient(loopForCover),
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
      const coverUrl = t.coverUrl?.trim() ?? "";
      if (!coverUrl.startsWith("http")) return null;
      const loopForCover = publicRowToCoverLoop({
        id: t.id,
        name: t.name,
        genre: t.genre,
        mood: t.mood,
        bpm: t.bpm,
        prompt: t.prompt,
        stems_url: t.stemsUrl ?? null,
        seed: t.seed ?? null,
        created_at: t.createdAt,
      });
      return {
        id: t.id,
        title: t.name,
        subtitle: t.tags.slice(0, 3).join(" · ") || t.badge,
        coverUrl,
        coverBg: coverGradient(loopForCover),
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
    const onScroll = () => setNavScrolled(window.scrollY > 8);
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

  const inferSongPrompt = () => {
    const base = prompt.trim();
    if (base) return base;
    return placeholders[placeholderIndex] ?? "Afrobeats summer hit with female vocals";
  };

  const onGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 1500));
    const promptValue = mode === "beat" ? inferBeatPrompt() : inferSongPrompt();
    if (!user) {
      trackClientEvent("landing_generate_click", { mode });
      try {
        window.localStorage.setItem("producerhit_pending_source", "landing");
      } catch {
        void 0;
      }
      window.localStorage.setItem("producerhit_pending_prompt", promptValue);
      navigate("/auth");
      return;
    }
    trackClientEvent("landing_generate_click", { mode });
    try {
      window.localStorage.setItem("producerhit_pending_source", "landing");
    } catch {
      void 0;
    }
    navigate(`/dashboard?prompt=${encodeURIComponent(promptValue)}`);
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
    pinterestCoverUrl?: string | null;
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
    const cacheKey = LANDING_PINTEREST_COVERS
      ? "producerhit_landing_gen_cards_v5_pin"
      : "producerhit_landing_gen_cards_v4";
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
      if (LANDING_PINTEREST_COVERS) {
        void warmLandingPinterestCovers();
      }

      try {
        const raw = window.sessionStorage.getItem(cacheKey);
        if (raw) {
          const parsed = JSON.parse(raw) as { ts?: unknown; cards?: unknown };
          const ts = typeof parsed?.ts === "number" ? parsed.ts : 0;
          const cached = Array.isArray(parsed?.cards) ? (parsed.cards as GeneratorSideCard[]) : [];
          const ok =
            Date.now() - ts < 15 * 60 * 1000 &&
            hasValidCoverUrl(cached) &&
            (!LANDING_PINTEREST_COVERS || cached.every(isPinterestSideCard));
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
        const finalCards = LANDING_PINTEREST_COVERS
          ? await resolveSideCardsWithPinterest(picked)
          : picked;

        if (cancelled) return;
        commitSideCards(finalCards);
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

        if (LANDING_PINTEREST_COVERS) {
          const slotAtSchedule = slot;
          void resolveSideCardsWithPinterest([next]).then((enriched) => {
            if (cancelled || !enriched[0]) return;
            setGeneratorSideCards((cur) => {
              if (cur.length < 2) return cur;
              const updated: GeneratorSideCard[] = [...cur];
              if (updated[slotAtSchedule]?.id !== next.id) return cur;
              updated[slotAtSchedule] = enriched[0]!;
              try {
                const key = "producerhit_landing_gen_cards_v5_pin";
                window.sessionStorage.setItem(
                  key,
                  JSON.stringify({ ts: Date.now(), cards: updated.slice(0, 2) }),
                );
              } catch {
                // ignore
              }
              return updated;
            });
          });
          return prev;
        }

        const updated: GeneratorSideCard[] = [...prev];
        updated[slot] = next;
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

  const handlePlay = (track: { id: string; audioUrl: string | null; stemsUrl?: Record<string, unknown> | null; name: string; prompt: string; genre: string | null; mood: string | null; bpm: number | null }) => {
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
      const buildLoop = (url: string): Loop => ({
        id: track.id,
        name: track.name,
        genre: track.genre ?? "",
        influence: "No Influence",
        key: "",
        scale: "",
        bpm: typeof track.bpm === "number" ? track.bpm : 0,
        loopLength: "16 bars",
        swing: 0,
        mood: track.mood ?? "",
        energyLevel: "Medium",
        reverb: "Subtle",
        prompt: track.prompt,
        audioUrl: url,
        details: null,
        stemsUrl: track.stemsUrl && typeof track.stemsUrl === "object" ? (track.stemsUrl as Record<string, unknown>) : null,
        isSaved: false,
        isPublic: true,
        createdAt: new Date().toISOString(),
      });

      const row: PublicLoopRow = {
        id: track.id,
        name: track.name,
        genre: track.genre,
        mood: track.mood,
        bpm: track.bpm,
        prompt: track.prompt,
        audio_url: track.audioUrl,
        stems_url: track.stemsUrl ?? null,
        created_at: null,
      };

      const resolved = await resolvePlayableCommunityAudio(row).catch(() => "");
      if (resolved) {
        if (!resolved.startsWith("blob:") && resolved !== track.audioUrl?.trim()) {
          setTrending((prev) => prev.map((t) => (t.id === track.id ? { ...t, audioUrl: resolved } : t)));
          setGeneratorSideCards((prev) =>
            prev.map((c) => (c.id === track.id ? { ...c, audioUrl: resolved } : c)),
          );
        }
        setCurrent(buildLoop(resolved), true);
        return;
      }

      toast.error(locale === "fr" ? "Audio indisponible" : "Audio unavailable");
    })();
  };

  const handlePlaySideCard = (card: GeneratorSideCard) => {
    trackClientEvent("landing_gen_card_play", { loop_id: card.id });
    handlePlay({
      id: card.id,
      audioUrl: card.audioUrl,
      stemsUrl: card.stemsUrl ?? null,
      name: card.name,
      prompt: card.prompt,
      genre: card.genre,
      mood: card.mood,
      bpm: card.bpm,
    });
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
  }, []);

  useEffect(() => {
    if (!shouldLoadTrending) return;
    let cancelled = false;
    const cacheKey = "producerhit_landing_trending_cache_v8";
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
          if (LANDING_PINTEREST_COVERS && cached.some((t) => !t.pinterestCoverUrl?.trim())) {
            void enrichTracksWithPinterestCovers(cached).then((enriched) => {
              if (!cancelled) setTrending(enriched);
            });
          }
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
        void enrichTracksWithPinterestCovers(next).then((enriched) => {
          if (cancelled) return;
          setTrending(enriched);
          try {
            window.sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), items: enriched }));
          } catch {
            void 0;
          }
        });
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

  const pricing = useMemo(() => {
    if (locale === "fr") {
      return [
        {
          tier: "free" as const,
          name: "Free",
          price: "0€",
          meta: `${PLAN_LIMITS.free} générations / mois`,
          bullets: [`✓ ${PLAN_LIMITS.free} gen Song + Beat`, "✓ Export MP3 royalty-free", "✓ Bibliothèque cloud", "✗ Export WAV / stems"],
          featured: false,
        },
        {
          tier: "pro" as const,
          name: "Pro",
          price: "10€/mo",
          meta: "75 générations / mois",
          bullets: ["✓ Export WAV + MP3", "✓ Cover art + partage pro", "✓ Usage commercial", "✓ 75 gen / mois"],
          featured: true,
        },
        {
          tier: "studio" as const,
          name: "Studio",
          price: "30€/mo",
          meta: "250 générations / mois",
          bullets: ["✓ Tout Pro inclus", "✓ Mastering Studio complet", "✓ Remix ACE + seeds", "✓ 250 gen / mois"],
          featured: false,
        },
        {
          tier: "plus" as const,
          name: "Plus",
          price: "89€/mo",
          meta: `${PLAN_LIMITS.plus} générations / mois`,
          bullets: [`✓ ${PLAN_LIMITS.plus} gen / mois`, "✓ Priorité & rapidité", "✓ Stems ZIP séparés", "✓ Tout Studio inclus"],
          featured: false,
        },
      ];
    }
    return [
      {
        tier: "free" as const,
        name: "Free",
        price: "$0",
        meta: `${PLAN_LIMITS.free} generations / month`,
        bullets: [`✓ ${PLAN_LIMITS.free} Song + Beat gens`, "✓ Royalty-free MP3", "✓ Cloud library", "✗ WAV / stems export"],
        featured: false,
      },
      {
        tier: "pro" as const,
        name: "Pro",
        price: "$10/mo",
        meta: "75 generations / month",
        bullets: ["✓ WAV + MP3 export", "✓ Cover art + pro share", "✓ Commercial use", "✓ 75 gen / month"],
        featured: true,
      },
      {
        tier: "studio" as const,
        name: "Studio",
        price: "$30/mo",
        meta: "250 generations / month",
        bullets: ["✓ Everything in Pro", "✓ Full Mastering Studio", "✓ Remix ACE + seeds", "✓ 250 gen / month"],
        featured: false,
      },
      {
        tier: "plus" as const,
        name: "Plus",
        price: "$89/mo",
        meta: `${PLAN_LIMITS.plus} generations / month`,
        bullets: [
          `✓ ${PLAN_LIMITS.plus} gen / month`,
          `✓ ${plusPermanentAudioBenefit("en")}`,
          "✓ Priority & speed",
          "✓ Separate stems ZIP",
          "✓ Everything in Studio",
        ],
        featured: false,
      },
    ];
  }, [locale]);

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
    navigate("/dashboard", { replace: true });
  }, [authStatus, location.search, navigate, user]);

  const faqs = useMemo(() => {
    if (locale === "fr") {
      return [
        {
          q: "ProducerHit est-il un générateur de chansons IA royalty-free ?",
          a: "Oui — tu peux créer, écouter et exporter des morceaux pour tes projets. Pour une release commerciale, respecte les conditions des modèles/providers et les règles des plateformes.",
        },
        {
          q: "Usage commercial & propriété ?",
          a: "Tu peux télécharger tes générations. Pour une exploitation commerciale, vérifie toujours les termes des services utilisés et les politiques des distributeurs.",
        },
        {
          q: "Puis-je exporter en WAV ?",
          a: "Oui — l'export WAV est disponible sur les offres Pro et Studio.",
        },
      ];
    }
    return [
      {
        q: "Is ProducerHit a royalty-free AI song creator?",
        a: "Yes — you can create, preview, and export tracks for your projects. For commercial releases, follow model/provider terms and platform rules.",
      },
      {
        q: "Commercial use & ownership?",
        a: "You can download your generations. For commercial use, always follow the model/provider terms and your distributor's policies.",
      },
      {
        q: "Can I download WAV?",
        a: "Yes — WAV export is available on Pro and Studio plans.",
      },
    ];
  }, [locale]);

  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  return (
    <div ref={pageRef} className="min-h-screen pk-prism-stage pk-prism-stage--landing text-white">

      <header
        className={[
          "pk-landing-header fixed inset-x-0 top-0 z-30 bg-transparent transition-[box-shadow,backdrop-filter] duration-300",
          navScrolled ? "pk-landing-header--scrolled" : "shadow-none",
        ].join(" ")}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-5 sm:py-3.5 lg:px-6">
          <BrandLogo />

          <nav className="hidden items-center gap-3 sm:flex">
            <Link to="/community" className="text-sm font-semibold text-white/70 transition-colors hover:text-white">
              {locale === "fr" ? "Communauté" : "Community"}
            </Link>
            <Link to="/pricing" className="text-sm font-semibold text-white/70 transition-colors hover:text-white">
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
                  to="/auth"
                  className="pk-glass-btn pk-glass-btn--ghost inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-semibold"
                >
                  {locale === "fr" ? "Connexion" : "Login"}
                </Link>
                <HeroCtaButton to="/auth" variant="spark" size="nav">
                  {locale === "fr" ? "Essayer gratuit" : "Start Free"}
                </HeroCtaButton>
              </>
            )}
            <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
              <button
                type="button"
                onClick={() => setLocale("en")}
                className={[
                  "h-8 rounded-full px-3 text-xs font-semibold transition-colors",
                  locale === "en" ? "pk-prism-pill-active" : "text-white/45 hover:text-white",
                ].join(" ")}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLocale("fr")}
                className={[
                  "h-8 rounded-full px-3 text-xs font-semibold transition-colors",
                  locale === "fr" ? "pk-prism-pill-active" : "text-white/45 hover:text-white",
                ].join(" ")}
              >
                FR
              </button>
            </div>
          </nav>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white sm:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label={locale === "fr" ? "Menu navigation" : "Navigation menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen ? (
          <div className="border-t border-white/10 bg-[rgba(6,6,12,0.96)] backdrop-blur-xl sm:hidden">
            <nav className="mx-auto flex max-w-6xl flex-col gap-1.5 px-4 py-4" aria-label={locale === "fr" ? "Menu mobile" : "Mobile menu"}>
              {user ? (
                <Link
                  to="/dashboard"
                  className="pk-prism-btn inline-flex h-11 items-center justify-center rounded-xl text-sm font-semibold"
                  onClick={() => setMobileOpen(false)}
                >
                  {locale === "fr" ? "Ouvrir le studio" : "Open studio"}
                </Link>
              ) : null}
              <Link
                to="/community"
                className="pk-glass-btn pk-glass-btn--ghost inline-flex h-11 items-center justify-center rounded-xl text-sm font-semibold text-white"
                onClick={() => setMobileOpen(false)}
              >
                {locale === "fr" ? "Communauté" : "Community"}
              </Link>
              <Link
                to="/pricing"
                className="pk-glass-btn pk-glass-btn--ghost inline-flex h-11 items-center justify-center rounded-xl text-sm font-semibold text-white"
                onClick={() => setMobileOpen(false)}
              >
                {locale === "fr" ? "Tarifs" : "Pricing"}
              </Link>
              {!user ? (
                <>
                  <Link
                    to="/auth"
                    className="pk-glass-btn pk-glass-btn--ghost inline-flex h-11 items-center justify-center rounded-xl text-sm font-semibold text-white"
                    onClick={() => setMobileOpen(false)}
                  >
                    {locale === "fr" ? "Connexion" : "Login"}
                  </Link>
                  <HeroCtaButton
                    to="/auth"
                    variant="spark"
                    size="nav"
                    className="w-full rounded-xl"
                    onClick={() => setMobileOpen(false)}
                  >
                    {locale === "fr" ? "Essayer gratuit" : "Start free"}
                  </HeroCtaButton>
                </>
              ) : (
                <Link
                  to="/?home=1"
                  className="pk-glass-btn pk-glass-btn--ghost inline-flex h-11 items-center justify-center rounded-xl text-sm font-semibold text-white/80"
                  onClick={() => setMobileOpen(false)}
                >
                  {locale === "fr" ? "Rester sur l’accueil" : "Stay on home"}
                </Link>
              )}
              <div className="mt-1 flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
                <button
                  type="button"
                  onClick={() => {
                    setLocale("en");
                    setMobileOpen(false);
                  }}
                  className={[
                    "flex-1 rounded-full px-3 py-2 text-xs font-semibold transition-colors",
                    locale === "en" ? "pk-prism-pill-active" : "text-white/45",
                  ].join(" ")}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLocale("fr");
                    setMobileOpen(false);
                  }}
                  className={[
                    "flex-1 rounded-full px-3 py-2 text-xs font-semibold transition-colors",
                    locale === "fr" ? "pk-prism-pill-active" : "text-white/45",
                  ].join(" ")}
                >
                  FR
                </button>
              </div>
            </nav>
          </div>
        ) : null}
      </header>

      <main ref={heroRef} className="relative z-10">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <LandingPrismScene spot={spot} reduceMotion={reduceMotion} />
        </div>
        <RevealSection className={landingFlowSectionClass()}>
          <section className="pk-landing-flow__stack w-full" aria-label="Hero">
            <div className="pk-landing-flow__intro mx-auto w-full max-w-2xl text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                {copy.heroTagline}
              </p>
              <HeroTypewriterPrompt locale={locale} reduceMotion={reduceMotion} className="mt-2" />
              <p className="mx-auto mt-2 max-w-lg text-pretty text-xs leading-relaxed text-white/45 sm:text-[13px]">
                {copy.heroLead}
              </p>
            </div>

            <div className="pk-landing-flow__handoff" aria-hidden />

            <LandingGenerator
              embedded
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
          </section>
        </RevealSection>

        <RevealSection className={`${landingSectionClass("pk-landing-section--trust")} pk-landing-below-fold`}>
          <LogoMarquee locale={locale} />
          <SocialProofStats locale={locale} />
        </RevealSection>

        <RevealSection className={`${landingSectionClass()} pk-landing-below-fold`}>
          <LandingCommunityRail
            locale={locale}
            title={copy.communityTitle}
            lead={copy.communityLead}
            tracks={homeTrendingCards}
            loading={trendingLoading || !shouldLoadTrending}
            activeTrackId={current?.id ?? null}
            isPlaying={isPlaying}
            onPlay={handlePlay}
            onRemix={(t) => applyTrackPrompt(t.prompt, t.kind)}
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

        <RevealSection id="features" className={`${landingSectionClass()} pk-landing-below-fold`}>
          <div className="pk-landing-section-head">
            <h2 className="pk-landing-section-head__title">{copy.featuresTitle}</h2>
            <p className="pk-landing-section-head__lead">{copy.featuresLead}</p>
          </div>
          <div className="mt-8 grid gap-3 sm:mt-10 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
            {landingFeatureCards(locale).map((x, i) => {
              const icons = [Mic2, Keyboard, Sparkles, Video, Zap, FolderOpen] as const;
              const Icon = icons[i] ?? Mic2;
              return (
              <div key={x.title} className="pk-prism-card p-6">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                  <Icon className="h-5 w-5 text-[var(--prism-cyan)]" strokeWidth={1.75} />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">{x.title}</h3>
                <div className="mt-2 text-sm text-white/55">{x.description}</div>
              </div>
              );
            })}
          </div>
        </RevealSection>

        <RevealSection className={`${landingSectionClass()} pk-landing-below-fold`}>
          <div className="grid gap-16 sm:gap-20">
            <LandingPitchSections locale={locale} user={!!user} />
            <LandingValueGrid locale={locale} user={!!user} />
          </div>
        </RevealSection>

        <RevealSection id="how" className={`${landingSectionClass()} pk-landing-below-fold`}>
          <LandingWorkflow locale={locale} />
        </RevealSection>

        <RevealSection className={`${landingSectionClass()} pk-landing-below-fold`}>
          <div className="pk-landing-section-head">
            <h2 className="pk-landing-section-head__title">
              <span className="pk-prism-holo-text">{locale === "fr" ? "Tarifs" : "Pricing"}</span>
            </h2>
            <p className="pk-landing-section-head__lead mt-2 sm:hidden">
              {locale === "fr" ? "Glisse pour comparer les plans →" : "Swipe to compare plans →"}
            </p>
          </div>
          <div className="pk-pricing-rail mt-8 flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible xl:grid-cols-4 xl:items-stretch">
            {pricing.map((p) => {
              const tier = p.tier;
              const isCurrent = tier === currentPlan;
              const recommended = isRecommendedPlan(tier, currentPlan);
              const cta = pricingCtaMeta(tier, currentPlan, locale, { isLoggedIn: !!user });
              const ctaHref = pricingCtaHref(tier, currentPlan, !!user);

              return (
              <div
                key={p.name}
                className={[
                  "pk-prism-card flex h-full w-[min(82vw,300px)] flex-shrink-0 snap-center flex-col p-6 sm:w-auto sm:min-w-0 sm:flex-shrink sm:snap-align-none",
                  "min-h-[380px] sm:min-h-[400px]",
                  recommended ? "border-[#b968ff]/60 shadow-[0_0_70px_rgba(186,104,255,0.18)]" : "",
                  isCurrent ? "ring-1 ring-[#7c3aed]/35" : "",
                ].join(" ")}
              >
                <div className="flex min-h-7 items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-white">{p.name}</div>
                  {isCurrent ? (
                    <div className="shrink-0 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-[10px] font-semibold leading-none text-emerald-300">
                      {locale === "fr" ? "Actif" : "Active"}
                    </div>
                  ) : recommended ? (
                    <div className="shrink-0 rounded-full border border-[#7c3aed44] bg-[#7c3aed11] px-2 py-1 text-[11px] font-semibold leading-none text-[#a78bfa]">
                      {locale === "fr" ? "Le plus populaire" : "Most popular"}
                    </div>
                  ) : (
                    <span className="h-6 w-6 shrink-0" aria-hidden />
                  )}
                </div>
                <div className="mt-4 text-3xl font-extrabold leading-none tracking-tight text-white">{p.price}</div>
                <div className="mt-2 text-sm font-semibold leading-snug text-[#6b7280]">{p.meta}</div>
                <div className="mt-5 flex flex-1 flex-col gap-2.5 text-sm leading-snug text-white/80">
                  {p.bullets.map((b) => (
                    <div key={b} className="flex items-start gap-2.5">
                      <span className={`mt-0.5 shrink-0 ${b.startsWith("✓") ? "text-[#a78bfa]" : "text-[#6b7280]"}`}>{b.slice(0, 1)}</span>
                      <span className={`min-w-0 flex-1 ${b.startsWith("✗") ? "text-[#6b7280]" : ""}`}>{b.slice(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-auto pt-5">
                  <PricingPlanButton
                    tier={tier}
                    cta={cta}
                    disabled={cta.disabled}
                    to={ctaHref}
                  />
                </div>
              </div>
              );
            })}
          </div>
          <p className="pk-landing-section-head__lead mt-6 text-center">
            {locale === "fr" ? (
              <>
                Paiement Stripe sécurisé · crédits activés instantanément ·{" "}
                <Link to="/pricing" className="text-[#a78bfa] hover:underline">
                  voir tous les détails
                </Link>
              </>
            ) : (
              <>
                Secure Stripe checkout · credits unlock instantly ·{" "}
                <Link to="/pricing" className="text-[#a78bfa] hover:underline">
                  see full details
                </Link>
              </>
            )}
          </p>
        </RevealSection>

        <RevealSection id="social" className={`${landingSectionClass()} pk-landing-below-fold`}>
          <LandingSocialFeed locale={locale} />
        </RevealSection>

        <RevealSection className={`${landingSectionClass()} pk-landing-below-fold`}>
          <TestimonialsStrip locale={locale} />
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
                <HeroCtaButton to="/auth" variant="beam" size="lg">
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
    </div>
  );
}
