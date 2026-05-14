import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabaseClient";
import { useLocaleStore } from "@/stores/localeStore";
import { Play } from "lucide-react";

type CreateMode = "song" | "beat";

function hashString(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
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
        "transition-all duration-700 ease-out will-change-transform",
        shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </section>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

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

  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const inputRef = useRef<HTMLTextAreaElement | null>(null);

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

  const heroBadge = locale === "fr" ? "✦ Chansons complètes · Type beats · Ready release" : "✦ Full songs · Type beats · Release-ready";

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
      window.localStorage.setItem("producerhit_pending_prompt", promptValue);
      navigate("/auth");
      return;
    }
    navigate(`/dashboard?prompt=${encodeURIComponent(promptValue)}`);
  };

  const handlePlay = (track: { id: string; audioUrl: string | null }) => {
    if (!track.audioUrl) return;
    if (playingId === track.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    if (audioRef.current) audioRef.current.pause();
    const a = new Audio(track.audioUrl);
    audioRef.current = a;
    void a.play();
    a.onended = () => setPlayingId(null);
    setPlayingId(track.id);
  };

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const generatorSeed = `${mode}:${prompt}:${beatMood}:${beatBpm}:${beatGenres.join("|")}`;
  const coverSeed = hashString(generatorSeed) % 5;
  const coverGradient = [
    "from-[#7c3aed]/40 via-[#0ea5e9]/20 to-transparent",
    "from-[#0ea5e9]/30 via-[#7c3aed]/20 to-transparent",
    "from-[#db2777]/25 via-[#7c3aed]/20 to-transparent",
    "from-[#22c55e]/20 via-[#7c3aed]/20 to-transparent",
    "from-[#f97316]/20 via-[#0ea5e9]/20 to-transparent",
  ][coverSeed];

  const previewTags = mode === "beat" ? ["Type Beat", beatGenres[0] ?? "Trap", beatMood, `${beatBpm} BPM`] : ["Song", "Vocals", "Hook", "Release-ready"];

  type PublicTrack = {
    id: string;
    name: string;
    genre: string | null;
    mood: string | null;
    bpm: number | null;
    audioUrl: string | null;
    createdAt: string | null;
    kind: CreateMode;
    badge: "Song" | "Type Beat";
    tags: string[];
    duration?: string;
    color: string;
    prompt: string;
  };

  const [trending, setTrending] = useState<PublicTrack[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [durations, setDurations] = useState<Record<string, string>>({});

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

  async function fetchPublicTracks() {
    const { data: savedTracks } = await supabase
      .from("loops")
      .select("id, name, genre, mood, bpm, audio_url, created_at, is_saved")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(6);
    const saved = (savedTracks ?? []) as Array<{
      id: string;
      name: string | null;
      genre: string | null;
      mood: string | null;
      bpm: number | null;
      audio_url: string | null;
      created_at: string | null;
      is_saved: boolean | null;
    }>;

    if (saved.length >= 3) return saved;

    const { data: recentTracks } = await supabase
      .from("loops")
      .select("id, name, genre, mood, bpm, audio_url, created_at, is_saved")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(6);
    return (recentTracks ?? []) as Array<{
      id: string;
      name: string | null;
      genre: string | null;
      mood: string | null;
      bpm: number | null;
      audio_url: string | null;
      created_at: string | null;
      is_saved: boolean | null;
    }>;
  }

  useEffect(() => {
    let cancelled = false;
    setTrendingLoading(true);
    void (async () => {
      try {
        const rows = await fetchPublicTracks();
        if (cancelled) return;

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
            const prompt = [name, genre, mood, bpm ? `${bpm} BPM` : ""].filter(Boolean).join(", ");
            return {
              id: r.id,
              name,
              genre: genre || null,
              mood: mood || null,
              bpm,
              audioUrl: r.audio_url ?? null,
              createdAt: r.created_at ?? null,
              kind,
              badge,
              tags,
              color,
              prompt,
            };
          });

        const filled = [...mapped];
        for (const fallback of placeholderTrending) {
          if (filled.length >= 6) break;
          filled.push(fallback);
        }
        setTrending(filled.slice(0, 6));
        setTrendingLoading(false);
      } catch {
        if (!cancelled) {
          setTrending(placeholderTrending);
          setTrendingLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [placeholderTrending]);

  useEffect(() => {
    const withAudio = trending.filter((t) => t.audioUrl);
    if (withAudio.length === 0) return;

    let cancelled = false;
    const audios: HTMLAudioElement[] = [];

    for (const t of withAudio) {
      if (durations[t.id]) continue;
      const a = new Audio(t.audioUrl ?? "");
      a.preload = "metadata";
      a.onloadedmetadata = () => {
        if (cancelled) return;
        const total = Number.isFinite(a.duration) ? a.duration : 0;
        if (!total) return;
        const m = Math.floor(total / 60);
        const s = Math.floor(total % 60);
        const label = `${m}:${String(s).padStart(2, "0")}`;
        setDurations((prev) => ({ ...prev, [t.id]: label }));
      };
      audios.push(a);
    }

    return () => {
      cancelled = true;
      for (const a of audios) {
        a.onloadedmetadata = null;
        a.src = "";
      }
    };
  }, [durations, trending]);

  const pricing = useMemo(() => {
    if (locale === "fr") {
      return [
        {
          name: "Free",
          price: "0€",
          meta: "3 générations / mois",
          bullets: ["✓ 3 tracks/mois", "✓ Download MP3", "✓ Song Mode + Type Beat Mode", "✗ Export WAV"],
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
        meta: "3 generations / month",
        bullets: ["✓ 3 tracks/month", "✓ MP3 download", "✓ Song Mode + Type Beat Mode", "✗ WAV export"],
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
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-[740px] bg-[radial-gradient(ellipse_at_50%_0%,rgba(124,58,237,0.14)_0%,transparent_70%)]" />
      </div>

      <header
        className={[
          "sticky top-0 z-20 transition-all",
          navScrolled ? "border-b border-[#2d2d3d] bg-[rgba(10,10,15,0.8)] backdrop-blur-[12px]" : "bg-transparent",
        ].join(" ")}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-base font-semibold tracking-tight text-white">
            <span className="lowercase">producer</span>
            <span className="lowercase text-[#7c3aed]">hit</span>
          </Link>

          <nav className="hidden items-center gap-3 sm:flex">
            <Link to="/pricing" className="text-sm font-semibold text-[#6b7280] hover:text-white">
              {locale === "fr" ? "Tarifs" : "Pricing"}
            </Link>
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex h-10 items-center justify-center rounded-full bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] px-6 text-sm font-semibold text-white shadow-[0_0_40px_rgba(124,58,237,0.25)] transition-all hover:brightness-110"
              >
                {locale === "fr" ? "Dashboard" : "Dashboard"}
              </Link>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="inline-flex h-10 items-center justify-center rounded-full border border-[#2d2d3d] bg-transparent px-5 text-sm font-semibold text-white transition-all hover:border-[#7c3aed]/60"
                >
                  {locale === "fr" ? "Connexion" : "Login"}
                </Link>
                <Link
                  to="/auth"
                  className="inline-flex h-10 items-center justify-center rounded-full bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] px-6 text-sm font-semibold text-white shadow-[0_0_40px_rgba(124,58,237,0.25)] transition-all hover:brightness-110"
                >
                  {locale === "fr" ? "Essayer gratuit" : "Start Free"}
                </Link>
              </>
            )}
            <div className="inline-flex items-center gap-1 rounded-full border border-[#2d2d3d] bg-[#0a0a0f] p-1">
              <button
                type="button"
                onClick={() => setLocale("en")}
                className={[
                  "h-8 rounded-full px-3 text-xs font-semibold transition-colors",
                  locale === "en" ? "bg-[#7c3aed] text-white" : "text-[#6b7280] hover:text-white",
                ].join(" ")}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLocale("fr")}
                className={[
                  "h-8 rounded-full px-3 text-xs font-semibold transition-colors",
                  locale === "fr" ? "bg-[#7c3aed] text-white" : "text-[#6b7280] hover:text-white",
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

      <main className="relative z-10">
        <RevealSection className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-24">
          <div className="mx-auto w-full max-w-3xl text-center">
            <div className="inline-flex items-center justify-center rounded-full border border-[#7c3aed44] bg-[#7c3aed11] px-4 py-1.5 text-sm font-semibold text-[#a78bfa]">
              {heroBadge}
            </div>
            <h1 className="mt-8 text-balance text-[clamp(2.75rem,9vw,6rem)] font-extrabold leading-[0.95] tracking-tight text-white">
              {locale === "fr" ? (
                <>
                  <div>Crée de la musique.</div>
                  <div className="text-[#7c3aed]">Comme il faut.</div>
                </>
              ) : (
                <>
                  <div>Make music.</div>
                  <div className="text-[#7c3aed]">Like you mean it.</div>
                </>
              )}
            </h1>
            <div className="mx-auto mt-6 max-w-xl text-balance text-[clamp(1rem,2vw,1.125rem)] text-[#6b7280]">
              {locale === "fr"
                ? "Génère des chansons complètes avec voix ou des type beats niveau pro. Décris ton idée, reçois un track en quelques secondes."
                : "Generate full songs with vocals or producer-grade type beats. Describe your idea, get a track in seconds."}
            </div>

            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to={user ? "/dashboard" : "/auth"}
                className="inline-flex h-[54px] w-full items-center justify-center rounded-full bg-[#7c3aed] px-8 text-base font-semibold text-white transition-all hover:bg-[#6d28d9] sm:w-auto"
              >
                {user ? (locale === "fr" ? "Aller au Dashboard →" : "Go to Dashboard →") : locale === "fr" ? "Commencer gratuitement" : "Start creating free"}
              </Link>
              <button
                type="button"
                onClick={() => scrollTo("trending")}
                className="inline-flex h-[54px] w-full items-center justify-center rounded-full border border-[#2d2d3d] bg-transparent px-8 text-base font-semibold text-white transition-all hover:border-[#7c3aed]/60 sm:w-auto"
              >
                {locale === "fr" ? "Écouter des exemples ↓" : "Hear examples ↓"}
              </button>
            </div>

            <div className="mt-6 flex items-center justify-center gap-3 text-sm text-[#6b7280]">
              <div className="flex -space-x-2">
                {["bg-[#7c3aed]", "bg-[#0ea5e9]", "bg-[#db2777]", "bg-[#22c55e]", "bg-[#f97316]"].map((c) => (
                  <div key={c} className={`h-7 w-7 rounded-full border border-[#0a0a0f] ${c}`} />
                ))}
              </div>
              <div>{locale === "fr" ? "Rejoins 10 000+ artistes et producteurs" : "Join 10,000+ artists and producers"}</div>
            </div>
          </div>

          <div id="create" className="relative mx-auto mt-12 w-full max-w-4xl">
            <div className="pointer-events-none absolute inset-0 -z-10">
              <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.20)_0%,transparent_65%)] blur-2xl" />
            </div>
            <div className="rounded-2xl border border-[#2d2d3d] bg-[#111118] p-5 shadow-[0_0_80px_rgba(124,58,237,0.18)]">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex rounded-full border border-[#2d2d3d] bg-[#0a0a0f] p-1">
                  <button
                    type="button"
                    onClick={() => setMode("song")}
                    className={[
                      "h-9 rounded-full px-4 text-sm font-semibold transition-all",
                      mode === "song" ? "bg-[#7c3aed] text-white shadow-[0_0_30px_rgba(124,58,237,0.25)]" : "text-[#6b7280] hover:text-white",
                    ].join(" ")}
                  >
                    {locale === "fr" ? "Song Mode" : "Song Mode"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("beat")}
                    className={[
                      "h-9 rounded-full px-4 text-sm font-semibold transition-all",
                      mode === "beat" ? "bg-[#7c3aed] text-white shadow-[0_0_30px_rgba(124,58,237,0.25)]" : "text-[#6b7280] hover:text-white",
                    ].join(" ")}
                  >
                    {locale === "fr" ? "Type Beat Mode" : "Type Beat Mode"}
                  </button>
                </div>

                <div className="hidden items-center gap-2 text-xs font-semibold text-[#6b7280] sm:flex">
                  <span className="rounded-full border border-[#2d2d3d] bg-[#0a0a0f] px-3 py-1">
                    {locale === "fr" ? "Entrée pour générer" : "Press Enter to generate"}
                  </span>
                  <span className="rounded-full border border-[#2d2d3d] bg-[#0a0a0f] px-3 py-1">
                    {locale === "fr" ? "1 génération gratuite" : "Try 1 free generation"}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-5">
                <div
                  className={[
                    "rounded-2xl border border-[#2d2d3d] bg-[#0a0a0f] p-4 transition-all lg:col-span-3",
                    focused ? "shadow-[0_0_0_3px_rgba(124,58,237,0.22)]" : "shadow-none",
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
                        className="rounded-full border border-[#2d2d3d] bg-[#111118] px-3 py-1 text-xs font-semibold text-[#6b7280] transition-all hover:border-[#7c3aed]/60 hover:text-white"
                      >
                        {c}
                      </button>
                    ))}
                  </div>

                  {mode === "beat" ? (
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-[#2d2d3d] bg-[#111118] p-4">
                        <div className="text-xs font-semibold text-[#6b7280]">{locale === "fr" ? "Style artiste (optionnel)" : "Artist style (optional)"}</div>
                        <input
                          value={beatArtist}
                          onChange={(e) => setBeatArtist(e.target.value)}
                          placeholder={locale === "fr" ? "ex: Drake, Travis Scott…" : "e.g. Drake, Travis Scott..."}
                          className="mt-2 h-10 w-full rounded-xl border border-[#2d2d3d] bg-[#0a0a0f] px-3 text-sm font-semibold text-white outline-none placeholder:text-[#6b7280] focus:border-[#7c3aed]/60"
                        />
                      </div>
                      <div className="rounded-2xl border border-[#2d2d3d] bg-[#111118] p-4">
                        <div className="flex items-center justify-between text-xs font-semibold text-[#6b7280]">
                          <span>BPM</span>
                          <span className="text-white/80">{beatBpm}</span>
                        </div>
                        <input
                          type="range"
                          min={80}
                          max={170}
                          value={beatBpm}
                          onChange={(e) => setBeatBpm(Number(e.target.value))}
                          className="mt-3 w-full accent-[#7c3aed]"
                        />
                      </div>
                      <div className="rounded-2xl border border-[#2d2d3d] bg-[#111118] p-4 md:col-span-2">
                        <div className="text-xs font-semibold text-[#6b7280]">{locale === "fr" ? "Mood" : "Mood"}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {["Trap", "Drill", "Afro", "RnB", "Jersey", "UK Garage"].map((g) => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => toggleGenre(g)}
                              className={[
                                "rounded-full border px-3 py-1 text-xs font-semibold transition-all",
                                beatGenres.includes(g) ? "border-[#7c3aed]/60 bg-[#7c3aed]/10 text-white" : "border-[#2d2d3d] bg-[#0a0a0f] text-[#6b7280] hover:text-white hover:border-[#7c3aed]/50",
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
                                "rounded-full border px-3 py-1 text-xs font-semibold transition-all",
                                beatMood === m ? "border-[#7c3aed]/60 bg-[#7c3aed]/10 text-white" : "border-[#2d2d3d] bg-[#0a0a0f] text-[#6b7280] hover:text-white hover:border-[#7c3aed]/50",
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
                      className="inline-flex h-[54px] w-full items-center justify-center rounded-full bg-[#7c3aed] px-8 text-base font-semibold text-white transition-all hover:bg-[#6d28d9] disabled:opacity-70 sm:w-auto"
                    >
                      <span className="inline-flex items-center gap-2">
                        {generating ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : null}
                        {generating ? (locale === "fr" ? "Génération…" : "Generating…") : locale === "fr" ? "Générer" : "Generate"}
                      </span>
                    </button>
                    <div className="text-sm font-semibold text-[#6b7280]">
                      {locale === "fr" ? "Aucune compétence requise. Décris juste ton idée." : "No skills needed. Just describe your idea."}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#2d2d3d] bg-[#111118] p-4 lg:col-span-2">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-sm font-semibold text-white">{locale === "fr" ? "Aperçu" : "Output preview"}</div>
                    <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#6b7280]">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-[#7c3aed]" />
                      {locale === "fr" ? "Prêt industrie" : "Industry-ready"}
                    </div>
                  </div>
                  <div className={`mt-4 h-40 rounded-2xl border border-[#2d2d3d] bg-gradient-to-tr ${coverGradient}`} />
                  <div className="mt-4 flex flex-wrap gap-2">
                    {previewTags.map((x) => (
                      <span key={x} className="rounded-full border border-[#2d2d3d] bg-[#0a0a0f] px-3 py-1 text-[11px] font-semibold text-[#6b7280]">
                        {x}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 text-sm font-semibold text-[#6b7280]">
                    {locale === "fr" ? "Mix clean. Bounce solide. Prêt pour ton DAW ou l’upload." : "Clean mix. Strong bounce. Ready for your DAW or upload."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </RevealSection>

        <RevealSection className="mx-auto max-w-6xl px-4 py-24">
          <div className="text-center">
            <div className="text-balance text-[clamp(1.75rem,4vw,2.5rem)] font-bold tracking-tight text-white">
              {locale === "fr" ? "Tout pour créer." : "Everything you need to create."}
            </div>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {(locale === "fr"
              ? [
                  { icon: "🎤", t: "Song Mode", d: "Chansons complètes avec voix. Structure, hooks, couplets. Prêt release." },
                  { icon: "🎹", t: "Type Beat Mode", d: "Type beats niveau pro avec contrôle du vibe et itération rapide." },
                  { icon: "⚡", t: "Génère en secondes", d: "Autour de ~20 secondes par track. Garde ce qui hit, regen le reste." },
                  { icon: "📁", t: "Construis ton catalogue", d: "Sauvegarde, télécharge, organise. Exports prêts pour ton DAW." },
                ]
              : [
                  { icon: "🎤", t: "Song Mode", d: "Full songs with vocals. Structure, hooks, verses. Ready to release." },
                  { icon: "🎹", t: "Type Beat Mode", d: "Producer-grade beats with controls for vibe, bounce, and fast iteration." },
                  { icon: "⚡", t: "Generate in seconds", d: "Around ~20 seconds per track. Keep what hits, regenerate the rest." },
                  { icon: "📁", t: "Build your catalog", d: "Save, download, organize. Exports ready for your DAW." },
                ]
            ).map((x) => (
              <div
                key={x.t}
                className="group relative overflow-hidden rounded-2xl border border-[#2d2d3d] bg-[#111118] p-6 transition-all hover:border-[#7c3aed]/50 hover:shadow-[0_0_70px_rgba(124,58,237,0.12)] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-[#7c3aed] before:opacity-0 before:transition-opacity before:content-[''] hover:before:opacity-100"
              >
                <div className="text-2xl">{x.icon}</div>
                <div className="mt-4 text-lg font-semibold text-white">{x.t}</div>
                <div className="mt-2 text-sm text-[#6b7280]">{x.d}</div>
              </div>
            ))}
          </div>
        </RevealSection>

        <RevealSection className="mx-auto max-w-6xl px-4 py-24">
          <div className="rounded-2xl border border-[#2d2d3d] bg-[#111118] p-8">
            <div className="text-balance text-[clamp(1.75rem,3.2vw,2.25rem)] font-bold tracking-tight text-white">
              {locale === "fr" ? "3 étapes. C’est tout." : "Three steps. That’s it."}
            </div>
            <div className="relative mt-8">
              <div className="absolute left-10 right-10 top-5 hidden border-t border-dashed border-[#2d2d3d] md:block" />
              <div className="grid gap-6 md:grid-cols-3">
                {(locale === "fr"
                  ? [
                      { n: "1", t: "Décris ton son", d: "Écris un prompt ou choisis des tags." },
                      { n: "2", t: "L’IA génère en ~20 secondes", d: "Assez rapide pour rester dans le flow." },
                      { n: "3", t: "Télécharge et release", d: "Sauvegarde dans ta bibliothèque et avance.", note: "MP3 · WAV · Prêt DAW" },
                    ]
                  : [
                      { n: "1", t: "Describe your sound", d: "Type a prompt or pick tags." },
                      { n: "2", t: "AI generates in ~20 seconds", d: "Fast enough to stay in flow." },
                      { n: "3", t: "Download and ship it", d: "Save to your library and keep moving.", note: "MP3 · WAV · Ready to upload" },
                    ]
                ).map((x) => (
                  <div key={x.n} className="relative rounded-2xl border border-[#2d2d3d] bg-[#0a0a0f] p-6">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#7c3aed] text-sm font-bold text-white shadow-[0_0_30px_rgba(124,58,237,0.25)]">
                      {x.n}
                    </div>
                    <div className="mt-4 text-lg font-semibold text-white">{x.t}</div>
                    <div className="mt-2 text-sm text-[#6b7280]">{x.d}</div>
                    {x.note ? <div className="mt-2 text-xs font-semibold text-white/70">{x.note}</div> : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </RevealSection>

        <RevealSection id="trending" className="mx-auto max-w-6xl px-4 py-24">
          <h2 className="text-balance text-[clamp(1.75rem,3.2vw,2.25rem)] font-bold tracking-tight text-white">
            {locale === "fr" ? "Ce que les gens créent" : "What people are making"}
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {trendingLoading
              ? [0, 1, 2].map((i) => (
                  <div key={i} className="rounded-2xl border border-[#2d2d3d] bg-[#111118] p-4 animate-pulse">
                    <div className="h-40 rounded-2xl bg-white/5" />
                    <div className="mt-4 h-4 w-2/3 rounded bg-white/5" />
                    <div className="mt-3 flex gap-2">
                      <div className="h-6 w-16 rounded-full bg-white/5" />
                      <div className="h-6 w-20 rounded-full bg-white/5" />
                      <div className="h-6 w-14 rounded-full bg-white/5" />
                    </div>
                  </div>
                ))
              : trending.map((t) => (
                  <div
                    key={t.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setPrompt(t.prompt);
                      setMode(t.kind);
                      window.setTimeout(() => inputRef.current?.focus(), 250);
                      scrollTo("create");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setPrompt(t.prompt);
                        setMode(t.kind);
                        window.setTimeout(() => inputRef.current?.focus(), 250);
                        scrollTo("create");
                      }
                    }}
                    className="group cursor-pointer rounded-2xl border border-[#2d2d3d] bg-[#111118] p-4 transition-all hover:scale-[1.02] hover:border-[#7c3aed]/50 hover:shadow-[0_0_60px_rgba(124,58,237,0.14)] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30"
                  >
                    <div className={`relative h-40 overflow-hidden rounded-2xl bg-gradient-to-tr ${t.color}`}>
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
                        {durations[t.id] || t.duration ? <div className="mt-3 text-xs font-semibold text-white/60">{durations[t.id] ?? t.duration}</div> : null}
                      </div>
                      {t.audioUrl ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlay(t);
                          }}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#0a0a0f] shadow-[0_0_40px_rgba(124,58,237,0.20)] transition-all group-hover:shadow-[0_0_60px_rgba(124,58,237,0.25)]"
                          aria-label={playingId === t.id ? "Pause" : "Play"}
                        >
                          {playingId === t.id ? (
                            <div className="flex h-4 items-end gap-0.5">
                              {[3, 5, 4, 6, 3].map((h, i) => (
                                <div
                                  key={i}
                                  className="w-1 rounded-full bg-[#0a0a0f] animate-bounce"
                                  style={{ height: `${h * 3}px`, animationDelay: `${i * 0.1}s`, animationDuration: "0.6s" }}
                                />
                              ))}
                            </div>
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          title={locale === "fr" ? "Aucun aperçu" : "No preview"}
                          className="inline-flex h-11 w-11 cursor-not-allowed items-center justify-center rounded-full border border-[#2d2d3d] bg-[#0a0a0f] text-sm font-bold text-white/50"
                          aria-label={locale === "fr" ? "Aucun aperçu" : "No preview"}
                        >
                          –
                        </button>
                      )}
                    </div>
                  </div>
                ))}
          </div>
        </RevealSection>

        <RevealSection className="mx-auto max-w-6xl px-4 py-24">
          <div className="text-center">
            <div className="text-balance text-[clamp(1.75rem,4vw,2.5rem)] font-bold tracking-tight text-white">
              {locale === "fr" ? "Tarifs" : "Pricing"}
            </div>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {pricing.map((p) => (
              <div
                key={p.name}
                className={[
                  "rounded-2xl border bg-[#111118] p-6",
                  p.featured ? "border-[#7c3aed]/70 shadow-[0_0_70px_rgba(124,58,237,0.16)]" : "border-[#2d2d3d]",
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
          <div className="relative overflow-hidden rounded-2xl border border-[#2d2d3d] bg-[#0a0a0f] p-10">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.09)_0%,transparent_70%)]" />
            </div>
            <div className="relative">
              <div className="text-balance text-[clamp(2rem,4.2vw,3rem)] font-extrabold tracking-tight text-white">
                {locale === "fr" ? "Ton son. Tes règles." : "Your sound. Your rules."}
              </div>
              <div className="mt-3 text-balance text-[clamp(1rem,2vw,1.125rem)] font-semibold text-[#6b7280]">
                {locale === "fr" ? "Gratuit pour commencer. Pas de carte. Zéro limite d’idées." : "Free to start. No credit card. No limits on ideas."}
              </div>
              <div className="mt-8">
                <Link
                  to="/auth"
                  className="inline-flex h-[54px] items-center justify-center rounded-full bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] px-8 text-base font-semibold text-white shadow-[0_0_90px_rgba(124,58,237,0.20)] transition-all hover:brightness-110"
                >
                  {locale === "fr" ? "Fais ton premier track gratuit →" : "Make your first track free →"}
                </Link>
              </div>
            </div>
          </div>
        </RevealSection>

        <RevealSection className="mx-auto max-w-6xl px-4 py-24">
          <div className="rounded-2xl border border-[#2d2d3d] bg-[#111118] p-8">
            <h2 className="text-balance text-[clamp(1.75rem,3.2vw,2.25rem)] font-bold tracking-tight text-white">FAQ</h2>
            <div className="mt-6 grid gap-2">
              {faqs.map((f, i) => {
                const open = faqOpen === i;
                return (
                  <div key={f.q} className="rounded-2xl border border-[#2d2d3d] bg-[#0a0a0f]">
                    <button
                      type="button"
                      onClick={() => setFaqOpen((v) => (v === i ? null : i))}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    >
                      <div className="text-sm font-semibold text-white">{f.q}</div>
                      <div className="text-sm font-semibold text-[#6b7280]">{open ? "–" : "+"}</div>
                    </button>
                    {open ? <div className="px-5 pb-5 text-sm text-[#6b7280]">{f.a}</div> : null}
                  </div>
                );
              })}
            </div>
          </div>
        </RevealSection>

        <RevealSection className="border-t border-[#2d2d3d] py-12">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 text-sm text-[#6b7280] md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">
                <span className="lowercase">producer</span>
                <span className="lowercase text-[#7c3aed]">hit</span>
              </span>
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
              <Link to="/legal#privacy" className="hover:text-white">
                {locale === "fr" ? "Privacy" : "Privacy"}
              </Link>
              <Link to="/legal#terms" className="hover:text-white">
                {locale === "fr" ? "Terms" : "Terms"}
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
