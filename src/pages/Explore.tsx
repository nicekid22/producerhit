import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Music2, Pause, Play, Radio, Search, Shuffle, Sparkles, Star, Trophy, Users, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { AppShell } from "@/components/AppShell";
import { PrismFilterPill } from "@/components/prism/PrismFilterPill";
import { PrismPageHero } from "@/components/prism/PrismPageHero";
import { PrismStat } from "@/components/prism/PrismStat";
import { Dropdown } from "@/components/ui/Dropdown";
import { Button } from "@/components/ui/Button";
import { coverGradient, coverImageUrl } from "@/lib/utils";
import {
  ensurePublicLoopAudioUrl,
  fetchPublicLoops,
  resolvePlayableCommunityAudio,
  type PublicLoopRow,
} from "@/lib/publicLoops";
import { supabase, trackClientEvent } from "@/lib/supabaseClient";
import { useLocaleStore } from "@/stores/localeStore";
import { useAuthStore } from "@/stores/authStore";
import { usePlayerStore } from "@/stores/playerStore";
import type { Loop } from "@/types/loop";

function formatDate(d: string) {
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return d;
  }
}

export default function Explore() {
  const navigate = useNavigate();
  const locale = useLocaleStore((s) => s.locale);
  const isFr = locale === "fr";
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<PublicLoopRow[]>([]);
  const [refetchToken, setRefetchToken] = useState(0);
  const [genre, setGenre] = useState<string>("All");
  const [mood, setMood] = useState<string>("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"new" | "top" | "random">("new");
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const current = usePlayerStore((s) => s.current);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const setCurrent = usePlayerStore((s) => s.setCurrent);
  const setPlaying = usePlayerStore((s) => s.setPlaying);
  const setQueue = usePlayerStore((s) => s.setQueue);

  type RatingStats = { sum: number; count: number; myRating: number | null };
  const [ratingsById, setRatingsById] = useState<Record<string, RatingStats>>({});

  const genres = useMemo(() => {
    const set = new Set(rows.map((r) => r.genre ?? "").filter(Boolean));
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [rows]);

  const moods = useMemo(() => {
    const set = new Set(rows.map((r) => r.mood ?? "").filter(Boolean));
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [rows]);

  const toLoop = (r: PublicLoopRow): Loop => {
    return {
      id: r.id,
      name: (r.name ?? "Untitled").trim() || "Untitled",
      genre: r.genre ?? "",
      influence: r.influence || "No Influence",
      key: "",
      scale: "",
      bpm: typeof r.bpm === "number" ? r.bpm : 0,
      loopLength: "8 bars",
      swing: 0,
      mood: r.mood || "",
      energyLevel: "",
      reverb: "",
      prompt: r.prompt || "",
      audioUrl: r.audio_url ?? null,
      details: null,
      stemsUrl: r.stems_url && typeof r.stems_url === "object" ? (r.stems_url as Record<string, unknown>) : null,
      isSaved: false,
      isPublic: true,
      createdAt: r.created_at ?? new Date().toISOString(),
    };
  };

  const isNew = (createdAt: string) => Date.now() - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000;

  const remixFrom = (r: PublicLoopRow) => {
    const promptValue = (r.prompt || "").trim();
    if (!promptValue) return;
    trackClientEvent("community_remix_click", { loop_id: r.id });
    try {
      window.localStorage.setItem("producerhit_pending_source", "community");
    } catch {
      void 0;
    }
    if (!user) {
      window.localStorage.setItem("producerhit_pending_prompt", promptValue);
      navigate("/auth", { state: { from: "/community" } });
      return;
    }
    navigate(`/dashboard?prompt=${encodeURIComponent(promptValue)}`);
  };

  useEffect(() => {
    let cancelled = false;
    const cacheKey = "producerhit_community_cache_v1";
    let loadedFromCache = false;
    try {
      const raw = window.sessionStorage.getItem(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { ts?: unknown; rows?: unknown };
        const ts = typeof parsed?.ts === "number" ? parsed.ts : 0;
        const rows = Array.isArray(parsed?.rows) ? (parsed.rows as unknown[]) : [];
        if (Date.now() - ts < 10 * 60 * 1000 && rows.length) {
          setRows(rows as PublicLoopRow[]);
          setLoading(false);
          loadedFromCache = true;
        }
      }
    } catch {
      // ignore
    }

    if (!loadedFromCache) setLoading(true);
    setFetchError(null);
    void (async () => {
      try {
        const mapped = await fetchPublicLoops({ limit: 36, timeoutMs: 6000 });
        if (cancelled) return;
        setRows(mapped);
        try {
          window.sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), rows: mapped }));
        } catch {
          // ignore
        }
      } catch (err) {
        if (!cancelled && !loadedFromCache) {
          setRows([]);
          const msg =
            err instanceof Error && err.message === "timeout"
              ? isFr
                ? "Chargement trop long. Réessaie."
                : "Loading is taking too long. Try again."
              : isFr
                ? "Impossible de charger la communauté."
                : "Failed to load community.";
          setFetchError(msg);
          if (err instanceof Error && err.message === "timeout") toast.error(msg);
        }
      }
      if (cancelled) return;
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [isFr, refetchToken]);

  useEffect(() => {
    let cancelled = false;
    const ids = rows.slice(0, 30).map((r) => r.id).filter(Boolean);
    if (!ids.length) {
      setRatingsById({});
      return;
    }
    void (async () => {
      const { data, error } = await supabase.from("loop_ratings").select("loop_id,rating").in("loop_id", ids);
      if (cancelled) return;
      if (error) return;
      const rowsAll = (data ?? []) as Array<{ loop_id: string; rating: number }>;
      const next: Record<string, RatingStats> = {};
      for (const r of ids) next[r] = { sum: 0, count: 0, myRating: null };
      for (const rr of rowsAll) {
        const s = next[rr.loop_id] ?? { sum: 0, count: 0, myRating: null };
        s.sum += typeof rr.rating === "number" ? rr.rating : 0;
        s.count += 1;
        next[rr.loop_id] = s;
      }

      if (user) {
        const mineRes = await supabase.from("loop_ratings").select("loop_id,rating").eq("user_id", user.id).in("loop_id", ids);
        if (!cancelled && !mineRes.error) {
          const mine = (mineRes.data ?? []) as Array<{ loop_id: string; rating: number }>;
          for (const m of mine) {
            if (!next[m.loop_id]) next[m.loop_id] = { sum: 0, count: 0, myRating: null };
            next[m.loop_id].myRating = typeof m.rating === "number" ? m.rating : null;
          }
        }
      }

      setRatingsById(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [rows, user]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = rows.filter((r) => {
      const g = r.genre ?? "";
      const m = r.mood ?? "";
      if (genre !== "All" && g !== genre) return false;
      if (mood !== "All" && m !== mood) return false;
      if (!q) return true;
      const hay = `${r.name ?? ""} ${g} ${m} ${r.prompt ?? ""}`.toLowerCase();
      return hay.includes(q);
    });

    if (sort === "random") {
      const copy = base.slice();
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    }

    if (sort === "top") {
      return base
        .slice()
        .sort((a, b) => {
          const ra = ratingsById[a.id];
          const rb = ratingsById[b.id];
          const avgA = ra && ra.count > 0 ? ra.sum / ra.count : 0;
          const avgB = rb && rb.count > 0 ? rb.sum / rb.count : 0;
          if (avgB !== avgA) return avgB - avgA;
          const countA = ra?.count ?? 0;
          const countB = rb?.count ?? 0;
          if (countB !== countA) return countB - countA;
          return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
        });
    }

    return base;
  }, [genre, mood, query, ratingsById, rows, sort]);

  const newestRail = useMemo(() => rows.slice(0, 12), [rows]);

  const topRail = useMemo(() => {
    return rows
      .slice()
      .sort((a, b) => {
        const ra = ratingsById[a.id];
        const rb = ratingsById[b.id];
        const avgA = ra && ra.count > 0 ? ra.sum / ra.count : 0;
        const avgB = rb && rb.count > 0 ? rb.sum / rb.count : 0;
        if (avgB !== avgA) return avgB - avgA;
        const countA = ra?.count ?? 0;
        const countB = rb?.count ?? 0;
        if (countB !== countA) return countB - countA;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
      .slice(0, 12);
  }, [ratingsById, rows]);

  const vibesRail = useMemo(() => {
    const copy = rows.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, 12);
  }, [rows]);

  const spotlight = topRail[0] ?? newestRail[0] ?? null;
  const genreVariety = Math.max(0, genres.length - 1);
  const moodVariety = Math.max(0, moods.length - 1);

  const ensurePlayableUrl = async (r: PublicLoopRow) => {
    if (resolvingId && resolvingId !== r.id) return "";
    setResolvingId(r.id);
    try {
      const resolved = await resolvePlayableCommunityAudio(r);
      if (resolved) {
        setRows((prev) =>
          prev.map((x) =>
            x.id === r.id && !x.audio_url?.trim()
              ? { ...x, audio_url: resolved.startsWith("blob:") ? x.audio_url : resolved }
              : x,
          ),
        );
      }
      return resolved;
    } finally {
      setResolvingId(null);
    }
  };

  const playQueue = async (list: PublicLoopRow[], startIndex: number) => {
    const startRow = list[startIndex] ?? list[0] ?? null;
    if (!startRow) return;

    const startUrl = await ensurePlayableUrl(startRow);
    if (!startUrl) {
      toast.error(isFr ? "Audio indisponible" : "Audio unavailable");
      return;
    }

    const withUrls = await Promise.all(
      list.map(async (r) => {
        const trimmed = typeof r.audio_url === "string" ? r.audio_url.trim() : "";
        if (trimmed) return r;
        const http = await ensurePublicLoopAudioUrl(r).catch(() => "");
        return http ? { ...r, audio_url: http } : r;
      }),
    );
    const clean = withUrls.filter((r) => typeof r.audio_url === "string" && r.audio_url.trim().length > 0);
    if (!clean.length) {
      trackClientEvent("community_play", { loop_id: startRow.id, source: "queue_resolve" });
      setQueue([toLoop({ ...startRow, audio_url: startUrl })], 0, true, "community");
      return;
    }

    const idx = Math.max(0, clean.findIndex((r) => r.id === startRow.id));
    const picked = clean[idx >= 0 ? idx : 0]!;
    trackClientEvent("community_play", { loop_id: picked.id, source: "queue" });

    const queueLoops = await Promise.all(
      clean.map(async (r) => {
        const playable = r.id === picked.id ? startUrl : await resolvePlayableCommunityAudio(r).catch(() => r.audio_url!.trim());
        return toLoop({ ...r, audio_url: playable });
      }),
    );
    setQueue(queueLoops, idx >= 0 ? idx : 0, true, "community");
  };

  const togglePlay = async (r: PublicLoopRow) => {
    const url = await ensurePlayableUrl(r);
    if (!url) {
      toast.error(isFr ? "Audio indisponible" : "Audio unavailable");
      return;
    }
    if (current?.id === r.id) {
      setPlaying(!isPlaying);
      return;
    }
    trackClientEvent("community_play", { loop_id: r.id, source: "direct" });
    setCurrent(toLoop({ ...r, audio_url: url }), true);
  };

  const togglePlayFromFiltered = async (r: PublicLoopRow) => {
    const idx = filtered.findIndex((x) => x.id === r.id);
    if (idx >= 0) {
      await playQueue(filtered, idx);
      return;
    }
    await togglePlay(r);
  };

  const setRating = (loopId: string, rating: number) => {
    const r = Math.max(1, Math.min(5, Math.round(rating)));
    if (!user) {
      toast(isFr ? "Connecte-toi pour noter" : "Login to rate");
      navigate("/auth", { state: { from: "/community" } });
      return;
    }
    void (async () => {
      const prev = ratingsById[loopId]?.myRating ?? null;
      const { error } = await supabase.from("loop_ratings").upsert(
        { loop_id: loopId, user_id: user.id, rating: r },
        { onConflict: "loop_id,user_id" },
      );
      if (error) {
        toast.error(isFr ? "Impossible de noter" : "Could not rate");
        return;
      }
      setRatingsById((state) => {
        const curr = state[loopId] ?? { sum: 0, count: 0, myRating: null };
        const next = { ...state };
        const sum = curr.sum + (prev ? r - prev : r);
        const count = curr.count + (prev ? 0 : 1);
        next[loopId] = { sum, count, myRating: r };
        return next;
      });
    })();
  };

  return (
    <AppShell
      theme="prism"
      variant="single"
    >
      <div className="mx-auto w-full max-w-[1280px] space-y-5 px-4 pt-6 md:px-6">
        <PrismPageHero
          eyebrow={isFr ? "FLUX LIVE" : "LIVE FEED"}
          title={<span className="pk-prism-holo-text">{isFr ? "Communauté ProducerHit" : "ProducerHit Community"}</span>}
          description={
            isFr
              ? "Découvre les créations publiques, enchaîne les tracks et remixe les vibes qui t’inspirent."
              : "Discover public creations, queue tracks, and remix the vibes that inspire you."
          }
          actions={
            <>
              <span className="pk-prism-live-badge">
                <span className="pk-prism-live-badge__dot" />
                {loading ? "…" : `${rows.length} live`}
              </span>
              <Link to="/dashboard">
                <Button variant="primary" size="sm">
                  <Zap className="h-4 w-4" />
                  {isFr ? "Créer" : "Create"}
                </Button>
              </Link>
            </>
          }
        >
          <div className="pk-prism-stat-grid">
            <PrismStat label={isFr ? "Tracks" : "Tracks"} value={rows.length} icon={<Music2 className="h-4 w-4" />} accent="cyan" />
            <PrismStat label={isFr ? "Genres" : "Genres"} value={genreVariety} icon={<Radio className="h-4 w-4" />} accent="violet" />
            <PrismStat label="Moods" value={moodVariety} icon={<Sparkles className="h-4 w-4" />} />
            <PrismStat label={isFr ? "Résultats" : "Results"} value={filtered.length} icon={<Users className="h-4 w-4" />} />
          </div>

          {spotlight && !loading ? (
            <div className="pk-prism-spotlight mt-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="pk-prism-eyebrow">{isFr ? "SPOTLIGHT" : "SPOTLIGHT"}</div>
                <div className="mt-1 truncate text-lg font-bold text-white">{spotlight.name}</div>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-pk-muted">
                  {spotlight.genre ? <span className="pk-prism-vibe-chip">{spotlight.genre}</span> : null}
                  {spotlight.mood ? <span className="pk-prism-vibe-chip">{spotlight.mood}</span> : null}
                  {(spotlight.bpm ?? 0) > 0 ? <span className="pk-prism-vibe-chip">{spotlight.bpm} BPM</span> : null}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="secondary" size="sm" onClick={() => void playQueue(topRail.length ? topRail : filtered, 0)}>
                  <Play className="h-4 w-4" />
                  {isFr ? "Écouter le top" : "Play top"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const pick = filtered[Math.floor(Math.random() * Math.max(1, filtered.length))];
                    if (pick) {
                      const idx = filtered.findIndex((x) => x.id === pick.id);
                      void playQueue(filtered, idx >= 0 ? idx : 0);
                    }
                  }}
                >
                  <Shuffle className="h-4 w-4" />
                  Shuffle
                </Button>
              </div>
            </div>
          ) : null}
        </PrismPageHero>

        <div className="sticky top-0 z-20 -mx-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 backdrop-blur-xl md:mx-0">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={loading || filtered.length === 0}
              onClick={() => {
                const first = filtered[0];
                if (first) void playQueue(filtered, 0);
              }}
            >
              <Play className="h-4 w-4" />
              {isFr ? "Play all" : "Play all"}
            </Button>
            <Link to="/library">
              <Button variant="secondary" size="sm">
                {isFr ? "Ma bibliothèque" : "My library"}
              </Button>
            </Link>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-12">
            <div className="pk-prism-input-shell md:col-span-5">
              <Search />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isFr ? "Rechercher titre, style, mood…" : "Search title, style, mood…"}
              />
            </div>
            <div className="md:col-span-3">
              <Dropdown label={isFr ? "Genre" : "Genre"} value={genre} onChange={setGenre} options={genres.map((g) => ({ value: g, label: g }))} />
            </div>
            <div className="md:col-span-4">
              <Dropdown label={isFr ? "Mood" : "Mood"} value={mood} onChange={setMood} options={moods.map((m) => ({ value: m, label: m }))} />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 pk-chip-scroll md:overflow-visible">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">{isFr ? "Tri" : "Sort"}</span>
            <PrismFilterPill active={sort === "new"} onClick={() => setSort("new")}>
              {isFr ? "Nouveaux" : "Newest"}
            </PrismFilterPill>
            <PrismFilterPill active={sort === "top"} onClick={() => setSort("top")}>
              Top
            </PrismFilterPill>
            <PrismFilterPill active={sort === "random"} onClick={() => setSort("random")}>
              {isFr ? "Aléatoire" : "Random"}
            </PrismFilterPill>
          </div>
        </div>

        {!loading && filtered.length === 0 ? (
          <div className="mt-6 rounded-2xl pk-prism-card-soft p-6 text-center">
            <div className="text-sm font-semibold">{isFr ? "Aucune track à afficher" : "No tracks to show"}</div>
            <div className="mt-2 text-sm text-pk-muted">
              {fetchError ??
                (isFr
                  ? "Génère un track sur le Dashboard — il apparaîtra ici automatiquement s’il est Public."
                  : "Generate a track on the Dashboard — it will show up here automatically if Public.")}
            </div>
            <div className="mt-4 flex justify-center gap-2">
              <Button variant="secondary" onClick={() => setRefetchToken((x) => x + 1)}>
                {isFr ? "Réessayer" : "Retry"}
              </Button>
              <Link to="/dashboard">
                <Button variant="primary">{isFr ? "Créer un track" : "Create a track"}</Button>
              </Link>
            </div>
          </div>
        ) : null}
        <div className="mt-6 grid gap-6">
          {[
            { key: "new", title: isFr ? "Nouveautés" : "New releases", icon: <Sparkles className="h-4 w-4 text-pk-accent" />, items: newestRail },
            { key: "top", title: isFr ? "Top de la semaine" : "Top this week", icon: <Trophy className="h-4 w-4 text-yellow-400" />, items: topRail },
            { key: "vibes", title: isFr ? "Vibes" : "Vibes", icon: <Music2 className="h-4 w-4 text-pk-accent" />, items: vibesRail },
          ].map((rail) =>
            rail.items.length ? (
              <div key={rail.key}>
                <div className="pk-prism-rail-head">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    {rail.icon}
                    {rail.title}
                  </div>
                  <div className="pk-prism-rail-head__line" />
                  <button
                    type="button"
                    onClick={() => {
                      if (rail.key === "top") setSort("top");
                      else if (rail.key === "vibes") setSort("random");
                      else setSort("new");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="text-xs font-semibold text-pk-accent hover:underline"
                  >
                    {isFr ? "Voir plus" : "See more"}
                  </button>
                </div>
                <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
                  {rail.items.map((r, idx) => {
                    const loopForCover = toLoop(r);
                    const bg = coverGradient(loopForCover);
                    const url = coverImageUrl(loopForCover);
                    const avg = (() => {
                      const s = ratingsById[r.id];
                      if (!s || s.count === 0) return "";
                      return (s.sum / s.count).toFixed(1);
                    })();
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => void playQueue(rail.items, idx)}
                        className="group min-w-[210px] rounded-2xl pk-prism-card-soft p-3 text-left transition-all hover:border-pk-accent/40 hover:shadow-[0_0_48px_rgba(157,124,255,0.14)]"
                      >
                        <div className="relative h-28 overflow-hidden rounded-2xl" style={{ background: bg }}>
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
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
                          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="truncate text-xs font-semibold text-white">{r.name}</div>
                              <div className="mt-0.5 flex flex-wrap gap-2 text-[10px] font-semibold text-white/70">
                                {r.mood ? <span className="rounded-full bg-black/35 px-2 py-0.5">{r.mood}</span> : null}
                                {(r.bpm ?? 0) > 0 ? <span className="rounded-full bg-black/35 px-2 py-0.5">{r.bpm} BPM</span> : null}
                              </div>
                            </div>
                            <div className="inline-flex h-9 w-9 items-center justify-center rounded-full pk-prism-btn text-[#050508] shadow-[0_0_32px_rgba(157,124,255,0.2)]">
                              <Play className="h-4 w-4" />
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <div className="text-xs text-pk-muted">{r.genre}</div>
                          {avg ? (
                            <div className="inline-flex items-center gap-1 rounded-full border border-pk-border bg-pk-bg px-2 py-1 text-[11px] font-semibold">
                              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                              {avg}
                            </div>
                          ) : (
                            <div className="text-[11px] font-semibold text-pk-muted">—</div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null,
          )}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {loading
            ? Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="rounded-2xl pk-prism-card-soft p-4 animate-pulse">
                  <div className="h-40 rounded-2xl bg-white/5" />
                  <div className="mt-4 h-4 w-2/3 rounded bg-white/5" />
                  <div className="mt-3 flex gap-2">
                    <div className="h-6 w-16 rounded-full bg-white/5" />
                    <div className="h-6 w-20 rounded-full bg-white/5" />
                    <div className="h-6 w-14 rounded-full bg-white/5" />
                  </div>
                  <div className="mt-4 h-10 rounded-full bg-white/5" />
                </div>
              ))
            : filtered.map((r) => (
              <article
                key={r.id}
                role="button"
                tabIndex={0}
                onClick={() => void togglePlayFromFiltered(r)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    void togglePlayFromFiltered(r);
                  }
                }}
                className="group relative overflow-hidden rounded-2xl pk-prism-card-soft p-4 transition-all hover:border-pk-accent/40 hover:shadow-[0_0_56px_rgba(157,124,255,0.14)] focus:outline-none focus:ring-2 focus:ring-pk-accent/30"
              >
                {(() => {
                  const loopForCover = toLoop(r);
                  const bg = coverGradient(loopForCover);
                  const url = coverImageUrl(loopForCover);
                  return (
                    <div className="relative h-40 overflow-hidden rounded-2xl" style={{ background: bg }}>
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
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
                      <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                        <span className="rounded-full border border-pk-border bg-black/40 px-2.5 py-1 text-[11px] font-semibold">
                          {r.genre || (isFr ? "Track" : "Track")}
                        </span>
                        {isNew(r.created_at) ? (
                          <span className="inline-flex items-center gap-2 rounded-full border border-pk-border bg-black/40 px-2.5 py-1 text-[11px] font-semibold">
                            <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
                            {isFr ? "Nouveau" : "New"}
                          </span>
                        ) : null}
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-white">{r.name}</div>
                          <div className="mt-1 flex flex-wrap gap-2 text-[11px] font-semibold text-white/70">
                            {r.mood ? <span className="rounded-full bg-black/35 px-2 py-0.5">{r.mood}</span> : null}
                            {(r.bpm ?? 0) > 0 ? <span className="rounded-full bg-black/35 px-2 py-0.5">{r.bpm} BPM</span> : null}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="inline-flex items-center gap-1 rounded-full border border-pk-border bg-black/40 px-2.5 py-1 text-[11px] font-semibold text-white">
                            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                            {(() => {
                              const s = ratingsById[r.id];
                              if (!s || s.count === 0) return "—";
                              const avg = s.sum / s.count;
                              return avg.toFixed(1);
                            })()}
                          </div>
                          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full pk-prism-btn text-[#050508] shadow-[0_0_32px_rgba(157,124,255,0.22)] transition-all group-hover:shadow-[0_0_48px_rgba(157,124,255,0.28)]">
                            {current?.id === r.id && isPlaying ? (
                              <div className="flex h-4 items-end gap-0.5">
                                {[3, 5, 4, 6].map((h, i) => (
                                  <div
                                    key={i}
                                    className="w-1 rounded-full bg-[#0a0a0f] animate-bounce"
                                    style={{ height: `${h * 3}px`, animationDelay: `${i * 0.1}s`, animationDuration: "0.6s" }}
                                  />
                                ))}
                              </div>
                            ) : (
                              <Play className={resolvingId === r.id ? "h-4 w-4 opacity-50" : "h-4 w-4"} />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="mt-4">
                  <p className="line-clamp-3 text-sm text-pk-muted">{r.prompt || "—"}</p>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const star = i + 1;
                      const my = ratingsById[r.id]?.myRating ?? 0;
                      const on = star <= my;
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setRating(r.id, star);
                          }}
                          className="inline-flex"
                          aria-label={isFr ? `Noter ${star} sur 5` : `Rate ${star} of 5`}
                          title={isFr ? `Noter ${star}/5` : `Rate ${star}/5`}
                        >
                          <Star className={on ? "h-4 w-4 fill-yellow-400 text-yellow-400" : "h-4 w-4 text-pk-border"} />
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        remixFrom(r);
                      }}
                      className="inline-flex h-10 items-center gap-2 rounded-full border border-pk-border bg-pk-bg px-4 text-sm font-semibold text-pk-text transition-all hover:border-pk-accent/50 hover:bg-white/5"
                      aria-label={isFr ? "Remixer ce style" : "Remix this style"}
                    >
                      <Sparkles className="h-4 w-4 text-pk-accent" />
                      {isFr ? "Remixer" : "Remix"}
                    </button>
                    <Link
                      className="inline-flex h-10 items-center rounded-full border border-pk-border bg-pk-bg px-4 text-sm font-semibold text-pk-text transition-all hover:border-pk-accent/50 hover:bg-white/5"
                      to={`/loop/${r.id}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isFr ? "Voir" : "View"}
                    </Link>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void togglePlayFromFiltered(r);
                    }}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-pk-accent px-5 text-sm font-semibold text-white transition-all hover:brightness-110"
                    aria-label={current?.id === r.id && isPlaying ? (isFr ? "Pause" : "Pause") : isFr ? "Écouter" : "Listen"}
                  >
                    {current?.id === r.id && isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {resolvingId === r.id ? (isFr ? "Préparation…" : "Preparing…") : current?.id === r.id && isPlaying ? (isFr ? "Pause" : "Pause") : isFr ? "Écouter" : "Listen"}
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-pk-muted">
                  <div className="min-w-0 truncate">{r.created_at ? formatDate(r.created_at) : "—"}</div>
                  <div className="font-semibold">
                    {(() => {
                      const s = ratingsById[r.id];
                      if (!s || s.count === 0) return isFr ? "Pas encore de note" : "No ratings yet";
                      const avg = s.sum / s.count;
                      return `${avg.toFixed(1)} (${s.count})`;
                    })()}
                  </div>
                </div>
              </article>
            ))}
        </div>
      </div>
    </AppShell>
  );
}
