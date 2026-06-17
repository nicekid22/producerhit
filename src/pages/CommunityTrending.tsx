import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Flame, Sparkles, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";
import { AppShell } from "@/components/AppShell";
import { CommunityRail } from "@/components/community/CommunityRail";
import { CommunitySeoFooter } from "@/components/community/CommunitySeoFooter";
import { CommunityTrackSheet } from "@/components/community/CommunityTrackSheet";
import { CommunityTrackCard } from "@/components/community/CommunityTrackCard";
import { PkIconLoader } from "@/components/ui/PkIconLoader";
import { sortByCommunityLove } from "@/lib/communityHub";
import {
  applyCommunityPageSeo,
  buildCommunityItemListSchema,
  buildTrendingSeo,
} from "@/lib/communitySeo";
import {
  fetchCommunityPlayCounts,
  fetchPublicLoops,
  resolvePlayableCommunityAudio,
  type PublicLoopRow,
} from "@/lib/publicLoops";
import { fetchLoopCommentCounts } from "@/lib/loopComments";
import { savePendingRemix } from "@/lib/pendingRemix";
import { isRemixVibeRecreateEnabled } from "@/lib/remixVibeFallback";
import { fetchRemixSourceLoop } from "@/lib/remixSourceLoop";
import { supabase } from "@/lib/supabaseClient";
import { useLocaleStore } from "@/stores/localeStore";
import { useAuthStore } from "@/stores/authStore";
import {
  COMMUNITY_QUEUE_SOURCE,
  findPublicRowIndex,
  playPublicRowsInQueue,
} from "@/lib/communityPlaybackQueue";
import { usePlayerStore } from "@/stores/playerStore";

type RatingStats = { sum: number; count: number; myRating: number | null };

export default function CommunityTrending() {
  const navigate = useNavigate();
  const locale = useLocaleStore((s) => s.locale);
  const isFr = locale === "fr";
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<PublicLoopRow[]>([]);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [ratingsById, setRatingsById] = useState<Record<string, RatingStats>>({});
  const [commentsById, setCommentsById] = useState<Record<string, number>>({});
  const [playsById, setPlaysById] = useState<Record<string, number>>({});
  const [sheetTrack, setSheetTrack] = useState<PublicLoopRow | null>(null);
  const [sheetFocusComments, setSheetFocusComments] = useState(false);
  const current = usePlayerStore((s) => s.current);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const seo = useMemo(() => buildTrendingSeo(isFr), [isFr]);

  const trending = useMemo(
    () => sortByCommunityLove(rows, ratingsById, playsById).slice(0, 24),
    [playsById, ratingsById, rows],
  );

  const hotComments = useMemo(() => {
    return rows
      .slice()
      .sort((a, b) => (commentsById[b.id] ?? 0) - (commentsById[a.id] ?? 0))
      .slice(0, 12);
  }, [commentsById, rows]);

  useEffect(() => {
    applyCommunityPageSeo({
      title: seo.titleMeta,
      description: seo.description,
      keywords: seo.keywords,
      pageUrl: seo.pageUrl,
      jsonLd: buildCommunityItemListSchema({
        pageUrl: seo.pageUrl,
        listName: isFr ? "Beats IA trending ProducerHit" : "ProducerHit trending AI beats",
        items: trending,
      }),
    });
  }, [isFr, seo, trending]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const pool = await fetchPublicLoops({ limit: 80, playableOnly: true, timeoutMs: 14000 });
        if (cancelled) return;
        setRows(pool);
        const ids = pool.map((r) => r.id);
        const [plays, comments] = await Promise.all([
          fetchCommunityPlayCounts(ids),
          fetchLoopCommentCounts(ids),
        ]);
        if (cancelled) return;
        setPlaysById(plays);
        setCommentsById(comments);
        const { data: ratingRows } = await supabase.from("loop_ratings").select("loop_id,rating,user_id").in("loop_id", ids);
        if (cancelled) return;
        const byId: Record<string, RatingStats> = {};
        for (const r of ratingRows ?? []) {
          const row = r as { loop_id: string; rating: number; user_id: string };
          if (!byId[row.loop_id]) byId[row.loop_id] = { sum: 0, count: 0, myRating: null };
          byId[row.loop_id].sum += row.rating;
          byId[row.loop_id].count += 1;
          if (user?.id === row.user_id) byId[row.loop_id].myRating = row.rating;
        }
        setRatingsById(byId);
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const playQueue = async (list: PublicLoopRow[], startIdx: number) => {
    const ok = await playPublicRowsInQueue(list, startIdx, {
      source: COMMUNITY_QUEUE_SOURCE,
      onResolveStart: (id) => setResolvingId(id),
      onResolveEnd: () => setResolvingId(null),
    });
    if (!ok) setResolvingId(null);
  };

  const remixFrom = (r: PublicLoopRow) => {
    setResolvingId(r.id);
    void (async () => {
      try {
        let audioUrl = "";
        if (!isRemixVibeRecreateEnabled()) {
          audioUrl = await resolvePlayableCommunityAudio(r);
        }
        const sourceLoop = await fetchRemixSourceLoop(r.id);
        savePendingRemix({
          sourceLoopId: r.id,
          sourceLoopName: (r.name || "Track").trim(),
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

  const setRating = (loopId: string, r: number) => {
    if (!user) {
      toast(isFr ? "Connecte-toi pour noter" : "Login to rate");
      navigate("/auth");
      return;
    }
    void (async () => {
      const prev = ratingsById[loopId]?.myRating ?? null;
      const { error } = await supabase
        .from("loop_ratings")
        .upsert({ loop_id: loopId, user_id: user.id, rating: r }, { onConflict: "loop_id,user_id" });
      if (error) {
        toast.error(isFr ? "Impossible de noter" : "Could not rate");
        return;
      }
      setRatingsById((state) => {
        const curr = state[loopId] ?? { sum: 0, count: 0, myRating: null };
        return {
          ...state,
          [loopId]: { sum: curr.sum + (prev ? r - prev : r), count: curr.count + (prev ? 0 : 1), myRating: r },
        };
      });
    })();
  };

  const isNew = (createdAt: string) => Date.now() - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000;

  const openTrackSheet = (row: PublicLoopRow, focusComments = false) => {
    setSheetTrack(row);
    setSheetFocusComments(focusComments);
  };

  const togglePlayRow = (r: PublicLoopRow) => {
    if (current?.id === r.id) {
      usePlayerStore.getState().setPlaying(!isPlaying);
      return;
    }
    const i = findPublicRowIndex(trending, r.id);
    void playQueue(trending, i >= 0 ? i : 0);
  };

  const railProps = {
    isFr,
    currentId: current?.id ?? null,
    isPlaying,
    resolvingId,
    ratingsById,
    commentsById,
    isNew,
    isMineRow: (r: PublicLoopRow) => Boolean(user?.id && r.user_id === user.id),
    onRemix: remixFrom,
    onRate: setRating,
    onOpenDetail: openTrackSheet,
  };

  return (
    <AppShell theme="prism" variant="single">
      <div className="pk-community pk-hub mx-auto w-full max-w-[1320px] space-y-6 px-4 pb-4 pt-4 md:px-6 md:pb-10 md:pt-5">
        <header className="pk-hub-hero rounded-2xl border border-white/10 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="pk-hub-hero__live-pill">
              <span className="pk-hub-hero__live-dot" />
              {isFr ? "Mis à jour en live" : "Live updated"}
            </span>
            <span className="pk-hub-hero__stat-pill">
              <TrendingUp className="mr-1 inline h-3.5 w-3.5" />
              2026
            </span>
          </div>
          <h1 className="pk-hub-hero__title mt-3">
            <span className="pk-prism-holo-text">{isFr ? "Trending beats IA" : "Trending AI beats"}</span>
          </h1>
          <p className="pk-hub-hero__tagline mt-2 max-w-2xl text-sm leading-relaxed">
            {isFr
              ? "Les tracks les plus kiffées du flux communautaire — prêtes à remixer pour TikTok, Reels et type beats."
              : "Most-loved tracks from the community feed — ready to remix for TikTok, Reels, and type beats."}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/dashboard" className="pk-hub-hero__btn-primary inline-flex h-10 items-center rounded-full px-5 text-xs font-bold">
              {isFr ? "Remixer une vibe" : "Remix a vibe"}
            </Link>
            <Link to="/community" className="pk-hub-hero__btn-ghost inline-flex h-10 items-center rounded-full px-5 text-xs font-bold">
              {isFr ? "Tout le flux" : "Full feed"}
            </Link>
            <Link to={isFr ? "/remix-cover-ia" : "/remix-cover-ai"} className="pk-hub-hero__btn-ghost inline-flex h-10 items-center rounded-full px-5 text-xs font-bold">
              {isFr ? "Guide remix IA" : "AI remix guide"}
            </Link>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-16">
            <PkIconLoader icon="community" size="md" label={isFr ? "Chargement trending…" : "Loading trending…"} />
          </div>
        ) : (
          <>
            <CommunityRail
              title={isFr ? "🔥 Top kiffés du moment" : "🔥 Most loved right now"}
              icon={<Flame className="h-4 w-4 text-orange-400" />}
              items={trending.slice(0, 12)}
              {...railProps}
              onPlay={(_row, idx) => void playQueue(trending.slice(0, 12), idx)}
            />
            {hotComments.length > 0 ? (
              <CommunityRail
                title={isFr ? "💬 Buzz commentaires" : "💬 Comment buzz"}
                icon={<Sparkles className="h-4 w-4 text-cyan-300" />}
                items={hotComments}
                {...railProps}
                onPlay={(_row, idx) => void playQueue(hotComments, idx)}
              />
            ) : null}
            <section aria-labelledby="trending-grid-title">
              <h2 id="trending-grid-title" className="text-lg font-bold text-white">
                {isFr ? "Catalogue trending complet" : "Full trending catalog"}
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 xl:gap-4">
                {trending.map((r, idx) => (
                  <CommunityTrackCard
                    key={r.id}
                    row={r}
                    isFr={isFr}
                    isActive={current?.id === r.id}
                    isPlaying={isPlaying}
                    resolving={resolvingId === r.id}
                    rating={ratingsById[r.id]}
                    commentCount={commentsById[r.id] ?? 0}
                    isNew={r.created_at ? isNew(r.created_at) : false}
                    isMine={Boolean(user?.id && r.user_id === user.id)}
                    onPlay={() => {
                      const i = findPublicRowIndex(trending, r.id);
                      void playQueue(trending, i >= 0 ? i : 0);
                    }}
                    onRemix={() => remixFrom(r)}
                    onRate={(stars) => setRating(r.id, stars)}
                    onOpenDetail={(focusComments) => openTrackSheet(r, focusComments)}
                    slotIndex={idx}
                  />
                ))}
              </div>
            </section>
          </>
        )}

        <CommunitySeoFooter isFr={isFr} variant="trending" />
      </div>

      <CommunityTrackSheet
        open={Boolean(sheetTrack)}
        onClose={() => {
          setSheetTrack(null);
          setSheetFocusComments(false);
        }}
        row={sheetTrack}
        isFr={isFr}
        isActive={sheetTrack ? current?.id === sheetTrack.id : false}
        isPlaying={isPlaying}
        resolving={sheetTrack ? resolvingId === sheetTrack.id : false}
        rating={sheetTrack ? ratingsById[sheetTrack.id] : undefined}
        commentCount={sheetTrack ? (commentsById[sheetTrack.id] ?? 0) : 0}
        userId={user?.id ?? null}
        focusComments={sheetFocusComments}
        onPlay={() => sheetTrack && togglePlayRow(sheetTrack)}
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
