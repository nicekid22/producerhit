import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Play, Search, Shuffle, Sparkles, Trophy, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { AppShell } from "@/components/AppShell";
import { PrismFilterPill } from "@/components/prism/PrismFilterPill";
import { PkIconLoader } from "@/components/ui/PkIconLoader";
import { Dropdown } from "@/components/ui/Dropdown";
import { Button } from "@/components/ui/Button";
import { CommunityFeatured } from "@/components/community/CommunityFeatured";
import { CommunityRail } from "@/components/community/CommunityRail";
import { CommunityTrackCard } from "@/components/community/CommunityTrackCard";
import { publicRowToCoverLoop } from "@/lib/coverArt";
import {
  ensurePublicLoopAudioUrl,
  fetchPublicLoops,
  resolvePlayableCommunityAudio,
  sortPublicLoopsByNewest,
  type PublicLoopRow,
} from "@/lib/publicLoops";
import { savePendingRemix, buildRemixPromptFromMeta } from "@/lib/pendingRemix";
import { supabase, trackClientEvent } from "@/lib/supabaseClient";
import { useLocaleStore } from "@/stores/localeStore";
import { useAuthStore } from "@/stores/authStore";
import { usePlayerStore } from "@/stores/playerStore";
import type { Loop } from "@/types/loop";

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

  const toLoop = (r: PublicLoopRow): Loop => publicRowToCoverLoop(r);

  const isNew = (createdAt: string) => Date.now() - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000;

  const remixFrom = (r: PublicLoopRow) => {
    trackClientEvent("community_remix_vibe_click", { loop_id: r.id });
    setResolvingId(r.id);
    void (async () => {
      try {
        const audioUrl = await resolvePlayableCommunityAudio(r);
        const promptValue = buildRemixPromptFromMeta({
          prompt: r.prompt || "",
          genre: r.genre || "",
          mood: r.mood || "",
          locale,
        });
        savePendingRemix({
          sourceLoopId: r.id,
          sourceLoopName: (r.name || "Track").trim() || "Track",
          audioUrl,
          prompt: promptValue,
          genre: r.genre || undefined,
          mood: r.mood || undefined,
          bpm: typeof r.bpm === "number" ? r.bpm : undefined,
          source: "community",
        });
        if (!user) {
          navigate("/auth", { state: { from: "/dashboard?remix=1" } });
          return;
        }
        navigate("/dashboard?remix=1");
      } catch {
        toast.error(isFr ? "Audio indisponible pour remix" : "Audio unavailable for remix");
      } finally {
        setResolvingId(null);
      }
    })();
  };

  useEffect(() => {
    let cancelled = false;
    const cacheKey = "producerhit_community_cache_v6";
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
        const mapped = await fetchPublicLoops({ limit: 36, timeoutMs: 6000, playableOnly: true });
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

    return sortPublicLoopsByNewest(base);
  }, [genre, mood, query, ratingsById, rows, sort]);

  const newestRail = useMemo(() => sortPublicLoopsByNewest(rows).slice(0, 12), [rows]);

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


  const spotlight = topRail[0] ?? newestRail[0] ?? null;
  const genreVariety = Math.max(0, genres.length - 1);
  const hasActiveFilters = query.trim().length > 0 || genre !== "All" || mood !== "All" || sort !== "new";
  const catalogTitle =
    sort === "top"
      ? isFr
        ? "Top communauté"
        : "Community top picks"
      : sort === "random"
        ? isFr
          ? "Sélection aléatoire"
          : "Random picks"
        : hasActiveFilters
          ? isFr
            ? `${filtered.length} résultat${filtered.length > 1 ? "s" : ""}`
            : `${filtered.length} result${filtered.length === 1 ? "" : "s"}`
          : isFr
            ? "Toute la communauté"
            : "All community tracks";

  const ensurePlayableUrl = async (r: PublicLoopRow) => {
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
    <AppShell theme="prism" variant="single">
      <div className="pk-community mx-auto w-full max-w-[1280px] space-y-6 px-4 pb-10 pt-5 md:px-6 md:pt-6">
        <header className="pk-community-header">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="pk-prism-live-badge">
                  <span className="pk-prism-live-badge__dot" />
                  {loading ? "…" : `${rows.length} live`}
                </span>
                <span className="text-xs font-medium text-white/40">
                  {genreVariety} {isFr ? "genres" : "genres"}
                </span>
              </div>
              <h1 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">
                <span className="pk-prism-holo-text">{isFr ? "Communauté" : "Community"}</span>
              </h1>
              <p className="mt-2 max-w-xl text-sm text-white/55">
                {isFr
                  ? "Écoute, filtre et remixe les créations publiques — comme un mini-catalogue streaming."
                  : "Listen, filter, and remix public tracks — a simple streaming-style catalog."}
              </p>
            </div>
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
                {isFr ? "Tout lire" : "Play all"}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={loading || filtered.length === 0}
                onClick={() => {
                  const pick = filtered[Math.floor(Math.random() * filtered.length)];
                  if (!pick) return;
                  const idx = filtered.findIndex((x) => x.id === pick.id);
                  void playQueue(filtered, idx >= 0 ? idx : 0);
                }}
              >
                <Shuffle className="h-4 w-4" />
                Shuffle
              </Button>
              <Link to="/dashboard">
                <Button variant="primary" size="sm">
                  <Zap className="h-4 w-4" />
                  {isFr ? "Créer" : "Create"}
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {spotlight && !loading ? (
          <CommunityFeatured
            row={spotlight}
            isFr={isFr}
            isActive={current?.id === spotlight.id}
            isPlaying={isPlaying}
            resolving={resolvingId === spotlight.id}
            onPlay={() => void togglePlay(spotlight)}
            onShuffle={() => {
              const pick = filtered[Math.floor(Math.random() * Math.max(1, filtered.length))];
              if (pick) {
                const idx = filtered.findIndex((x) => x.id === pick.id);
                void playQueue(filtered, idx >= 0 ? idx : 0);
              }
            }}
            onRemix={() => remixFrom(spotlight)}
          />
        ) : null}

        <div className="pk-community-toolbar sticky top-0 z-20 rounded-2xl border border-white/10 bg-[#06060c]/88 px-4 py-3 backdrop-blur-xl">
          <div className="grid gap-3 md:grid-cols-12 md:items-end">
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
              <Dropdown label="Mood" value={mood} onChange={setMood} options={moods.map((m) => ({ value: m, label: m }))} />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2">
            <span className="mr-1 shrink-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">
              {isFr ? "Tri" : "Sort"}
            </span>
            <PrismFilterPill active={sort === "new"} onClick={() => setSort("new")}>
              {isFr ? "Nouveaux" : "Newest"}
            </PrismFilterPill>
            <PrismFilterPill active={sort === "top"} onClick={() => setSort("top")}>
              Top
            </PrismFilterPill>
            <PrismFilterPill active={sort === "random"} onClick={() => setSort("random")}>
              {isFr ? "Aléatoire" : "Random"}
            </PrismFilterPill>
            <Link to="/library" className="ml-auto text-xs font-semibold text-white/45 transition-colors hover:text-white/70">
              {isFr ? "Ma bibliothèque →" : "My library →"}
            </Link>
          </div>
        </div>

        {!loading && !hasActiveFilters ? (
          <div className="space-y-8">
            <CommunityRail
              title={isFr ? "Nouveautés" : "New releases"}
              icon={<Sparkles className="h-4 w-4 text-cyan-300" />}
              items={newestRail.slice(0, 10)}
              isFr={isFr}
              currentId={current?.id ?? null}
              isPlaying={isPlaying}
              resolvingId={resolvingId}
              ratingsById={ratingsById}
              isNew={isNew}
              onPlay={(_row, idx) => void playQueue(newestRail, idx)}
              onRemix={remixFrom}
              onRate={setRating}
              onSeeAll={() => {
                setSort("new");
                window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
              }}
            />
            <CommunityRail
              title={isFr ? "Les mieux notés" : "Top rated"}
              icon={<Trophy className="h-4 w-4 text-yellow-400" />}
              items={topRail.slice(0, 10)}
              isFr={isFr}
              currentId={current?.id ?? null}
              isPlaying={isPlaying}
              resolvingId={resolvingId}
              ratingsById={ratingsById}
              isNew={isNew}
              onPlay={(_row, idx) => void playQueue(topRail, idx)}
              onRemix={remixFrom}
              onRate={setRating}
              onSeeAll={() => {
                setSort("top");
                window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
              }}
            />
          </div>
        ) : null}

        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">{catalogTitle}</h2>
            {!loading ? <span className="text-xs font-medium text-white/40">{filtered.length}</span> : null}
          </div>

          {!loading && filtered.length === 0 ? (
            <div className="rounded-2xl pk-prism-card-soft p-8 text-center">
              <div className="text-sm font-semibold">{isFr ? "Aucune track à afficher" : "No tracks to show"}</div>
              <div className="mt-2 text-sm text-pk-muted">
                {fetchError ??
                  (isFr
                    ? "Génère un track public sur le Dashboard pour qu'il apparaisse ici."
                    : "Generate a public track on the Dashboard to show up here.")}
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

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 xl:gap-4">
            {loading ? (
              <>
                <div className="col-span-full flex justify-center py-8">
                  <PkIconLoader icon="community" size="md" label={isFr ? "Chargement…" : "Loading…"} />
                </div>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="rounded-2xl pk-prism-card-soft p-3 animate-pulse">
                    <div className="aspect-square rounded-2xl bg-white/5" />
                    <div className="mt-3 h-4 w-2/3 rounded bg-white/5" />
                  </div>
                ))}
              </>
            ) : (
              filtered.map((r) => (
                <CommunityTrackCard
                  key={r.id}
                  row={r}
                  isFr={isFr}
                  isActive={current?.id === r.id}
                  isPlaying={isPlaying}
                  resolving={resolvingId === r.id}
                  rating={ratingsById[r.id]}
                  isNew={r.created_at ? isNew(r.created_at) : false}
                  onPlay={() => void togglePlayFromFiltered(r)}
                  onRemix={() => remixFrom(r)}
                  onRate={(stars) => setRating(r.id, stars)}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
