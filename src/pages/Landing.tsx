import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/stores/authStore";
import { supabase, trackClientEvent } from "@/lib/supabaseClient";
import { useLocaleStore } from "@/stores/localeStore";
import { BadgeCheck, FolderOpen, Keyboard, Mic2, Music2, Pause, Play, ShieldCheck, SkipBack, SkipForward, Sparkles, Zap } from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";
import type { Loop } from "@/types/loop";
import { coverGradient, coverImageUrl, hashString } from "@/lib/utils";
import {
  extractAceTaskId,
  fetchPublicLoops,
  isPlayablePublicLoop,
  resolveAceAudioUrl,
} from "@/lib/publicLoops";
import { WaveformVisualizer } from "@/components/WaveformVisualizer";
import { LandingPrismScene } from "@/components/landing/LandingPrismScene";
import { BrandLogo } from "@/components/landing/BrandLogo";
import { PLAN_LIMITS } from "@/lib/planLimits";

type CreateMode = "song" | "beat";

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
        "pk-prism-reveal will-change-transform",
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
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [mode, setMode] = useState<CreateMode>("song");
  const [prompt, setPrompt] = useState("");
  const [focused, setFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [howActive, setHowActive] = useState(0);
  const howCardRefs = useRef<Array<HTMLDivElement | null>>([]);

  const [beatArtist, setBeatArtist] = useState("");
  const [beatBpm, setBeatBpm] = useState(130);
  const [beatMood, setBeatMood] = useState("Hype");
  const [beatGenres, setBeatGenres] = useState<string[]>(["Trap"]);

  const [generating, setGenerating] = useState(false);

  const current = usePlayerStore((s) => s.current);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const progress = usePlayerStore((s) => s.progress);
  const currentTimeSec = usePlayerStore((s) => s.currentTimeSec);
  const durationSec = usePlayerStore((s) => s.durationSec);
  const queue = usePlayerStore((s) => s.queue);
  const queueIndex = usePlayerStore((s) => s.queueIndex);
  const queueSource = usePlayerStore((s) => s.queueSource);
  const setCurrent = usePlayerStore((s) => s.setCurrent);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const setPlaying = usePlayerStore((s) => s.setPlaying);

  const formatTime = (sec: number) => {
    if (!sec || !Number.isFinite(sec) || sec < 0) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

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
  const [parallax, setParallax] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
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
        const dx = (v.x - 0.5) * 28;
        const dy = (v.y - 0.5) * 22;
        setParallax({ x: Math.round(dx * 10) / 10, y: Math.round(dy * 10) / 10 });
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

  useEffect(() => {
    if (reduceMotion) return;
    const els = howCardRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!els.length) return;
    const thresholds = [0.15, 0.25, 0.35, 0.5, 0.65, 0.8];
    const obs = new IntersectionObserver(
      (entries) => {
        let best: IntersectionObserverEntry | null = null;
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          if (!best || e.intersectionRatio > best.intersectionRatio) best = e;
        }
        if (!best) return;
        const idx = els.indexOf(best.target as HTMLDivElement);
        if (idx >= 0) setHowActive(idx);
      },
      { threshold: thresholds },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;
    const el = pageRef.current;
    if (!el) return;
    let raf: number | null = null;
    const tick = () => {
      raf = null;
      const y = typeof window !== "undefined" ? window.scrollY || 0 : 0;
      const vh = typeof window !== "undefined" ? window.innerHeight || 1 : 1;
      const p = Math.max(0, Math.min(1, y / Math.max(1, vh * 0.9)));
      el.style.setProperty("--pk-scroll", p.toFixed(4));
    };
    const onScroll = () => {
      if (raf != null) return;
      raf = window.requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf != null) window.cancelAnimationFrame(raf);
    };
  }, [reduceMotion]);

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
            "Un hit Afrobeats d’été avec guitares lumineuses et refrain catchy…",
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

  const heroBadge =
    locale === "fr"
      ? "Libre de droits · Chansons complètes · Type beats · Qualité studio"
      : "Royalty-free · Full songs · Type beats · Studio quality";

  const smartChips = useMemo(() => {
    if (mode === "song") {
      return locale === "fr"
        ? ["+ vocals féminines", "+ hook catchy", "+ radio-ready", "+ gros refrain", "+ émotionnel", "+ mix moderne"]
        : ["+ female vocals", "+ catchy hook", "+ radio-ready", "+ big chorus", "+ emotional", "+ modern mix"];
    }
    return locale === "fr"
      ? ["+ 808 lourdes", "+ mélodie dark", "+ trap", "+ drill", "+ émotionnel", "+ hard hitting"]
      : ["+ heavy 808s", "+ dark melody", "+ trap", "+ drill", "+ emotional", "+ hard hitting"];
  }, [locale, mode]);

  const ideaPrompts = useMemo(() => {
    if (locale === "fr") {
      return [
        { text: "Hyperpop sur mon addiction au café" },
        { text: "Une love song dédiée à ma friteuse à air" },
        { text: "Ballade acoustique triste sur mes plantes qui meurent" },
        { text: "Hymne gym bro triomphal pour le leg day" },
        { text: "Chanson de rupture mais les deux sont soulagés" },
        { text: "Lo‑fi beats pour faire semblant de bosser à la maison" },
        { text: "Country song sur le Wi‑Fi qui lâche en plein meeting" },
        { text: "Death metal lullaby pour mon chat qui me réveille à 3h" },
      ];
    }
    return [
      { text: "Hyperpop anthem about my crippling coffee addiction" },
      { text: "A love song dedicated to my air fryer" },
      { text: "Sad acoustic ballad about my dying houseplants" },
      { text: "Triumphant gym bro anthem for leg day" },
      { text: "A breakup song but both people are relieved" },
      { text: "Lo‑fi beats for pretending to work from home" },
      { text: "Country song about my Wi‑Fi going out mid‑meeting" },
      { text: "Death metal lullaby for my cat who woke me up at 3am" },
    ];
  }, [locale]);

  const applyIdea = (text: string) => {
    setMode("song");
    setPrompt(text);
    scrollTo("create");
    window.setTimeout(() => inputRef.current?.focus(), 120);
  };

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
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

  const handleChipClick = (chip: string) => {
    const cleaned = chip.replace(/^\+\s*/, "");
    setPrompt((prev) => (prev ? `${prev}, ${cleaned}` : cleaned));
    inputRef.current?.focus();
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

  const generatorSeed = `${mode}:${prompt}:${beatMood}:${beatBpm}:${beatGenres.join("|")}`;
  const heroCoverSeed = hashString(generatorSeed) % 5;
  const heroCoverGradient = [
    "from-[#7c3aed]/40 via-[#0ea5e9]/20 to-transparent",
    "from-[#0ea5e9]/30 via-[#7c3aed]/20 to-transparent",
    "from-[#db2777]/25 via-[#7c3aed]/20 to-transparent",
    "from-[#22c55e]/20 via-[#7c3aed]/20 to-transparent",
    "from-[#f97316]/20 via-[#0ea5e9]/20 to-transparent",
  ][heroCoverSeed];

  const previewTags = mode === "beat" ? ["Type Beat", beatGenres[0] ?? "Trap", beatMood, `${beatBpm} BPM`] : ["Song", "Vocals", "Hook", "Release-ready"];

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
  };

  const [trending, setTrending] = useState<PublicTrack[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [trendingTimedOut, setTrendingTimedOut] = useState(false);
  const [trendingError, setTrendingError] = useState<string | null>(null);
  const [trendingRefreshKey, setTrendingRefreshKey] = useState(0);
  const [repairingPublicLinks, setRepairingPublicLinks] = useState(false);
  const [repairFixedCount, setRepairFixedCount] = useState<number | null>(null);

  const placeholderTrending = useMemo<PublicTrack[]>(
    () => [
      { id: "ph-1", name: "Late Night R&B", genre: "R&B", mood: "Melancholic", bpm: null, audioUrl: null, createdAt: null, kind: "song", badge: "Song", tags: ["R&B", "Vocals"], duration: "3:24", color: "from-violet-900 to-blue-900", prompt: "A melancholic R&B song about late nights in the city, smooth vocals, warm chords, clean drums, radio-ready hook" },
      { id: "ph-2", name: "Dark Trap Anthem", genre: "Trap", mood: "Dark", bpm: null, audioUrl: null, createdAt: null, kind: "song", badge: "Song", tags: ["Trap", "Vocals"], duration: "2:58", color: "from-purple-900 to-pink-900", prompt: "A dark trap anthem with gritty vocals, huge hook, sliding 808s, tight hats, modern mix, festival energy" },
      { id: "ph-3", name: "Afrobeats Summer", genre: "Afrobeats", mood: "Bright", bpm: null, audioUrl: null, createdAt: null, kind: "song", badge: "Song", tags: ["Afrobeats", "Vocals"], duration: "3:41", color: "from-green-900 to-teal-900", prompt: "An Afrobeats summer song with bright guitars, catchy chorus, warm bass, clean percussion groove, release-ready mix" },
      { id: "ph-4", name: "Metro Boomin Type Beat", genre: "Trap", mood: "Dark", bpm: null, audioUrl: null, createdAt: null, kind: "beat", badge: "Type Beat", tags: ["Trap", "Dark"], duration: "2:30", color: "from-rose-900 to-orange-900", prompt: "Metro Boomin type beat, dark bounce, clean 808s, punchy drums, minimal melody, industry-ready mix" },
      { id: "ph-5", name: "Drill Pocket", genre: "Drill", mood: "Hard", bpm: 140, audioUrl: null, createdAt: null, kind: "beat", badge: "Type Beat", tags: ["Drill", "Hard", "140 BPM"], duration: "2:15", color: "from-blue-900 to-cyan-900", prompt: "Drill type beat, aggressive pocket, sliding bass, tight hats, dark melody, clean mix, hard bounce" },
      { id: "ph-6", name: "Trapsoul Loop", genre: "R&B", mood: "Moody", bpm: 90, audioUrl: null, createdAt: null, kind: "beat", badge: "Type Beat", tags: ["R&B", "Moody", "90 BPM"], duration: "2:45", color: "from-yellow-900 to-red-900", prompt: "Trapsoul loop, warm chords, moody drums, subtle bass, spacey texture, clean mix, hook-ready bounce" },
    ],
    [],
  );

  const getTrackGradient = (id: string) => {
    const gradients = ["from-violet-900 to-blue-900", "from-purple-900 to-pink-900", "from-blue-900 to-cyan-900", "from-rose-900 to-orange-900", "from-green-900 to-teal-900", "from-yellow-900 to-red-900"];
    const index = id.charCodeAt(0) % gradients.length;
    return gradients[index] ?? gradients[0];
  };

  const isNew = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    return diff < 24 * 60 * 60 * 1000;
  };

  const classifyTrack = (genre: string, mood: string, name: string) => {
    const hay = `${genre} ${mood} ${name}`.toLowerCase();
    const looksLikeSong = ["song", "vocals", "vocal", "afro", "afrobeats", "pop"].some((k) => hay.includes(k));
    if (looksLikeSong) return { kind: "song" as const, badge: "Song" as const };
    const looksLikeBeat = ["type beat", "beat", "trap", "drill", "trapsoul", "rnb"].some((k) => hay.includes(k));
    return looksLikeBeat ? { kind: "beat" as const, badge: "Type Beat" as const } : { kind: "song" as const, badge: "Song" as const };
  };

  const heroCovers = useMemo(() => {
    const base = trending.length ? trending : placeholderTrending;
    return base.slice(0, 9);
  }, [placeholderTrending, trending]);

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
      const taskId = extractAceTaskId(track.stemsUrl);

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

      const firstUrl = typeof track.audioUrl === "string" ? track.audioUrl.trim() : "";
      if (firstUrl) {
        setCurrent(buildLoop(firstUrl), true);
        return;
      }

      if (taskId) {
        let resolved = "";
        try {
          resolved = await resolveAceAudioUrl(taskId);
        } catch (e) {
          void e;
        }
        if (resolved) {
          setTrending((prev) => prev.map((t) => (t.id === track.id ? { ...t, audioUrl: resolved } : t)));
          setCurrent(buildLoop(resolved), true);
          return;
        }
      }

      toast.error(locale === "fr" ? "Audio indisponible" : "Audio unavailable");
    })();
  };

  const playlistItems = useMemo(() => {
    return trending.filter((t) => isPlayablePublicLoop(t.audioUrl, t.stemsUrl)).slice(0, 6);
  }, [trending]);

  const homeTrendingCards = useMemo(() => {
    return trending.slice(0, 3);
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
        window.sessionStorage.removeItem("producerhit_landing_trending_cache_v1");
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

  useEffect(() => {
    let cancelled = false;
    const cacheKey = "producerhit_landing_trending_cache_v1";
    let loadedFromCache = false;
    try {
      const raw = window.sessionStorage.getItem(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { ts?: unknown; items?: unknown };
        const ts = typeof parsed?.ts === "number" ? parsed.ts : 0;
        const items = Array.isArray(parsed?.items) ? (parsed.items as unknown[]) : [];
        if (Date.now() - ts < 10 * 60 * 1000 && items.length) {
          setTrending(items as PublicTrack[]);
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
        const rows = await fetchPublicLoops({ limit: 24 });
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
            };
          });

        const playable = mapped.filter((t) => isPlayablePublicLoop(t.audioUrl, t.stemsUrl));
        const next = mapped.length ? mapped.slice(0, 6) : playable.slice(0, 6);
        setTrending(next);
        try {
          window.sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), items: next }));
        } catch {
          void 0;
        }
        setTrendingLoading(false);
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
  }, [placeholderTrending, trendingRefreshKey, locale]);

  const pricing = useMemo(() => {
    if (locale === "fr") {
      return [
        {
          name: "Free",
          price: "0€",
          meta: `${PLAN_LIMITS.free} générations / mois`,
          bullets: [`✓ ${PLAN_LIMITS.free} tracks/mois`, "✓ Download MP3", "✓ Song Mode + Type Beat Mode", "✗ Export WAV"],
          featured: false,
        },
        {
          name: "Pro",
          price: "10€/mo",
          meta: "75 générations / mois",
          bullets: ["✓ 75 tracks/mois", "✓ Export WAV", "✓ Priorité génération", "✓ Usage commercial"],
          featured: true,
        },
        {
          name: "Studio",
          price: "30€/mo",
          meta: "250 générations / mois",
          bullets: ["✓ 250 tracks/mois", "✓ Tout Pro inclus", "✓ Export WAV", "✓ Licence label"],
          featured: false,
        },
      ];
    }
    return [
      {
        name: "Free",
        price: "$0",
        meta: `${PLAN_LIMITS.free} generations / month`,
        bullets: [`✓ ${PLAN_LIMITS.free} tracks/month`, "✓ MP3 download", "✓ Song Mode + Type Beat Mode", "✗ WAV export"],
        featured: false,
      },
      {
        name: "Pro",
        price: "$10/mo",
        meta: "75 generations / month",
        bullets: ["✓ 75 tracks/month", "✓ WAV export", "✓ Priority generation", "✓ Commercial use"],
        featured: true,
      },
      {
        name: "Studio",
        price: "$30/mo",
        meta: "250 generations / month",
        bullets: ["✓ 250 tracks/month", "✓ Everything in Pro", "✓ WAV export", "✓ Label license"],
        featured: false,
      },
    ];
  }, [locale]);

  const faqs = useMemo(() => {
    if (locale === "fr") {
      return [
        {
          q: "Usage commercial & propriété ?",
          a: "Tu peux télécharger tes générations. Pour une release commerciale, respecte toujours les conditions des modèles/providers et les règles des plateformes.",
        },
        { q: "Tu génères des chansons complètes avec voix ?", a: "Oui — Song Mode vise des tracks complètes avec vocals, structure, hooks et couplets." },
        { q: "C’est quoi Type Beat Mode ?", a: "Des contrôles orientés producteurs (BPM, mood, tags) pour verrouiller un bounce propre et itérer vite." },
        { q: "C’est rapide ?", a: "La plupart des tracks sortent en ~20 secondes selon la charge et le modèle." },
        { q: "Je peux télécharger en WAV ?", a: "Oui — l’export WAV est disponible sur Pro/Studio." },
      ];
    }
    return [
      { q: "Commercial use & ownership?", a: "You can download your generations. For commercial releases, always follow the model/provider terms and platform rules." },
      { q: "Do you generate full songs with vocals?", a: "Yes — Song Mode targets complete tracks with vocals, structure, hooks, and verses." },
      { q: "What’s Type Beat Mode?", a: "Producer-first controls (BPM, mood, tags) to quickly lock a clean bounce and iterate." },
      { q: "How fast is it?", a: "Most tracks generate in ~20 seconds depending on load and model." },
      { q: "Can I download WAV?", a: "Yes — WAV export is available on Pro/Studio." },
    ];
  }, [locale]);

  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  return (
    <div ref={pageRef} className="min-h-screen pk-prism-stage text-white">

      <header
        className={[
          "sticky top-0 z-20 transition-all",
          navScrolled ? "pk-prism-nav border-b border-white/10" : "bg-transparent",
        ].join(" ")}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <BrandLogo />

          <nav className="hidden items-center gap-3 sm:flex">
            <Link to="/pricing" className="text-sm font-semibold text-white/70 transition-colors hover:text-white">
              {locale === "fr" ? "Tarifs" : "Pricing"}
            </Link>
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex h-10 items-center justify-center rounded-full pk-prism-btn px-6 text-sm font-semibold text-black transition-all hover:brightness-110"
              >
                {locale === "fr" ? "Dashboard" : "Dashboard"}
              </Link>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="inline-flex h-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-5 text-sm font-semibold text-white transition-all hover:border-white/20 hover:bg-white/[0.06]"
                >
                  {locale === "fr" ? "Connexion" : "Login"}
                </Link>
                <Link
                  to="/auth"
                  className="inline-flex h-10 items-center justify-center rounded-full pk-prism-btn px-6 text-sm font-semibold text-black transition-all hover:brightness-110"
                >
                  {locale === "fr" ? "Essayer gratuit" : "Start Free"}
                </Link>
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
            className="inline-flex h-10 items-center justify-center rounded-full border border-[#2d2d3d] px-4 text-sm font-semibold text-white sm:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
          >
            {mobileOpen ? "Close" : "Menu"}
          </button>
        </div>

        {mobileOpen ? (
          <div className="border-t border-[#2d2d3d] bg-[rgba(10,10,15,0.92)] backdrop-blur-[12px] sm:hidden">
            <div className="mx-auto grid max-w-6xl gap-2 px-4 py-4">
              <Link to="/pricing" className="rounded-2xl border border-[#2d2d3d] bg-transparent px-4 py-3 text-sm font-semibold text-white" onClick={() => setMobileOpen(false)}>
                {locale === "fr" ? "Tarifs" : "Pricing"}
              </Link>
              {user ? (
                <Link to="/dashboard" className="rounded-2xl bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] px-4 py-3 text-sm font-semibold text-white" onClick={() => setMobileOpen(false)}>
                  {locale === "fr" ? "Dashboard" : "Dashboard"}
                </Link>
              ) : (
                <>
                  <Link to="/auth" className="rounded-2xl border border-[#2d2d3d] bg-transparent px-4 py-3 text-sm font-semibold text-white" onClick={() => setMobileOpen(false)}>
                    {locale === "fr" ? "Connexion" : "Login"}
                  </Link>
                  <Link to="/auth" className="rounded-2xl bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] px-4 py-3 text-sm font-semibold text-white" onClick={() => setMobileOpen(false)}>
                    {locale === "fr" ? "Essayer gratuit" : "Start Free"}
                  </Link>
                </>
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLocale("en");
                    setMobileOpen(false);
                  }}
                  className={`flex-1 rounded-2xl border border-[#2d2d3d] px-4 py-3 text-sm font-semibold ${locale === "en" ? "bg-[#7c3aed] text-white" : "bg-transparent text-white"}`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLocale("fr");
                    setMobileOpen(false);
                  }}
                  className={`flex-1 rounded-2xl border border-[#2d2d3d] px-4 py-3 text-sm font-semibold ${locale === "fr" ? "bg-[#7c3aed] text-white" : "bg-transparent text-white"}`}
                >
                  Français
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      <main ref={heroRef} className="relative z-10">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <LandingPrismScene spot={spot} reduceMotion={reduceMotion} />
        </div>
        <RevealSection className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-24">
          <section className="w-full pk-heroScroll" aria-label="Hero">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center justify-center rounded-full y2k-chip pk-prism-chip px-4 py-1.5 text-sm font-semibold text-white/85">
                  <span className="pk-prism-holo-text">{heroBadge}</span>
                </div>
                <h1 className="mt-7 text-balance text-[clamp(2.75rem,9vw,5.4rem)] font-extrabold leading-[0.95] tracking-tight text-white">
                  {locale === "fr" ? (
                    <>
                      <div>Crée des hits</div>
                      <div className="pk-prism-holo-text">release‑ready.</div>
                    </>
                  ) : (
                    <>
                      <div>Create hits</div>
                      <div className="pk-prism-holo-text">that ship.</div>
                    </>
                  )}
                </h1>
                <div className="mt-6 max-w-xl text-balance text-[clamp(1rem,2vw,1.125rem)] text-white/70">
                  {locale === "fr"
                    ? "De la drill au K‑Pop : génère des chansons et type beats avec une identité visuelle métallique — écoute, remixe, exporte."
                    : "From drill to K‑Pop: generate songs and type beats with a metallic visual identity — listen, remix, export."}
                </div>
                <div className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  {locale === "fr"
                    ? "Holographic metal · covers IA · engine 2026"
                    : "Holographic metal · AI covers · 2026 engine"}
                </div>

                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  <div className="y2k-chip pk-prism-chip flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white/90">
                    <ShieldCheck className="h-4 w-4 text-[var(--prism-cyan)]" />
                    {locale === "fr" ? "Libre de droits" : "Royalty-free"}
                  </div>
                  <div className="y2k-chip pk-prism-chip flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white/90">
                    <BadgeCheck className="h-4 w-4 text-[var(--prism-violet)]" />
                    {locale === "fr" ? "Release-ready" : "Release-ready"}
                  </div>
                  <div className="y2k-chip pk-prism-chip flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white/90">
                    <Sparkles className="h-4 w-4 text-[var(--prism-cyan)]" />
                    {locale === "fr" ? "Original" : "Original"}
                  </div>
                </div>

                <div className="mt-8 grid gap-2 text-left sm:grid-cols-2">
                  {ideaPrompts.slice(0, 6).map((x) => (
                    <button
                      key={x.text}
                      type="button"
                      onClick={() => applyIdea(x.text)}
                      className="y2k-chip pk-prism-chip group inline-flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-white/80 transition-all hover:brightness-110"
                      aria-label={locale === "fr" ? "Utiliser cette idée de prompt" : "Use this prompt idea"}
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[linear-gradient(135deg,var(--prism-chrome),var(--prism-cyan))]" aria-hidden />
                      <span className="min-w-0 truncate">{x.text}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
                  <Link
                    to={user ? "/dashboard" : "/auth"}
                    {...attachMagnetic(6)}
                    className="inline-flex h-[54px] w-full items-center justify-center rounded-full pk-prism-btn px-8 text-base font-semibold text-black transition-[transform,filter] duration-200 ease-out will-change-transform hover:brightness-110 sm:w-auto"
                  >
                    {user ? (locale === "fr" ? "Aller au Dashboard →" : "Go to Dashboard →") : locale === "fr" ? "Commencer gratuitement" : "Start creating free"}
                  </Link>
                  <button
                    type="button"
                    onClick={() => scrollTo("trending")}
                    {...attachMagnetic(4)}
                    className="y2k-chip pk-prism-chip inline-flex h-[54px] w-full items-center justify-center rounded-full px-8 text-base font-semibold text-white transition-[transform,filter] duration-200 ease-out will-change-transform hover:brightness-110 sm:w-auto"
                  >
                    {locale === "fr" ? "Écouter ↓" : "Listen ↓"}
                  </button>
                </div>
              </div>

              <div
                className="mx-auto w-full max-w-xl"
                style={
                  reduceMotion
                    ? undefined
                    : { transform: `translate3d(${parallax.x * 0.35}px, ${parallax.y * 0.35}px, 0)` }
                }
              >
                <div className="pk-prism-player-card overflow-hidden">
                  <div className="pk-prism-player-header">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="pk-prism-aside-icon h-9 w-9 shrink-0 rounded-xl">
                        <Music2 className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-[11px] font-extrabold tracking-[0.22em] text-white/90">STUDIO PREVIEW</div>
                        <div className="truncate text-[11px] font-medium text-white/45">{locale === "fr" ? "Écoute live · communauté" : "Live listen · community"}</div>
                      </div>
                    </div>
                    <div className="pk-prism-live-pill">
                      <span className="pk-prism-live-dot" style={{ opacity: isPlaying ? 1 : 0.35 }} />
                      <span className="text-[11px] font-semibold text-white/75">{isPlaying ? "LIVE" : "READY"}</span>
                    </div>
                  </div>
                  <div className="p-4 sm:p-5">
                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                      <div className="flex items-center gap-3">
                        {current ? (
                          <div
                            className="pk-prism-cover relative h-14 w-14 shrink-0 overflow-hidden rounded-xl"
                            style={{ background: coverGradient(current) }}
                          >
                            <img
                              src={coverImageUrl(current)}
                              alt=""
                              className="absolute inset-0 h-full w-full object-cover"
                              loading="lazy"
                              decoding="async"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ) : (
                          <div className="pk-prism-aside-icon flex h-14 w-14 shrink-0 items-center justify-center rounded-xl">
                            <Music2 className="h-6 w-6" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-semibold tracking-[0.2em] text-white/45">NOW PLAYING</div>
                          <div className="mt-1 truncate text-sm font-semibold text-white">
                            {current?.name ?? (locale === "fr" ? "Clique Play sur un track" : "Click Play on a track")}
                          </div>
                          <div className="mt-1 text-[11px] font-medium text-white/45">
                            {formatTime(currentTimeSec)} / {formatTime(durationSec)}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <WaveformVisualizer isPlaying={isPlaying} barCount={48} variant="prism" />
                      </div>
                      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div className="h-full bg-[linear-gradient(90deg,var(--prism-chrome),var(--prism-cyan),var(--prism-violet))]" style={{ width: `${Math.round(Math.max(0, Math.min(1, progress)) * 100)}%` }} />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const idx = queueIndex - 1;
                          const prevLoop = idx >= 0 ? queue[idx] : null;
                          if (!prevLoop?.audioUrl?.trim()) return;
                          setQueue(queue, idx, true, queueSource ?? "landing_deck");
                        }}
                        disabled={queueIndex <= 0}
                        className="pk-prism-player-btn inline-flex h-11 w-11 items-center justify-center rounded-2xl disabled:opacity-50"
                        aria-label={locale === "fr" ? "Précédent" : "Previous"}
                      >
                        <SkipBack className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const firstPlayable = playlistItems.find((t) => isPlayablePublicLoop(t.audioUrl, t.stemsUrl)) ?? null;
                          if (!current?.audioUrl?.trim() && firstPlayable) {
                            handlePlay(firstPlayable);
                            return;
                          }
                          setPlaying(!isPlaying);
                        }}
                        className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl pk-prism-btn px-4 text-sm font-extrabold tracking-[0.12em] text-black transition-all hover:brightness-110"
                        aria-label={isPlaying ? (locale === "fr" ? "Pause" : "Pause") : locale === "fr" ? "Play" : "Play"}
                      >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        {isPlaying ? (locale === "fr" ? "PAUSE" : "PAUSE") : "PLAY"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const idx = queueIndex + 1;
                          const nextLoop = idx < queue.length ? queue[idx] : null;
                          if (!nextLoop?.audioUrl?.trim()) return;
                          setQueue(queue, idx, true, queueSource ?? "landing_deck");
                        }}
                        disabled={queueIndex >= queue.length - 1}
                        className="pk-prism-player-btn inline-flex h-11 w-11 items-center justify-center rounded-2xl disabled:opacity-50"
                        aria-label={locale === "fr" ? "Suivant" : "Next"}
                      >
                        <SkipForward className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pk-prism-player-card overflow-hidden">
                  <div className="pk-prism-player-header">
                    <div className="min-w-0">
                      <div className="truncate text-[11px] font-extrabold tracking-[0.22em] text-white/90">{locale === "fr" ? "PLAYLIST" : "PLAYLIST"}</div>
                      <div className="truncate text-[11px] font-medium text-white/45">{locale === "fr" ? "Picks du moment" : "Current picks"}</div>
                    </div>
                    <div className="text-[11px] font-semibold text-white/45">{(trending.length ? trending : placeholderTrending).length} tracks</div>
                  </div>
                  <div className="p-3">
                    <div className="grid gap-2">
                      {playlistItems.map((t, idx) => {
                        const loopForCover: Loop = {
                          id: t.id,
                          name: t.name,
                          genre: t.genre ?? "",
                          influence: "No Influence",
                          key: "",
                          scale: "",
                          bpm: typeof t.bpm === "number" ? t.bpm : 0,
                          loopLength: "8 bars",
                          swing: 0,
                          mood: t.mood ?? "",
                          energyLevel: "",
                          reverb: "",
                          prompt: t.prompt,
                          audioUrl: t.audioUrl,
                          seed: typeof t.seed === "number" ? t.seed : null,
                          details: null,
                          stemsUrl: null,
                          isSaved: false,
                          isPublic: true,
                          createdAt: t.createdAt ?? new Date().toISOString(),
                        };
                        const bg = coverGradient(loopForCover);
                        const url = coverImageUrl(loopForCover);
                        const playable = isPlayablePublicLoop(t.audioUrl, t.stemsUrl);
                        return (
                          <div key={`${t.id}-${idx}`} className="y2k-chip pk-prism-chip flex items-center gap-3 rounded-2xl px-3 py-2">
                            <button
                              type="button"
                              onClick={() => handlePlay(t)}
                              className="group flex min-w-0 flex-1 items-center gap-3 text-left transition-all hover:brightness-110"
                              aria-label={locale === "fr" ? "Écouter l’aperçu" : "Play preview"}
                            >
                              <div className="relative h-11 w-11 overflow-hidden rounded-xl border border-white/10" style={{ background: bg }}>
                                <img
                                  src={url}
                                  alt=""
                                  loading="lazy"
                                  decoding="async"
                                  referrerPolicy="no-referrer"
                                  className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300"
                                  onLoad={(e) => {
                                    e.currentTarget.style.opacity = "1";
                                  }}
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-semibold text-white">{t.name}</div>
                                <div className="mt-0.5 truncate text-[11px] font-semibold text-white/55">
                                  {[t.genre ?? "", t.mood ?? "", t.bpm ? `${t.bpm} BPM` : ""].filter(Boolean).join(" · ")}
                                </div>
                              </div>
                              <div className="shrink-0 text-[11px] font-extrabold tracking-[0.12em] text-white/70">{playable ? "PLAY" : "—"}</div>
                            </button>

                            <button
                              type="button"
                              onClick={() => applyTrackPrompt(t.prompt, t.kind)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-white/80 transition-all hover:brightness-110"
                              aria-label={locale === "fr" ? "Remixer" : "Remix"}
                            >
                              <Sparkles className="h-4 w-4 text-[#a78bfa]" />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-3 grid grid-cols-6 gap-2">
                      {heroCovers.map((t) => {
                        const loopForCover: Loop = {
                          id: t.id,
                          name: t.name,
                          genre: t.genre ?? "",
                          influence: "No Influence",
                          key: "",
                          scale: "",
                          bpm: typeof t.bpm === "number" ? t.bpm : 0,
                          loopLength: "8 bars",
                          swing: 0,
                          mood: t.mood ?? "",
                          energyLevel: "",
                          reverb: "",
                          prompt: t.prompt,
                          audioUrl: t.audioUrl,
                          seed: typeof t.seed === "number" ? t.seed : null,
                          details: null,
                          stemsUrl: null,
                          isSaved: false,
                          isPublic: true,
                          createdAt: t.createdAt ?? new Date().toISOString(),
                        };
                        const bg = coverGradient(loopForCover);
                        const url = coverImageUrl(loopForCover);
                        return (
                          <div key={t.id} className="relative aspect-square overflow-hidden rounded-xl border border-white/10" style={{ background: bg }}>
                            <img
                              src={url}
                              alt=""
                              loading="lazy"
                              decoding="async"
                              referrerPolicy="no-referrer"
                              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300"
                              onLoad={(e) => {
                                e.currentTarget.style.opacity = "1";
                              }}
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div id="create" className="relative mx-auto mt-12 w-full max-w-4xl">
            <div className="pointer-events-none absolute inset-0 -z-10">
              <div className="absolute left-1/2 top-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(157,124,255,0.12)_0%,transparent_68%)] blur-3xl" />
            </div>
            <div className="y2k-window pk-prism-glass p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="y2k-chip pk-prism-chip inline-flex rounded-full p-1">
                  <button
                    type="button"
                    onClick={() => setMode("song")}
                    className={[
                      "h-9 rounded-full px-4 text-sm font-semibold transition-all",
                      mode === "song"
                        ? "pk-prism-pill-active"
                        : "text-white/60 hover:text-white",
                    ].join(" ")}
                  >
                    {locale === "fr" ? "Song Mode" : "Song Mode"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("beat")}
                    className={[
                      "h-9 rounded-full px-4 text-sm font-semibold transition-all",
                      mode === "beat"
                        ? "pk-prism-pill-active"
                        : "text-white/60 hover:text-white",
                    ].join(" ")}
                  >
                    {locale === "fr" ? "Type Beat Mode" : "Type Beat Mode"}
                  </button>
                </div>

                <div className="hidden items-center gap-2 text-xs font-semibold text-white/70 sm:flex">
                  <span className="y2k-chip pk-prism-chip rounded-full px-3 py-1">
                    {locale === "fr" ? "Entrée pour générer" : "Press Enter to generate"}
                  </span>
                  <span className="y2k-chip pk-prism-chip rounded-full px-3 py-1">
                    {locale === "fr" ? "1 génération gratuite" : "Try 1 free generation"}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-5">
                <div
                  className={[
                    "y2k-chip pk-prism-chip rounded-2xl p-4 transition-all lg:col-span-3",
                    focused ? "shadow-[0_0_0_3px_rgba(103,195,255,0.16)]" : "shadow-none",
                  ].join(" ")}
                >
                  <div className="relative">
                    <textarea
                      ref={inputRef}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onFocus={() => setFocused(true)}
                      onBlur={() => setFocused(false)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void onGenerate();
                        }
                      }}
                      placeholder={placeholders[placeholderIndex]}
                      rows={2}
                      className="w-full resize-none bg-transparent px-3 py-2 text-center text-lg font-semibold leading-snug text-white outline-none placeholder:text-[#6b7280] sm:text-xl"
                    />
                    <div className="pointer-events-none absolute right-4 top-1/2 hidden h-6 w-[2px] -translate-y-1/2 animate-pulse bg-[#7c3aed] sm:block" />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    {smartChips.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleChipClick(c)}
                        className="y2k-chip pk-prism-chip rounded-full px-3 py-1 text-xs font-semibold text-white/70 transition-all hover:brightness-110"
                      >
                        {c}
                      </button>
                    ))}
                  </div>

                  {mode === "beat" ? (
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="y2k-chip pk-prism-chip rounded-2xl p-4">
                        <div className="text-xs font-semibold text-white/70">{locale === "fr" ? "Style artiste (optionnel)" : "Artist style (optional)"}</div>
                        <input
                          value={beatArtist}
                          onChange={(e) => setBeatArtist(e.target.value)}
                          placeholder={locale === "fr" ? "ex: Drake, Travis Scott…" : "e.g. Drake, Travis Scott..."}
                          className="y2k-chip pk-prism-chip mt-2 h-10 w-full rounded-xl px-3 text-sm font-semibold text-white outline-none placeholder:text-white/45 focus:shadow-[0_0_0_3px_rgba(157,124,255,0.14)]"
                        />
                      </div>
                      <div className="y2k-chip pk-prism-chip rounded-2xl p-4">
                        <div className="flex items-center justify-between text-xs font-semibold text-white/70">
                          <span>BPM</span>
                          <span className="text-white/80">{beatBpm}</span>
                        </div>
                        <input
                          type="range"
                          min={80}
                          max={170}
                          value={beatBpm}
                          onChange={(e) => setBeatBpm(Number(e.target.value))}
                          className="mt-3 w-full accent-[var(--prism-cyan)]"
                        />
                      </div>
                      <div className="y2k-chip pk-prism-chip rounded-2xl p-4 md:col-span-2">
                        <div className="text-xs font-semibold text-white/70">{locale === "fr" ? "Mood" : "Mood"}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {["Trap", "Drill", "Afro", "RnB", "Jersey", "UK Garage"].map((g) => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => toggleGenre(g)}
                              className={[
                                "y2k-chip pk-prism-chip rounded-full px-3 py-1 text-xs font-semibold transition-all",
                                beatGenres.includes(g)
                                  ? "pk-prism-pill-active"
                                  : "text-white/70 hover:brightness-110",
                              ].join(" ")}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {["Chill", "Hype", "Dark", "Romantic"].map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setBeatMood(m)}
                              className={[
                                "y2k-chip pk-prism-chip rounded-full px-3 py-1 text-xs font-semibold transition-all",
                                beatMood === m
                                  ? "pk-prism-pill-active"
                                  : "text-white/70 hover:brightness-110",
                              ].join(" ")}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => void onGenerate()}
                      disabled={generating}
                      aria-label={locale === "fr" ? "Générer ton premier beat gratuitement" : "Generate your first beat free"}
                      className="inline-flex h-[54px] w-full items-center justify-center rounded-full pk-prism-btn px-8 text-base font-semibold text-black transition-all hover:brightness-110 disabled:opacity-70 sm:w-auto"
                    >
                      <span className="inline-flex items-center gap-2">
                        {generating ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : null}
                        {generating ? (locale === "fr" ? "Génération…" : "Generating…") : locale === "fr" ? "Générer" : "Generate"}
                      </span>
                    </button>
                    <div className="text-sm font-semibold text-white/65">
                      {locale === "fr" ? "Aucune compétence requise. Décris juste ton idée." : "No skills needed. Just describe your idea."}
                    </div>
                  </div>
                </div>

                <div className="y2k-window pk-prism-glass p-4 lg:col-span-2">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-sm font-semibold text-white">{locale === "fr" ? "Aperçu" : "Output preview"}</div>
                    <div className="inline-flex items-center gap-2 text-xs font-semibold text-white/70">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--prism-cyan)]" />
                      {locale === "fr" ? "Prêt industrie" : "Industry-ready"}
                    </div>
                  </div>
                  <div className={`mt-4 h-40 rounded-2xl border border-white/10 bg-gradient-to-tr ${heroCoverGradient}`} />
                  <div className="mt-4 flex flex-wrap gap-2">
                    {previewTags.map((x) => (
                      <span key={x} className="y2k-chip pk-prism-chip rounded-full px-3 py-1 text-[11px] font-semibold text-white/70">
                        {x}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 text-sm font-semibold text-white/65">
                    {locale === "fr" ? "Mix clean. Bounce solide. Prêt pour ton DAW ou l’upload." : "Clean mix. Strong bounce. Ready for your DAW or upload."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </RevealSection>

        <RevealSection id="features" className="mx-auto max-w-6xl px-4 py-24">
          <div className="text-center">
            <h2 className="text-balance text-[clamp(1.75rem,4vw,2.5rem)] font-bold tracking-tight text-white">
              {locale === "fr" ? "Tout pour créer." : "Everything you need to create."}
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {(locale === "fr"
              ? [
                  { icon: Mic2, t: "Song Mode", d: "Chansons complètes avec voix. Structure, hooks, couplets. Prêt release." },
                  { icon: Keyboard, t: "Type Beat Mode", d: "Type beats niveau pro avec contrôle du vibe et itération rapide." },
                  { icon: Zap, t: "Génère en secondes", d: "Autour de ~20 secondes par track. Garde ce qui hit, regen le reste." },
                  { icon: FolderOpen, t: "Construis ton catalogue", d: "Sauvegarde, télécharge, organise. Exports prêts pour ton DAW." },
                ]
              : [
                  { icon: Mic2, t: "Song Mode", d: "Full songs with vocals. Structure, hooks, verses. Ready to release." },
                  { icon: Keyboard, t: "Type Beat Mode", d: "Producer-grade beats with controls for vibe, bounce, and fast iteration." },
                  { icon: Zap, t: "Generate in seconds", d: "Around ~20 seconds per track. Keep what hits, regenerate the rest." },
                  { icon: FolderOpen, t: "Build your catalog", d: "Save, download, organize. Exports ready for your DAW." },
                ]
            ).map((x) => (
              <div key={x.t} className="pk-prism-card p-6">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                  <x.icon className="h-5 w-5 text-[var(--prism-cyan)]" strokeWidth={1.75} />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">{x.t}</h3>
                <div className="mt-2 text-sm text-white/55">{x.d}</div>
              </div>
            ))}
          </div>
        </RevealSection>

        <RevealSection id="how" className="mx-auto max-w-6xl px-4 py-24">
          {(() => {
            const steps =
              locale === "fr"
                ? [
                    { n: "01", t: "Décris ton son", d: "Prompt + tags. Un seul objectif: trouver le bounce." },
                    { n: "02", t: "Génère & itère", d: "Variations rapides. Garde ce qui hit, regen le reste." },
                    { n: "03", t: "Sauvegarde & exporte", d: "Bibliothèque + MP3/WAV. Prêt DAW & release.", note: "MP3 (Free) · WAV (Pro/Studio)" },
                  ]
                : [
                    { n: "01", t: "Describe your sound", d: "Prompt + tags. One goal: find the bounce." },
                    { n: "02", t: "Generate & iterate", d: "Fast variations. Keep what hits, regen the rest." },
                    { n: "03", t: "Save & export", d: "Library + MP3/WAV. Ready for DAW & release.", note: "MP3 (Free) · WAV (Pro/Studio)" },
                  ];

            return (
              <div className="pk-bentoFrame">
                <div className="grid gap-10 lg:grid-cols-2">
                  <div className="lg:sticky lg:top-28">
                    <h2 className="text-balance text-[clamp(1.75rem,3.2vw,2.25rem)] font-bold tracking-tight text-white">
                      {locale === "fr" ? "3 étapes. Zéro friction." : "Three steps. Zero friction."}
                    </h2>
                    <div className="mt-3 max-w-xl text-balance text-sm text-white/60">
                      {locale === "fr"
                        ? "Une expérience premium et moderne, avec un clin d’œil nostalgique. L’objectif: sortir des hits — vite."
                        : "Premium, modern flow with a nostalgic wink. One goal: ship hits — fast."}
                    </div>

                    <div className="mt-7">
                      <div className="flex gap-2">
                        {steps.map((s, idx) => (
                          <div key={s.n} className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                            <div
                              className={[
                                "h-full w-full bg-[linear-gradient(90deg,var(--prism-chrome),var(--prism-cyan),var(--prism-violet))] transition-opacity duration-300",
                                idx <= howActive ? "opacity-100" : "opacity-0",
                              ].join(" ")}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-white/55">
                        {steps.map((s, idx) => (
                          <div key={`${s.n}-label`} className={idx === howActive ? "text-white" : ""}>
                            {s.n}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-5">
                    {steps.map((x, idx) => (
                      <div
                        key={x.n}
                        ref={(el) => {
                          howCardRefs.current[idx] = el;
                        }}
                        className={["pk-stepCard", idx === howActive ? "pk-stepActive" : ""].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-6">
                          <div className="min-w-0">
                            <div className="text-[11px] font-extrabold tracking-[0.24em] text-white/60">{x.n}</div>
                            <h3 className="mt-2 text-lg font-semibold text-white">{x.t}</h3>
                            <div className="mt-2 text-sm text-white/60">{x.d}</div>
                            {x.note ? <div className="mt-3 text-xs font-semibold text-white/70">{x.note}</div> : null}
                          </div>
                          <div className="hidden shrink-0 sm:block">
                            <div className="h-10 w-10 rounded-2xl bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.22),rgba(255,255,255,0)_70%)]" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </RevealSection>

        <RevealSection id="trending" className="mx-auto max-w-6xl px-4 py-24">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-balance text-[clamp(1.75rem,3.2vw,2.25rem)] font-bold tracking-tight text-white">
              <span className="pk-prism-holo-text">
                {locale === "fr" ? "Écoute ce que la communauté génère" : "Hear what the community generates"}
              </span>
            </h2>
          </div>
          <div className="mt-3 max-w-3xl text-balance text-sm text-white/60">
            {locale === "fr"
              ? "Covers métalliques générées par track — même signature visuelle, qualité studio."
              : "Metallic covers per track — same visual signature, studio-grade quality."}
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {trendingLoading ? (
              [0, 1, 2].map((i) => (
                <div key={i} className="pk-prism-card p-4 animate-pulse">
                  <div className="h-40 rounded-2xl bg-white/5" />
                  <div className="mt-4 h-4 w-2/3 rounded bg-white/5" />
                  <div className="mt-3 flex gap-2">
                    <div className="h-6 w-16 rounded-full bg-white/5" />
                    <div className="h-6 w-20 rounded-full bg-white/5" />
                    <div className="h-6 w-14 rounded-full bg-white/5" />
                  </div>
                </div>
              ))
            ) : (
              homeTrendingCards.length ? (
                homeTrendingCards.map((t) => (
                  <div
                    key={t.id}
                    role="button"
                    tabIndex={0}
                    aria-label={locale === "fr" ? "Écouter l’aperçu" : "Play preview"}
                    onClick={() => {
                      handlePlay(t);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handlePlay(t);
                      }
                    }}
                    className="group pk-prism-card cursor-pointer p-4 focus:outline-none focus:ring-2 focus:ring-[#b968ff]/40"
                  >
                    {(() => {
                      const loopForCover: Loop = {
                        id: t.id,
                        name: t.name,
                        genre: t.genre ?? "",
                        influence: "No Influence",
                        key: "",
                        scale: "",
                        bpm: typeof t.bpm === "number" ? t.bpm : 0,
                        loopLength: "8 bars",
                        swing: 0,
                        mood: t.mood ?? "",
                        energyLevel: "",
                        reverb: "",
                        prompt: t.prompt,
                        audioUrl: t.audioUrl,
                        seed: typeof t.seed === "number" ? t.seed : null,
                        details: null,
                        stemsUrl: null,
                        isSaved: false,
                        isPublic: true,
                        createdAt: t.createdAt ?? new Date().toISOString(),
                      };
                      const bg = coverGradient(loopForCover);
                      const url = coverImageUrl(loopForCover);
                      return (
                        <div className="pk-prism-cover relative h-48 overflow-hidden" style={{ background: bg }}>
                          <img
                            src={url}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300"
                            onLoad={(e) => {
                              e.currentTarget.style.opacity = "1";
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.10),rgba(255,255,255,0)_52%)]" />
                          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.55)] via-[rgba(0,0,0,0.10)] to-transparent pointer-events-none" />
                          <div className="absolute left-3 top-3 rounded-full border border-[#2d2d3d] bg-[rgba(10,10,15,0.7)] px-3 py-1 text-[11px] font-semibold text-white">
                            {t.badge}
                          </div>
                          {t.createdAt && isNew(t.createdAt) ? (
                            <div className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-full border border-[#2d2d3d] bg-[rgba(10,10,15,0.7)] px-3 py-1 text-[11px] font-semibold text-white">
                              <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
                              {locale === "fr" ? "Nouveau" : "New"}
                            </div>
                          ) : null}
                        </div>
                      );
                    })()}
                    <div className="mt-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-white">
                          {t.name.length > 30 ? `${t.name.slice(0, 27)}…` : t.name}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {t.tags.map((x) => (
                            <span key={x} className="rounded-full border border-[#2d2d3d] bg-[#0a0a0f] px-3 py-1 text-[11px] font-semibold text-[#6b7280]">
                              {x}
                            </span>
                          ))}
                        </div>
                        {t.duration ? <div className="mt-3 text-xs font-semibold text-white/60">{t.duration}</div> : null}
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlay(t);
                            }}
                            className={[
                              "inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-all",
                              isPlayablePublicLoop(t.audioUrl, t.stemsUrl)
                                ? "pk-prism-btn text-black hover:brightness-110"
                                : "border border-white/10 bg-white/5 text-white/70 hover:border-[#b968ff]/50 hover:text-white",
                            ].join(" ")}
                            aria-label={current?.id === t.id && isPlaying ? (locale === "fr" ? "Pause" : "Pause") : locale === "fr" ? "Écouter" : "Listen"}
                          >
                            {current?.id === t.id && isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            {current?.id === t.id && isPlaying ? (locale === "fr" ? "Pause" : "Pause") : locale === "fr" ? "Écouter" : "Listen"}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              applyTrackPrompt(t.prompt, t.kind);
                            }}
                            className="inline-flex h-10 items-center gap-2 rounded-full border border-[#2d2d3d] bg-[#0a0a0f] px-4 text-sm font-semibold text-white/70 transition-all hover:border-[#7c3aed]/50 hover:text-white"
                            aria-label={locale === "fr" ? "Utiliser ce prompt" : "Use this prompt"}
                          >
                            <Sparkles className="h-4 w-4 text-[#a78bfa]" />
                            {locale === "fr" ? "Remixer" : "Remix"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="md:col-span-3 pk-prism-card p-6">
                  <div className="text-sm font-semibold text-white">
                    {locale === "fr" ? "Aucun aperçu audio disponible pour le moment" : "No audio previews available right now"}
                  </div>
                  <div className="mt-2 text-sm text-white/60">
                    {locale === "fr"
                      ? "Les tracks publiques apparaissent ici. Génère un nouveau track pour alimenter la communauté."
                      : "Public tracks show up here. Generate a new track to feed the community."}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setTrendingRefreshKey((k) => k + 1)}
                      className="inline-flex h-10 items-center justify-center rounded-full border border-[#2d2d3d] bg-transparent px-5 text-sm font-semibold text-white/80 transition-all hover:border-[#7c3aed]/50 hover:text-white"
                    >
                      {locale === "fr" ? "Rafraîchir" : "Refresh"}
                    </button>
                    <Link
                      to="/community"
                      className="inline-flex h-10 items-center justify-center rounded-full bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] px-5 text-sm font-semibold text-white shadow-[0_0_40px_rgba(124,58,237,0.25)] transition-all hover:brightness-110"
                    >
                      {locale === "fr" ? "Voir la communauté" : "Open community"}
                    </Link>
                  </div>
                </div>
              )
            )}
          </div>
          {!trendingLoading && (trendingError || trendingTimedOut || typeof repairFixedCount === "number") ? (
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
          ) : null}
        </RevealSection>

        <RevealSection className="mx-auto max-w-6xl px-4 py-24">
          <div className="text-center">
            <div className="text-balance text-[clamp(1.75rem,4vw,2.5rem)] font-bold tracking-tight">
              <span className="pk-prism-holo-text">{locale === "fr" ? "Tarifs" : "Pricing"}</span>
            </div>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {pricing.map((p) => (
              <div
                key={p.name}
                className={[
                  "pk-prism-card p-6",
                  p.featured ? "border-[#b968ff]/60 shadow-[0_0_70px_rgba(186,104,255,0.18)]" : "",
                ].join(" ")}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-white">{p.name}</div>
                  {p.featured ? (
                    <div className="rounded-full border border-[#7c3aed44] bg-[#7c3aed11] px-2 py-1 text-[11px] font-semibold text-[#a78bfa]">
                      {locale === "fr" ? "Le plus populaire" : "Most popular"}
                    </div>
                  ) : null}
                </div>
                <div className="mt-4 text-3xl font-extrabold tracking-tight text-white">{p.price}</div>
                <div className="mt-2 text-sm font-semibold text-[#6b7280]">{p.meta}</div>
                <div className="mt-5 grid gap-2 text-sm text-white/80">
                  {p.bullets.map((b) => (
                    <div key={b} className="flex items-center gap-2">
                      <span className={b.startsWith("✓") ? "text-[#a78bfa]" : "text-[#6b7280]"}>{b.slice(0, 1)}</span>
                      <span className={b.startsWith("✗") ? "text-[#6b7280]" : ""}>{b.slice(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <Link
                    to="/auth"
                    className={[
                      "inline-flex h-11 w-full items-center justify-center rounded-full text-sm font-semibold transition-all",
                      p.featured ? "bg-[#7c3aed] text-white hover:bg-[#6d28d9]" : "border border-[#2d2d3d] bg-transparent text-white hover:border-[#7c3aed]/60",
                    ].join(" ")}
                  >
                    {locale === "fr" ? "Essayer gratuit" : "Start Free"}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </RevealSection>

        <RevealSection className="mx-auto max-w-6xl px-4 py-24">
          <div className="pk-prism-card relative overflow-hidden p-10">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(157,124,255,0.08)_0%,transparent_72%)]" />
            </div>
            <div className="relative">
              <div className="text-balance text-[clamp(2rem,4.2vw,3rem)] font-extrabold tracking-tight text-white">
                {locale === "fr" ? "Ton son. Tes règles." : "Your sound. Your rules."}
              </div>
              <div className="mt-3 text-balance text-[clamp(1rem,2vw,1.125rem)] font-semibold text-white/55">
                {locale === "fr" ? "Gratuit pour commencer. Pas de carte. Zéro limite d’idées." : "Free to start. No credit card. No limits on ideas."}
              </div>
              <div className="mt-8">
                <Link
                  to="/auth"
                  className="inline-flex h-[54px] items-center justify-center rounded-full pk-prism-btn px-8 text-base font-semibold text-black transition-all hover:brightness-110"
                >
                  {locale === "fr" ? "Fais ton premier track gratuit →" : "Make your first track free →"}
                </Link>
              </div>
            </div>
          </div>
        </RevealSection>

        <RevealSection className="mx-auto max-w-6xl px-4 py-24">
          <div className="pk-prism-card p-8">
            <h2 className="text-balance text-[clamp(1.75rem,3.2vw,2.25rem)] font-bold tracking-tight text-white">FAQ</h2>
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

        <RevealSection className="border-t border-white/10 py-12">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 text-sm text-white/70 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <BrandLogo compact />
              <span>© 2026 ProducerHit</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/pricing" className="hover:text-white">
                {locale === "fr" ? "Tarifs" : "Pricing"}
              </Link>
              <Link to="/ai-beat-generator" className="hover:text-white">
                AI Beat Generator
              </Link>
              <Link to="/ai-music-generator" className="hover:text-white">
                AI Music Generator
              </Link>
              <Link to="/community" className="hover:text-white">
                {locale === "fr" ? "Communauté" : "Community"}
              </Link>
              <Link to="/blog" className="hover:text-white">
                {locale === "fr" ? "Blog" : "Blog"}
              </Link>
              <Link to="/legal#privacy" className="hover:text-white">
                {locale === "fr" ? "Privacy" : "Privacy"}
              </Link>
              <Link to="/legal#cookies" className="hover:text-white">
                {locale === "fr" ? "Cookies" : "Cookies"}
              </Link>
              <Link to="/legal#terms" className="hover:text-white">
                {locale === "fr" ? "Terms" : "Terms"}
              </Link>
              <Link to="/legal#refunds" className="hover:text-white">
                {locale === "fr" ? "Refunds" : "Refunds"}
              </Link>
              <Link to="/legal#contact" className="hover:text-white">
                {locale === "fr" ? "Support" : "Support"}
              </Link>
              <Link to="/type-beat-generator-ai" className="hover:text-white">
                Type Beat AI
              </Link>
              <Link to={user ? "/dashboard" : "/auth"} className="hover:text-white">
                {user ? "Dashboard" : locale === "fr" ? "Connexion" : "Login"}
              </Link>
              <span>Powered by ACE-Step</span>
            </div>
          </div>
        </RevealSection>
      </main>
    </div>
  );
}
