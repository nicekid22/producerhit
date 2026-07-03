import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Flame, Compass, Sparkles, Trophy, Waves } from "lucide-react";
import toast from "react-hot-toast";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { PkIconLoader } from "@/components/ui/PkIconLoader";
import { CommunityHubHero } from "@/components/community/CommunityHubHero";
import { CommunityRail } from "@/components/community/CommunityRail";
import { CommunityTrackSheet } from "@/components/community/CommunityTrackSheet";
import { CommunityTrackCard } from "@/components/community/CommunityTrackCard";
import { VirtualizedGrid } from "@/components/perf/VirtualizedGrid";
import { CommunityVibeNav } from "@/components/community/CommunityVibeNav";
import {
  buildCategoryRailPlans,
  buildDiscoverRailItems,
  CATEGORY_RAIL_SORT,
  COMMUNITY_VIBE_CATEGORIES,
  pickSpotlight,
  sortByCommunityLove,
  sortCommunityRail,
  takeUniqueRailItems,
  tracksForCategory,
  type CommunityRailSort,
} from "@/lib/communityHub";
import { buildCommunityPulse, countNewToday } from "@/lib/communityPulse";
import { CommunityLiveChatStrip } from "@/components/community/CommunityLiveChatStrip";
import { CommunityPulseStrip } from "@/components/community/CommunityPulseStrip";
import { CommunitySeoFooter } from "@/components/community/CommunitySeoFooter";
import {
  applyCommunityPageSeo,
  buildCommunityItemListSchema,
  buildCommunityVibeSeo,
  communityVibePath,
  isValidCommunityVibeId,
} from "@/lib/communitySeo";
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
import { fetchLoopCommentCounts, fetchRecentFluxComments, type FluxCommentPreview } from "@/lib/loopComments";
import { supabase, trackClientEvent } from "@/lib/supabaseClient";
import { useLocaleStore } from "@/stores/localeStore";
import { useAuthStore } from "@/stores/authStore";
import { CheckoutRecoveryBanner } from "@/components/billing/CheckoutRecoveryBanner";
import { FreeUpgradeStrip } from "@/components/billing/FreeUpgradeStrip";
import { useResolvedPlan } from "@/hooks/useResolvedPlan";
import {
  COMMUNITY_QUEUE_SOURCE,
  findPublicRowIndex,
  playPublicRowsInQueue,
} from "@/lib/communityPlaybackQueue";
import { usePlayerStore } from "@/stores/playerStore";
import { markActivationStepLocal } from "@/lib/onboardingProgress";
import { buildCommunityHubUiCopy } from "@/i18n/communityHubUiCatalog";
import { buildPublicLoopPageCopy } from "@/i18n/publicLoopPageCatalog";

type RatingStats = { sum: number; count: number; myRating: number | null };

export default function Explore() {
  const navigate = useNavigate();
  const { vibeId: vibeIdParam } = useParams<{ vibeId?: string }>();
  const locale = useLocaleStore((s) => s.locale);
  const hubCopy = useMemo(() => buildCommunityHubUiCopy(locale), [locale]);
  const loopCopy = useMemo(() => buildPublicLoopPageCopy(locale), [locale]);
  const user = useAuthStore((s) => s.user);
  const { plan: userPlan, ready: planReady, bannersReady } = useResolvedPlan();
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
  const [commentsById, setCommentsById] = useState<Record<string, number>>({});
  const [playsById, setPlaysById] = useState<Record<string, number>>({});
  const [sheetTrack, setSheetTrack] = useState<PublicLoopRow | null>(null);
  const [sheetFocusComments, setSheetFocusComments] = useState(false);
  const [fluxComments, setFluxComments] = useState<FluxCommentPreview[]>([]);
  const [fluxCommentsLoading, setFluxCommentsLoading] = useState(true);

  useEffect(() => {
    if (vibeIdParam && !isValidCommunityVibeId(vibeIdParam)) {
      navigate("/community", { replace: true });
      return;
    }
    setActiveVibeId(vibeIdParam ?? null);
  }, [navigate, vibeIdParam]);

  useEffect(() => {
    markActivationStepLocal("community_visit");
  }, []);

  const hubShuffleSeed = useMemo(() => {
    const key = "producerhit_community_shuffle_v1";
    try {
      let seed = window.sessionStorage.getItem(key);
      if (!seed) {
        seed = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        window.sessionStorage.setItem(key, seed);
      }
      return seed;
    } catch {
      return "community";
    }
  }, []);

  const sortCtx = useMemo(
    () => ({ ratingsById, playsById, commentsById }),
    [commentsById, playsById, ratingsById],
  );

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
        toast.error(loopCopy.audioUnavailableRemix);
      } finally {
        setResolvingId(null);
      }
    })();
  };

  useEffect(() => {
    let cancelled = false;
    const cacheKey = "producerhit_community_cache_v10";
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
        const mapped = await fetchPublicLoops({ limit: 48, timeoutMs: 12000 });
        if (cancelled) return;
        setRows(mapped);
        try {
          window.sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), rows: mapped }));
        } catch {
          // ignore
        }
      } catch (err) {
        if (!cancelled) {
          if (!loadedFromCache && !rows.length) {
            setRows([]);
          }
          const msg =
            err instanceof Error && err.message === "timeout"
              ? hubCopy.loadTimeout
              : hubCopy.loadFailed;
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
  }, [hubCopy.loadFailed, hubCopy.loadTimeout, refetchToken]);

  useEffect(() => {
    const refresh = () => setRefetchToken((x) => x + 1);
    const interval = window.setInterval(refresh, 5 * 60 * 1000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const ids = rows.map((r) => r.id).filter(Boolean).slice(0, 150);
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
    const ids = rows.map((r) => r.id).filter(Boolean).slice(0, 150);
    if (!ids.length) {
      setCommentsById({});
      return;
    }
    void (async () => {
      const counts = await fetchLoopCommentCounts(ids);
      if (!cancelled) setCommentsById(counts);
    })();
    return () => {
      cancelled = true;
    };
  }, [rows]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setFluxCommentsLoading(true);
      const recent = await fetchRecentFluxComments(14);
      if (!cancelled) {
        setFluxComments(recent);
        setFluxCommentsLoading(false);
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 45000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [rows.length, refetchToken]);

  const rowsById = useMemo(() => {
    const map: Record<string, PublicLoopRow> = {};
    for (const row of rows) map[row.id] = row;
    return map;
  }, [rows]);

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
      count: tracksForCategory(rows, category, true).length,
    })).filter((x) => x.count > 0);
  }, [rows]);

  const activeCategory = useMemo(
    () => COMMUNITY_VIBE_CATEGORIES.find((c) => c.id === activeVibeId) ?? null,
    [activeVibeId],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let base = rows;
    if (activeCategory) base = tracksForCategory(base, activeCategory, true);

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
    if (activeCategory) {
      const catSort: CommunityRailSort = CATEGORY_RAIL_SORT[activeCategory.id] ?? "love";
      if (catSort === "newest") return sortPublicLoopsByNewest(base);
      if (catSort !== "love") {
        return sortCommunityRail(base, catSort, sortCtx, hubShuffleSeed);
      }
    }
    return sortPublicLoopsByNewest(base);
  }, [activeCategory, hubShuffleSeed, playsById, query, ratingsById, rows, sort, sortCtx]);

  const myTracks = useMemo(() => {
    if (!user?.id) return [];
    return sortPublicLoopsByNewest(rows.filter((r) => r.user_id === user.id));
  }, [rows, user?.id]);

  const myTracksRail = useMemo(() => myTracks.slice(0, 10), [myTracks]);

  const { newestRailItems, topRailItems, discoverRailItems, categoryRailPlans } = useMemo(() => {
    const usedIds = new Set<string>();
    const newest = takeUniqueRailItems(sortPublicLoopsByNewest(rows), 10, usedIds);
    const top = takeUniqueRailItems(sortByCommunityLove(rows, ratingsById, playsById), 10, usedIds);
    const discoverRailItems = buildDiscoverRailItems(rows, sortCtx, {
      limit: 10,
      shuffleSeed: hubShuffleSeed,
      usedIds,
    });
    const categoryRailPlans = buildCategoryRailPlans(rows, sortCtx, {
      limit: 10,
      shuffleSeed: hubShuffleSeed,
      usedIds,
    });
    return { newestRailItems: newest, topRailItems: top, discoverRailItems, categoryRailPlans };
  }, [hubShuffleSeed, playsById, ratingsById, rows, sortCtx]);

  const pulseItems = useMemo(
    () => buildCommunityPulse({ rows, commentsById, ratingsById }),
    [commentsById, ratingsById, rows],
  );
  const newTodayCount = useMemo(() => countNewToday(rows), [rows]);
  const totalComments = useMemo(
    () => Object.values(commentsById).reduce((sum, n) => sum + n, 0),
    [commentsById],
  );

  const spotlight = useMemo(() => pickSpotlight(rows, ratingsById, playsById), [playsById, ratingsById, rows]);
  const spotlightQueue = useMemo(() => {
    if (!spotlight) return newestRailItems;
    return [spotlight, ...newestRailItems.filter((r) => r.id !== spotlight.id)];
  }, [newestRailItems, spotlight]);
  useEffect(() => {
    if (!activeCategory) return;
    const seo = buildCommunityVibeSeo({
      vibe: activeCategory,
      locale,
      trackCount: filtered.length,
    });
    applyCommunityPageSeo({
      title: seo.titleMeta,
      description: seo.description,
      keywords: seo.keywords,
      pageUrl: seo.pageUrl,
      jsonLd: buildCommunityItemListSchema({
        pageUrl: seo.pageUrl,
        listName: `${seo.title} — ProducerHit`,
        items: filtered.slice(0, 12),
      }),
    });
  }, [activeCategory, filtered, locale]);

  const handleVibeChange = (id: string | null) => {
    setActiveVibeId(id);
    navigate(id ? communityVibePath(id) : "/community");
  };

  const hasActiveFilters = query.trim().length > 0 || activeVibeId !== null || sort !== "new";
  const catalogTitle = hubCopy.catalogTitle({
    activeCategory,
    sort,
    hasActiveFilters,
    count: filtered.length,
  });

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
      toast.error(loopCopy.audioUnavailable);
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
      toast(loopCopy.loginToRate);
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
        toast.error(loopCopy.couldNotRate);
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

  const openTrackSheet = (row: PublicLoopRow, focusComments = false) => {
    setSheetTrack(row);
    setSheetFocusComments(focusComments);
  };

  const scrollToLiveChat = () => {
    document.getElementById("flux-live-chat")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    if (loading || window.location.hash !== "#flux-live-chat") return;
    const timer = window.setTimeout(scrollToLiveChat, 280);
    return () => window.clearTimeout(timer);
  }, [loading]);

  const railProps = {
    locale,
    currentId: current?.id ?? null,
    isPlaying,
    resolvingId,
    ratingsById,
    commentsById,
    isNew,
    isMineRow,
    onRemix: remixFrom,
    onRate: setRating,
    onOpenDetail: openTrackSheet,
  };

  const renderExploreCard = useCallback(
    (r: PublicLoopRow, idx: number) => (
      <CommunityTrackCard
        row={r}
        locale={locale}
        isActive={current?.id === r.id}
        isPlaying={isPlaying}
        resolving={resolvingId === r.id}
        rating={ratingsById[r.id]}
        commentCount={commentsById[r.id] ?? 0}
        isNew={r.created_at ? isNew(r.created_at) : false}
        isMine={isMineRow(r)}
        onPlay={() => void togglePlayFromFiltered(r)}
        onRemix={() => remixFrom(r)}
        onRate={(stars) => setRating(r.id, stars)}
        onOpenDetail={(focusComments) => openTrackSheet(r, focusComments)}
        slotIndex={idx}
      />
    ),
    [
      commentsById,
      current?.id,
      isPlaying,
      locale,
      ratingsById,
      resolvingId,
      remixFrom,
      setRating,
      togglePlayFromFiltered,
    ],
  );

  return (
    <AppShell theme="prism" variant="single">
      <div className="pk-community pk-hub mx-auto w-full max-w-[1320px] space-y-6 px-4 pb-4 pt-4 md:px-6 md:pb-10 md:pt-5">
        {user ? (
          <>
            <CheckoutRecoveryBanner
              locale={locale}
              location="community"
              currentPlan={bannersReady ? userPlan : undefined}
              planReady={bannersReady}
            />
            {bannersReady && userPlan === "free" ? (
              <FreeUpgradeStrip
                locale={locale}
                location="community_strip"
                plan={userPlan}
                ready={bannersReady}
              />
            ) : null}
          </>
        ) : (
          <CheckoutRecoveryBanner locale={locale} location="community_anon" />
        )}
        <CommunityHubHero
          locale={locale}
          liveCount={rows.length}
          newTodayCount={newTodayCount}
          totalComments={totalComments}
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
          onJoinChat={scrollToLiveChat}
        />

        <CommunityPulseStrip items={pulseItems} locale={locale} />

        <CommunityLiveChatStrip
          locale={locale}
          comments={fluxComments}
          loading={fluxCommentsLoading}
          rowsById={rowsById}
          onOpenTrack={openTrackSheet}
        />

        <CommunityVibeNav
          locale={locale}
          categories={vibeNavItems}
          activeVibeId={activeVibeId}
          query={query}
          sort={sort}
          onVibeChange={handleVibeChange}
          onQueryChange={setQuery}
          onSortChange={setSort}
        />

        {!loading && !hasActiveFilters ? (
          <div className="space-y-9">
            {myTracks.length > 0 ? (
              <CommunityRail
                title={hubCopy.myTracksRail}
                icon={<Flame className="h-4 w-4 text-orange-400" />}
                items={myTracksRail}
                {...railProps}
                onPlay={(_row, idx) => void playQueue(myTracksRail, idx)}
              />
            ) : null}

            <CommunityRail
              title={hubCopy.freshDrops}
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
              title={hubCopy.mostLoved}
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

            {discoverRailItems.length > 0 ? (
              <CommunityRail
                title={hubCopy.discoveries}
                subtitle={hubCopy.discoveriesSub}
                icon={<Compass className="h-4 w-4 text-emerald-300" />}
                items={discoverRailItems}
                {...railProps}
                onPlay={(_row, idx) => void playQueue(discoverRailItems, idx)}
                onSeeAll={() => {
                  setActiveVibeId(null);
                  setSort("random");
                  document.getElementById("hub-catalog")?.scrollIntoView({ behavior: "smooth" });
                }}
              />
            ) : null}

            {categoryRailPlans.map(({ category, sort, tracks: rail }) => (
              <CommunityRail
                key={category.id}
                title={hubCopy.categoryTitle(category)}
                subtitle={hubCopy.categoryRailSubtitle(sort)}
                icon={<Waves className="h-4 w-4 text-violet-300" />}
                items={rail}
                {...railProps}
                onPlay={(_row, idx) => void playQueue(rail, idx)}
                onSeeAll={() => {
                  setActiveVibeId(category.id);
                  setSort(sort === "newest" ? "new" : sort === "shuffle" ? "random" : "top");
                  document.getElementById("hub-catalog")?.scrollIntoView({ behavior: "smooth" });
                }}
              />
            ))}
          </div>
        ) : null}

        <section id="hub-catalog">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">{catalogTitle}</h2>
              {activeCategory ? (
                <p className="mt-1 text-xs text-white/45">{hubCopy.categorySubtitle(activeCategory)}</p>
              ) : null}
            </div>
            {!loading ? <span className="text-xs font-medium text-white/40">{filtered.length}</span> : null}
          </div>

          {!loading && filtered.length === 0 ? (
            <div className="rounded-2xl pk-prism-card-soft p-8 text-center">
              <div className="text-sm font-semibold">{hubCopy.nothingHere}</div>
              <div className="mt-2 text-sm text-pk-muted">
                {fetchError ?? hubCopy.emptyVibe}
              </div>
              <div className="mt-4 flex justify-center gap-2">
                <Button variant="secondary" onClick={() => setRefetchToken((x) => x + 1)}>
                  {hubCopy.retry}
                </Button>
                <Link to="/dashboard">
                  <Button variant="primary">{hubCopy.createTrack}</Button>
                </Link>
              </div>
            </div>
          ) : null}

          {loading ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 xl:gap-4">
              <div className="col-span-full flex justify-center py-8">
                <PkIconLoader icon="community" size="md" label={hubCopy.loading} />
              </div>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl pk-prism-card-soft p-3 animate-pulse">
                  <div className="aspect-square rounded-2xl bg-white/5" />
                  <div className="mt-3 h-4 w-2/3 rounded bg-white/5" />
                </div>
              ))}
            </div>
          ) : (
            <VirtualizedGrid
              items={filtered}
              getKey={(r) => r.id}
              renderItem={(r, idx) => renderExploreCard(r, idx)}
              estimateRowHeight={320}
              virtualizeThreshold={20}
            />
          )}
        </section>

        <CommunitySeoFooter
          locale={locale}
          variant={activeCategory ? "vibe" : "hub"}
          vibeTitle={activeCategory ? hubCopy.categoryTitle(activeCategory) : undefined}
        />

        <div className="flex justify-center pb-2">
          <Link to="/library" className="pk-accent-link text-xs font-semibold">
            {hubCopy.privateLibrary}
          </Link>
        </div>
      </div>

      <CommunityTrackSheet
        open={Boolean(sheetTrack)}
        onClose={() => {
          setSheetTrack(null);
          setSheetFocusComments(false);
        }}
        row={sheetTrack}
        locale={locale}
        isActive={sheetTrack ? current?.id === sheetTrack.id : false}
        isPlaying={isPlaying}
        resolving={sheetTrack ? resolvingId === sheetTrack.id : false}
        rating={sheetTrack ? ratingsById[sheetTrack.id] : undefined}
        commentCount={sheetTrack ? (commentsById[sheetTrack.id] ?? 0) : 0}
        userId={user?.id ?? null}
        focusComments={sheetFocusComments}
        onPlay={() => sheetTrack && void togglePlayFromFiltered(sheetTrack)}
        onRemix={() => sheetTrack && remixFrom(sheetTrack)}
        onRate={(stars) => sheetTrack && setRating(sheetTrack.id, stars)}
        onCommentCountChange={(count) => {
          if (!sheetTrack) return;
          setCommentsById((prev) => ({ ...prev, [sheetTrack.id]: count }));
        }}
      />
    </AppShell>
  );
}
