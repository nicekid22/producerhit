import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Flame, Sparkles, Trophy, Waves } from "lucide-react";
import toast from "react-hot-toast";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { PkIconLoader } from "@/components/ui/PkIconLoader";
import { CommunityHubHero } from "@/components/community/CommunityHubHero";
import { CommunityRail } from "@/components/community/CommunityRail";
import { CommunityTrackCard } from "@/components/community/CommunityTrackCard";
import { CommunityVibeNav } from "@/components/community/CommunityVibeNav";
import {
  categoriesWithTracks,
  COMMUNITY_VIBE_CATEGORIES,
  pickSpotlight,
  sortByCommunityLove,
  tracksForCategory,
} from "@/lib/communityHub";
import {
  fetchCommunityPlayCounts,
  fetchPublicLoops,
  resolvePlayableCommunityAudio,
  sortPublicLoopsByNewest,
  type PublicLoopRow,
} from "@/lib/publicLoops";
import { savePendingRemix } from "@/lib/pendingRemix";
import { isRemixVibeRecreateEnabled } from "@/lib/remixVibeFallback";
import { fetchRemixSourceLoop } from "@/lib/remixSourceLoop";
import { supabase, trackClientEvent } from "@/lib/supabaseClient";
import { useLocaleStore } from "@/stores/localeStore";
import { useAuthStore } from "@/stores/authStore";
import {
  COMMUNITY_QUEUE_SOURCE,
  findPublicRowIndex,
  playPublicRowsInQueue,
} from "@/lib/communityPlaybackQueue";
import { usePlayerStore } from "@/stores/playerStore";

type RatingStats = { sum: number; count: number; myRating: number | null };

export default function Explore() {
  const navigate = useNavigate();
  const locale = useLocaleStore((s) => s.locale);
  const isFr = locale === "fr";
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<PublicLoopRow[]>([]);
  const [refetchToken, setRefetchToken] = useState(0);
  const [activeVibeId, setActiveVibeId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"new" | "top" | "random">("new");
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const current = usePlayerStore((s) => s.current);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const setPlaying = usePlayerStore((s) => s.setPlaying);
  const [ratingsById, setRatingsById] = useState<Record<string, RatingStats>>({});
  const [playsById, setPlaysById] = useState<Record<string, number>>({});

  const isNew = (createdAt: string) => Date.now() - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000;

  const remixFrom = (r: PublicLoopRow) => {
    trackClientEvent("community_remix_vibe_click", { loop_id: r.id });
    setResolvingId(r.id);
    void (async () => {
      try {
        let audioUrl = "";
        if (!isRemixVibeRecreateEnabled()) {
          audioUrl = await resolvePlayableCommunityAudio(r);
        }
        const sourceLoop = await fetchRemixSourceLoop(r.id);
        if (!sourceLoop && isRemixVibeRecreateEnabled()) {
          throw new Error("metadata");
        }
        savePendingRemix({
          sourceLoopId: r.id,
          sourceLoopName: (r.name || "Track").trim() || "Track",
          audioUrl,
          prompt: sourceLoop?.prompt || (r.prompt || "").trim(),
          genre: sourceLoop?.genre || r.genre || undefined,
          mood: sourceLoop?.mood || r.mood || undefined,
          bpm: sourceLoop?.bpm && sourceLoop.bpm > 0 ? sourceLoop.bpm : typeof r.bpm === "number" ? r.bpm : undefined,
          source: "community",
          sourceLoop: sourceLoop ?? undefined,
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
    const cacheKey = "producerhit_community_cache_v9";
    let loadedFromCache = false;
    try {
      const raw = window.sessionStorage.getItem(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { ts?: unknown; rows?: unknown };
        const ts = typeof parsed?.ts === "number" ? parsed.ts : 0;
        const cached = Array.isArray(parsed?.rows) ? (parsed.rows as unknown[]) : [];
        if (Date.now() - ts < 10 * 60 * 1000 && cached.length) {
          setRows(cached as PublicLoopRow[]);
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
        const mapped = await fetchPublicLoops({ limit: 48, timeoutMs: 12000, playableOnly: true });
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
                ? "Impossible de charger le flux."
                : "Failed to load the feed.";
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
    const ids = rows.slice(0, 40).map((r) => r.id).filter(Boolean);
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

  useEffect(() => {
    let cancelled = false;
    const ids = rows.map((r) => r.id).filter(Boolean);
    if (!ids.length) {
      setPlaysById({});
      return;
    }
    void (async () => {
      const counts = await fetchCommunityPlayCounts(ids);
      if (!cancelled) setPlaysById(counts);
    })();
    return () => {
      cancelled = true;
    };
  }, [rows]);

  const vibeNavItems = useMemo(() => {
    return COMMUNITY_VIBE_CATEGORIES.map((category) => ({
      category,
      count: tracksForCategory(rows, category).length,
    })).filter((x) => x.count > 0);
  }, [rows]);

  const activeCategory = useMemo(
    () => COMMUNITY_VIBE_CATEGORIES.find((c) => c.id === activeVibeId) ?? null,
    [activeVibeId],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let base = rows;
    if (activeCategory) base = tracksForCategory(base, activeCategory);

    base = base.filter((r) => {
      if (!q) return true;
      const hay = `${r.name ?? ""} ${r.genre ?? ""} ${r.mood ?? ""} ${r.prompt ?? ""} ${r.author?.username ?? ""}`.toLowerCase();
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

    if (sort === "top") return sortByCommunityLove(base, ratingsById, playsById);
    return sortPublicLoopsByNewest(base);
  }, [activeCategory, playsById, query, ratingsById, rows, sort]);

  const newestRail = useMemo(() => sortPublicLoopsByNewest(rows).slice(0, 12), [rows]);
  const topRail = useMemo(
    () => sortByCommunityLove(rows, ratingsById, playsById).slice(0, 12),
    [playsById, ratingsById, rows],
  );
  const myTracks = useMemo(() => {
    if (!user?.id) return [];
    return sortPublicLoopsByNewest(rows.filter((r) => r.user_id === user.id));
  }, [rows, user?.id]);

  const myTracksRail = useMemo(() => myTracks.slice(0, 10), [myTracks]);
  const newestRailItems = useMemo(() => newestRail.slice(0, 10), [newestRail]);
  const topRailItems = useMemo(() => topRail.slice(0, 10), [topRail]);

  const spotlight = useMemo(() => pickSpotlight(rows, ratingsById, playsById), [playsById, ratingsById, rows]);
  const spotlightQueue = useMemo(() => {
    if (!spotlight) return newestRailItems;
    return [spotlight, ...newestRailItems.filter((r) => r.id !== spotlight.id)];
  }, [newestRailItems, spotlight]);
  const categorySections = useMemo(() => categoriesWithTracks(rows), [rows]);

  const hasActiveFilters = query.trim().length > 0 || activeVibeId !== null || sort !== "new";
  const catalogTitle = activeCategory
    ? isFr
      ? activeCategory.title.fr
      : activeCategory.title.en
    : sort === "top"
      ? isFr
        ? "Top du flux"
        : "Feed top picks"
      : sort === "random"
        ? isFr
          ? "Sélection aléatoire"
          : "Random picks"
        : hasActiveFilters
          ? isFr
            ? `${filtered.length} résultat${filtered.length > 1 ? "s" : ""}`
            : `${filtered.length} result${filtered.length === 1 ? "" : "s"}`
          : isFr
            ? "Tout le catalogue"
            : "Full catalog";

  const queuePlayOptions = {
    source: COMMUNITY_QUEUE_SOURCE,
    onResolveStart: (rowId: string) => setResolvingId(rowId),
    onResolveEnd: () => setResolvingId(null),
    onRowUrlResolved: (rowId: string, url: string) => {
      setRows((prev) =>
        prev.map((x) => (x.id === rowId && !x.audio_url?.trim() ? { ...x, audio_url: url } : x)),
      );
    },
  };

  const playQueue = async (list: PublicLoopRow[], startIndex: number) => {
    const startRow = list[startIndex] ?? list[0] ?? null;
    if (!startRow) return;

    const ok = await playPublicRowsInQueue(list, startIndex, queuePlayOptions);
    if (!ok) {
      toast.error(isFr ? "Audio indisponible" : "Audio unavailable");
      return;
    }
    trackClientEvent("community_play", { loop_id: startRow.id, source: "queue" });
  };

  const togglePlayInList = async (r: PublicLoopRow, list: PublicLoopRow[]) => {
    if (current?.id === r.id) {
      setPlaying(!isPlaying);
      return;
    }
    const idx = findPublicRowIndex(list, r.id);
    await playQueue(list, idx >= 0 ? idx : 0);
  };

  const togglePlayFromFiltered = async (r: PublicLoopRow) => {
    await togglePlayInList(r, filtered);
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

  const shufflePlay = () => {
    const pool = filtered.length ? filtered : rows;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (!pick) return;
    const idx = pool.findIndex((x) => x.id === pick.id);
    void playQueue(pool, idx >= 0 ? idx : 0);
  };

  const isMineRow = (r: PublicLoopRow) => Boolean(user?.id && r.user_id === user.id);

  const railProps = {
    isFr,
    currentId: current?.id ?? null,
    isPlaying,
    resolvingId,
    ratingsById,
    isNew,
    isMineRow,
    onRemix: remixFrom,
    onRate: setRating,
  };

  return (
    <AppShell theme="prism" variant="single">
      <div className="pk-community pk-hub mx-auto w-full max-w-[1320px] space-y-6 px-4 pb-4 pt-4 md:px-6 md:pb-10 md:pt-5">
        <CommunityHubHero
          isFr={isFr}
          liveCount={rows.length}
          loading={loading}
          spotlight={spotlight}
          topCategories={vibeNavItems}
          isActive={spotlight ? current?.id === spotlight.id : false}
          isPlaying={isPlaying}
          resolving={spotlight ? resolvingId === spotlight.id : false}
          onPlay={() => spotlight && void playQueue(spotlightQueue, 0)}
          onShuffle={shufflePlay}
          onRemix={() => spotlight && remixFrom(spotlight)}
          onCreate={() => navigate("/dashboard")}
        />

        <CommunityVibeNav
          isFr={isFr}
          categories={vibeNavItems}
          activeVibeId={activeVibeId}
          query={query}
          sort={sort}
          onVibeChange={setActiveVibeId}
          onQueryChange={setQuery}
          onSortChange={setSort}
        />

        {!loading && !hasActiveFilters ? (
          <div className="space-y-9">
            {myTracks.length > 0 ? (
              <CommunityRail
                title={isFr ? "Tes créations sur le flux" : "Your tracks on the feed"}
                icon={<Flame className="h-4 w-4 text-orange-400" />}
                items={myTracksRail}
                {...railProps}
                onPlay={(_row, idx) => void playQueue(myTracksRail, idx)}
              />
            ) : null}

            <CommunityRail
              title={isFr ? "Fraîchement sortis" : "Fresh drops"}
              icon={<Sparkles className="h-4 w-4 text-cyan-300" />}
              items={newestRailItems}
              {...railProps}
              onPlay={(_row, idx) => void playQueue(newestRailItems, idx)}
              onSeeAll={() => {
                setSort("new");
                setActiveVibeId(null);
                document.getElementById("hub-catalog")?.scrollIntoView({ behavior: "smooth" });
              }}
            />

            <CommunityRail
              title={isFr ? "Les plus kiffés" : "Most loved"}
              icon={<Trophy className="h-4 w-4 text-yellow-400" />}
              items={topRailItems}
              {...railProps}
              onPlay={(_row, idx) => void playQueue(topRailItems, idx)}
              onSeeAll={() => {
                setSort("top");
                setActiveVibeId(null);
                document.getElementById("hub-catalog")?.scrollIntoView({ behavior: "smooth" });
              }}
            />

            {categorySections.map(({ category, tracks }) => {
              const rail = sortByCommunityLove(tracks, ratingsById, playsById).slice(0, 10);
              if (!rail.length) return null;
              return (
                <CommunityRail
                  key={category.id}
                  title={isFr ? category.title.fr : category.title.en}
                  icon={<Waves className="h-4 w-4 text-violet-300" />}
                  items={rail}
                  {...railProps}
                  onPlay={(_row, idx) => void playQueue(rail, idx)}
                  onSeeAll={() => {
                    setActiveVibeId(category.id);
                    setSort("top");
                    document.getElementById("hub-catalog")?.scrollIntoView({ behavior: "smooth" });
                  }}
                />
              );
            })}
          </div>
        ) : null}

        <section id="hub-catalog">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">{catalogTitle}</h2>
              {activeCategory ? (
                <p className="mt-1 text-xs text-white/45">{isFr ? activeCategory.subtitle.fr : activeCategory.subtitle.en}</p>
              ) : null}
            </div>
            {!loading ? <span className="text-xs font-medium text-white/40">{filtered.length}</span> : null}
          </div>

          {!loading && filtered.length === 0 ? (
            <div className="rounded-2xl pk-prism-card-soft p-8 text-center">
              <div className="text-sm font-semibold">{isFr ? "Rien ici pour l’instant" : "Nothing here yet"}</div>
              <div className="mt-2 text-sm text-pk-muted">
                {fetchError ??
                  (isFr
                    ? "Aucune track avec audio public dans cette vibe. Essaie une autre catégorie ou crée le premier son."
                    : "No public playable tracks in this vibe. Try another category or create the first one.")}
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
              filtered.map((r, idx) => (
                <CommunityTrackCard
                  key={r.id}
                  row={r}
                  isFr={isFr}
                  isActive={current?.id === r.id}
                  isPlaying={isPlaying}
                  resolving={resolvingId === r.id}
                  rating={ratingsById[r.id]}
                  isNew={r.created_at ? isNew(r.created_at) : false}
                  isMine={isMineRow(r)}
                  onPlay={() => void togglePlayFromFiltered(r)}
                  onRemix={() => remixFrom(r)}
                  onRate={(stars) => setRating(r.id, stars)}
                  slotIndex={idx}
                />
              ))
            )}
          </div>
        </section>

        <div className="flex justify-center pb-2">
          <Link to="/library" className="text-xs font-semibold text-white/40 transition-colors hover:text-cyan-300/90">
            {isFr ? "Ma bibliothèque privée →" : "My private library →"}
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
