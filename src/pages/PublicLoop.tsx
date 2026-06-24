import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowRight, Loader2, Music2, Pause, Play, Share2, Sparkles, Star, Zap } from "lucide-react";
import { PkIconLoader } from "@/components/ui/PkIconLoader";
import toast from "react-hot-toast";
import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { Navbar } from "@/components/Navbar";
import { isPlayablePublicLoop, fetchPublicLoops, resolvePlayableCommunityAudio, type PublicLoopRow } from "@/lib/publicLoops";
import { unlockAudioPlaybackFromGesture } from "@/lib/audioPlaybackUnlock";
import { buildPublicLoopEnrichment } from "@/lib/publicLoopEnrichment";
import {
  findPublicRowIndex,
  playPublicRowsInQueue,
  PUBLIC_LOOP_QUEUE_SOURCE,
} from "@/lib/communityPlaybackQueue";
import { publicRowToCoverLoop, resolvePublicRowCoverUrl } from "@/lib/coverArt";
import { displayProducerInfluence } from "@/lib/beatInfluence";
import { fetchPublicProfileCards, type PublicProfileCard } from "@/lib/creatorProfile";
import { ProfileAuthorChip } from "@/components/profile/ProfileAuthorChip";
import { LoopCommentsSection } from "@/components/community/LoopCommentsSection";
import { ViralShareBar } from "@/components/growth/ViralShareBar";
import { savePendingRemix } from "@/lib/pendingRemix";
import { isRemixVibeRecreateEnabled } from "@/lib/remixVibeFallback";
import { loopToRemixSource } from "@/lib/remixSourceLoop";
import { setLoopPageSeo } from "@/lib/seoMeta";
import { getGenreSeoLink } from "@/lib/seoPages";
import { buildLoopShareUrl } from "@/lib/growthLinks";
import { COVER_SURFACE_CLASS, cn } from "@/lib/utils";
import { fetchLoopCommentCounts } from "@/lib/loopComments";
import { supabase } from "@/lib/supabaseClient";
import { useLocaleStore } from "@/stores/localeStore";
import { buildPublicLoopPageCopy } from "@/i18n/publicLoopPageCatalog";
import { useAuthStore } from "@/stores/authStore";
import { usePlayerStore } from "@/stores/playerStore";
import type { Loop } from "@/types/loop";

type LoopRow = {
  id: string;
  user_id: string;
  name: string;
  genre: string;
  influence: string;
  key: string;
  scale: string;
  bpm: number;
  loop_length: string;
  swing: number;
  mood: string;
  energy_level: string;
  reverb: string;
  prompt: string;
  audio_url: string | null;
  stems_url?: unknown;
  is_public: boolean;
  created_at: string;
  seed: number | null;
};

export default function PublicLoop() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const locale = useLocaleStore((s) => s.locale);
  const copy = useMemo(() => buildPublicLoopPageCopy(locale), [locale]);
  const user = useAuthStore((s) => s.user);
  const current = usePlayerStore((s) => s.current);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const setPlaying = usePlayerStore((s) => s.setPlaying);
  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState<LoopRow | null>(null);
  const [playbackQueue, setPlaybackQueue] = useState<PublicLoopRow[]>([]);
  const [ratingSum, setRatingSum] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [myRating, setMyRating] = useState<number | null>(null);
  const [commentCount, setCommentCount] = useState(0);
  const [savingRating, setSavingRating] = useState(false);
  const [resolvingAudio, setResolvingAudio] = useState(false);
  const [remixLoading, setRemixLoading] = useState(false);
  const [author, setAuthor] = useState<PublicProfileCard | null>(null);

  const shareUrl = useMemo(
    () => (id ? buildLoopShareUrl(id, "twitter") : "https://www.producerhit.com/community"),
    [id],
  );

  const coverLoop = useMemo(() => (row ? publicRowToCoverLoop(row) : null), [row]);
  const coverUrl = useMemo(() => (row ? resolvePublicRowCoverUrl(row, 1024) : ""), [row]);
  const genreSeo = useMemo(() => getGenreSeoLink(row?.genre, locale), [row?.genre, locale]);
  const producerInfluence = useMemo(() => displayProducerInfluence(row?.influence), [row?.influence]);
  const enrichment = useMemo(() => (row ? buildPublicLoopEnrichment(row, locale) : null), [row, locale]);
  const avgRating = ratingCount > 0 ? ratingSum / ratingCount : null;

  const fromShorts = useMemo(() => {
    const src = searchParams.get("utm_source")?.toLowerCase() ?? "";
    const med = searchParams.get("utm_medium")?.toLowerCase() ?? "";
    return src === "youtube" || src === "tiktok" || med === "shorts" || med === "social";
  }, [searchParams]);

  const createCtaHref = useMemo(() => {
    const q = new URLSearchParams(searchParams);
    q.set("utm_source", searchParams.get("utm_source") ?? "shorts");
    q.set("utm_medium", "loop_cta");
    q.set("utm_campaign", searchParams.get("utm_campaign") ?? "viral");
    if (id) q.set("utm_content", id.slice(0, 8));
    return `/auth?${q.toString()}`;
  }, [id, searchParams]);

  useEffect(() => {
    if (!row || !id) return;
    setLoopPageSeo({
      id,
      name: row.name,
      genre: row.genre,
      mood: row.mood,
      bpm: row.bpm,
      prompt: row.prompt,
      createdAt: row.created_at,
      audioUrl: isPlayablePublicLoop(row.audio_url, row.stems_url) ? row.audio_url : null,
      coverImageUrl: coverUrl,
      authorName: author?.username ?? null,
      ratingValue: avgRating,
      ratingCount,
      locale,
      seoDescription: enrichment?.aboutParagraph,
      lyricsSnippet: enrichment?.lyrics ?? null,
    });
  }, [author?.username, avgRating, coverUrl, enrichment?.aboutParagraph, enrichment?.lyrics, id, locale, ratingCount, row]);

  const toLoop = (r: LoopRow): Loop => {
    return {
      id: r.id,
      name: r.name,
      genre: r.genre,
      influence: r.influence || "No Influence",
      key: r.key || "",
      scale: r.scale || "",
      bpm: typeof r.bpm === "number" ? r.bpm : 0,
      loopLength: (r.loop_length as Loop["loopLength"]) || "8 bars",
      swing: typeof r.swing === "number" ? r.swing : 0,
      mood: r.mood || "",
      energyLevel: r.energy_level || "",
      reverb: r.reverb || "",
      prompt: r.prompt || "",
      audioUrl: r.audio_url ?? null,
      seed: r.seed ?? null,
      details: null,
      stemsUrl: r.stems_url && typeof r.stems_url === "object" ? (r.stems_url as Record<string, unknown>) : null,
      isSaved: false,
      isPublic: true,
      createdAt: r.created_at,
    };
  };

  useEffect(() => {
    let cancelled = false;
    if (!id) return;
    setLoading(true);
    void (async () => {
      const { data, error } = await supabase
        .from("loops")
        .select("id,user_id,name,genre,influence,key,scale,bpm,loop_length,swing,mood,energy_level,reverb,prompt,audio_url,stems_url,is_public,created_at,seed")
        .eq("id", id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        setRow(null);
        setAuthor(null);
      } else {
        const nextRow = (data as LoopRow | null) ?? null;
        setRow(nextRow);
        if (nextRow?.user_id) {
          const cards = await fetchPublicProfileCards([nextRow.user_id]);
          if (!cancelled) setAuthor(cards.get(nextRow.user_id) ?? null);
        } else {
          setAuthor(null);
        }
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!row?.id) return;
    let cancelled = false;
    if (!isPlayablePublicLoop(row.audio_url, row.stems_url, row.created_at)) return;
    void (async () => {
      const publicRow: PublicLoopRow = {
        id: row.id,
        name: row.name,
        genre: row.genre,
        influence: row.influence,
        mood: row.mood,
        bpm: row.bpm,
        prompt: row.prompt,
        audio_url: row.audio_url,
        stems_url: row.stems_url ?? null,
        created_at: row.created_at,
        seed: row.seed,
      };
      const url = await resolvePlayableCommunityAudio(publicRow).catch(() => "");
      if (!cancelled && url) {
        setRow((prev) => (prev ? { ...prev, audio_url: url } : prev));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [row?.id]);

  useEffect(() => {
    let cancelled = false;
    if (!id) return;
    void (async () => {
      const { data, error } = await supabase.from("loop_ratings").select("rating").eq("loop_id", id);
      if (cancelled) return;
      if (error) return;
      const rows = (data ?? []) as Array<{ rating: number }>;
      let sum = 0;
      let count = 0;
      for (const r of rows) {
        if (typeof r.rating === "number") {
          sum += r.rating;
          count += 1;
        }
      }
      setRatingSum(sum);
      setRatingCount(count);
      if (user) {
        const mineRes = await supabase.from("loop_ratings").select("rating").eq("loop_id", id).eq("user_id", user.id).maybeSingle();
        if (!cancelled && !mineRes.error) {
          const mine = mineRes.data as { rating?: number } | null;
          setMyRating(typeof mine?.rating === "number" ? mine.rating : null);
        }
      } else {
        setMyRating(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, user]);

  useEffect(() => {
    let cancelled = false;
    if (!id) return;
    void (async () => {
      const counts = await fetchLoopCommentCounts([id]);
      if (!cancelled) setCommentCount(counts[id] ?? 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    if (!row?.id) {
      setPlaybackQueue([]);
      return;
    }
    void (async () => {
      try {
        const pool = await fetchPublicLoops({ limit: 32, playableOnly: true, timeoutMs: 12000 });
        if (cancelled) return;
        const currentRow: PublicLoopRow = {
          id: row.id,
          name: row.name,
          genre: row.genre,
          influence: row.influence,
          mood: row.mood,
          bpm: row.bpm,
          prompt: row.prompt,
          audio_url: row.audio_url,
          stems_url: row.stems_url ?? null,
          created_at: row.created_at,
          seed: row.seed,
        };
        const sameGenre = pool.filter((r) => r.id !== row.id && r.genre === row.genre);
        const related = (sameGenre.length >= 3 ? sameGenre : pool.filter((r) => r.id !== row.id)).slice(0, 15);
        setPlaybackQueue([currentRow, ...related]);
      } catch {
        if (!cancelled) {
          setPlaybackQueue([
            {
              id: row.id,
              name: row.name,
              genre: row.genre,
              influence: row.influence,
              mood: row.mood,
              bpm: row.bpm,
              prompt: row.prompt,
              audio_url: row.audio_url,
              stems_url: row.stems_url ?? null,
              created_at: row.created_at,
              seed: row.seed,
            },
          ]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [row]);

  const canView = row?.is_public === true;
  const canPlay = row ? isPlayablePublicLoop(row.audio_url, row.stems_url) : false;
  if (!id) return <Navigate to="/community" replace />;
  if (!loading && (!row || !canView)) return <Navigate to="/community" replace />;

  const playingNow = row && current?.id === row.id && isPlaying;

  const togglePlay = () => {
    if (!row) return;
    unlockAudioPlaybackFromGesture();
    if (current?.id === row.id) {
      setPlaying(!isPlaying);
      return;
    }
    void (async () => {
      setResolvingAudio(true);
      const list =
        playbackQueue.length > 0
          ? playbackQueue
          : [
              {
                id: row.id,
                name: row.name,
                genre: row.genre,
                influence: row.influence,
                mood: row.mood,
                bpm: row.bpm,
                prompt: row.prompt,
                audio_url: row.audio_url,
                stems_url: row.stems_url ?? null,
                created_at: row.created_at,
                seed: row.seed,
              } satisfies PublicLoopRow,
            ];
      const idx = findPublicRowIndex(list, row.id);
      const ok = await playPublicRowsInQueue(list, idx >= 0 ? idx : 0, {
        source: PUBLIC_LOOP_QUEUE_SOURCE,
        onResolveStart: () => setResolvingAudio(true),
        onResolveEnd: () => setResolvingAudio(false),
        onRowUrlResolved: (rowId, url) => {
          if (rowId !== row.id) return;
          setRow((prev) => (prev ? { ...prev, audio_url: url } : prev));
        },
      });
      setResolvingAudio(false);
      if (!ok) {
        toast.error(copy.audioUnavailable);
      }
    })();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(copy.linkCopied);
    } catch {
      toast.error(copy.couldNotCopy);
    }
  };

  const remixThisVibe = () => {
    if (!row || !id) return;
    unlockAudioPlaybackFromGesture();
    setRemixLoading(true);
    void (async () => {
      try {
        const publicRow: PublicLoopRow = {
          id: row.id,
          name: row.name,
          genre: row.genre,
          influence: row.influence,
          mood: row.mood,
          bpm: row.bpm,
          prompt: row.prompt,
          audio_url: row.audio_url,
          stems_url: row.stems_url,
          created_at: row.created_at,
          seed: row.seed,
        };
        let audioUrl = "";
        if (!isRemixVibeRecreateEnabled()) {
          audioUrl = await resolvePlayableCommunityAudio(publicRow);
        }
        const sourceLoop = loopToRemixSource(toLoop(row));
        savePendingRemix({
          sourceLoopId: id,
          sourceLoopName: row.name,
          audioUrl,
          prompt: sourceLoop.prompt,
          genre: row.genre || undefined,
          mood: row.mood || undefined,
          bpm: row.bpm > 0 ? row.bpm : undefined,
          source: "public_loop",
          sourceLoop,
        });
        if (!user) {
          navigate("/auth", { state: { from: "/dashboard?remix=1" } });
          return;
        }
        navigate("/dashboard?remix=1");
      } catch {
        toast.error(copy.audioUnavailableRemix);
      } finally {
        setRemixLoading(false);
      }
    })();
  };

  const setRating = (value: number) => {
    const next = Math.max(1, Math.min(5, Math.round(value)));
    if (!user) {
      toast(copy.loginToRate);
      window.location.href = "/auth";
      return;
    }
    if (!id) return;
    if (savingRating) return;
    setSavingRating(true);
    void (async () => {
      const { error } = await supabase
        .from("loop_ratings")
        .upsert({ loop_id: id, user_id: user.id, rating: next }, { onConflict: "loop_id,user_id" });
      if (error) {
        toast.error(copy.couldNotRate);
        setSavingRating(false);
        return;
      }
      const prev = myRating;
      setMyRating(next);
      setRatingSum((s) => s + (prev ? next - prev : next));
      setRatingCount((c) => c + (prev ? 0 : 1));
      setSavingRating(false);
    })();
  };
  const faqItems = useMemo(
    () => [...copy.faqItems, ...(enrichment?.extraFaq ?? [])],
    [copy.faqItems, enrichment?.extraFaq],
  );


  return (
    <MarketingPageShell className="pk-public-loop text-pk-text">
      <Navbar variant="marketing" />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6">
        <nav className="text-sm text-pk-muted" aria-label="Breadcrumb">
          <Link className="font-semibold text-pk-accent hover:underline" to="/">
            ProducerHit
          </Link>
          <span className="px-2">/</span>
          <Link className="font-semibold text-pk-accent hover:underline" to="/community">
            {copy.community}
          </Link>
          <span className="px-2">/</span>
          <span className="text-pk-text">{row?.name ?? copy.track}</span>
        </nav>

        {fromShorts && row ? (
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-pk-accent/30 bg-gradient-to-r from-pk-accent/15 to-transparent p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-pk-accent">
                {copy.fromShorts}
              </p>
              <p className="mt-1 text-sm font-semibold text-pk-text sm:text-base">
                {copy.shortsPitch}
              </p>
            </div>
            <Link
              to={createCtaHref}
              className="pk-prism-btn inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
            >
              {copy.createFree}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : null}

        {loading || !row ? (
          <div className="mt-16 flex flex-col items-center py-16 text-center">
            <PkIconLoader icon="community" size="md" label={copy.loadingTrack} />
          </div>
        ) : (
          <>
            <article className="mt-8 overflow-hidden rounded-3xl border border-pk-border bg-pk-panel/60 shadow-[0_32px_90px_rgba(0,0,0,0.55)] backdrop-blur-xl">
              <div className="relative min-h-[280px] sm:min-h-[340px]">
                <div className={cn("absolute inset-0", coverLoop && COVER_SURFACE_CLASS)} />
                <img
                  src={coverUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-90"
                  loading="eager"
                  decoding="async"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/55 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#050508]/40 to-transparent" />

                <div className="relative flex h-full min-h-[280px] flex-col justify-end p-6 sm:min-h-[340px] sm:p-8">
                  <div className="flex flex-wrap gap-2">
                    {row.genre ? (
                      <span className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                        {row.genre}
                      </span>
                    ) : null}
                    {producerInfluence ? (
                      <span className="pk-community-card__influence rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                        {producerInfluence}
                      </span>
                    ) : null}
                    {row.mood ? (
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-sm">
                        {row.mood}
                      </span>
                    ) : null}
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-sm">
                      {row.bpm > 0 ? `${row.bpm} BPM` : copy.autoBpm}
                    </span>
                  </div>

                  <h1 className="mt-4 max-w-3xl text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    {row.name}
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm text-white/75 sm:text-base">
                    {copy.heroLead}
                  </p>

                  {author ? (
                    <div className="mt-4">
                      <ProfileAuthorChip author={author} locale={locale} size="md" />
                    </div>
                  ) : null}

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={togglePlay}
                      disabled={!canPlay || resolvingAudio}
                      className="pk-prism-btn inline-flex min-h-[48px] items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold disabled:opacity-60"
                    >
                      {resolvingAudio ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : playingNow ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      {playingNow ? copy.pause : copy.listen}
                    </button>
                    <button
                      type="button"
                      onClick={remixThisVibe}
                      disabled={remixLoading || !canPlay}
                      className="pk-glass-btn pk-glass-btn--ghost inline-flex min-h-[48px] items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
                    >
                      {remixLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      {copy.remixVibe}
                    </button>
                    <button
                      type="button"
                      onClick={copyLink}
                      className="pk-glass-btn pk-glass-btn--ghost inline-flex min-h-[48px] items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
                    >
                      <Share2 className="h-4 w-4" />
                      {copy.share}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 border-t border-pk-border p-6 sm:grid-cols-[1fr_auto] sm:p-8">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-pk-muted">
                    {copy.producerPrompt}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-pk-text">{row.prompt || "—"}</p>
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <div className="text-xs font-semibold text-pk-muted">{copy.communityRating}</div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const star = i + 1;
                      const on = star <= (myRating ?? 0);
                      return (
                        <button
                          key={star}
                          type="button"
                          disabled={savingRating}
                          onClick={() => setRating(star)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-white/5"
                          aria-label={copy.rateStar(star)}
                        >
                          <Star className={on ? "h-5 w-5 fill-yellow-400 text-yellow-400" : "h-5 w-5 text-[#d1d5db]"} />
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-sm font-semibold text-pk-muted">
                    {ratingCount > 0 ? `${avgRating?.toFixed(1)} (${ratingCount})` : copy.noRatingsYet}
                  </div>
                </div>
              </div>
            </article>

            {enrichment ? (
              <div className="mt-8 grid gap-4 lg:grid-cols-2">
                <section className="pk-public-loop__about" aria-labelledby="loop-about">
                  <h2 id="loop-about" className="text-lg font-bold text-pk-text">
                    {copy.aboutTrack}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-pk-muted">{enrichment.aboutParagraph}</p>
                </section>

                <section className="pk-public-loop__specs" aria-labelledby="loop-specs">
                  <h2 id="loop-specs" className="text-lg font-bold text-pk-text">
                    {copy.trackDetails}
                  </h2>
                  <dl className="pk-public-loop__specs-grid">
                    {enrichment.specs.map((spec) => (
                      <div key={spec.label} className="pk-public-loop__spec">
                        <dt>{spec.label}</dt>
                        <dd>{spec.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              </div>
            ) : null}

            {enrichment?.lyrics ? (
              <section className="pk-public-loop__lyrics mt-4" aria-labelledby="loop-lyrics">
                <h2 id="loop-lyrics" className="text-lg font-bold text-pk-text">
                  {copy.lyricsTitle}
                </h2>
                <pre>{enrichment.lyrics}</pre>
              </section>
            ) : null}

            <section className="pk-public-loop__share mt-4" aria-labelledby="loop-share">
              <h2 id="loop-share" className="text-lg font-bold text-pk-text">
                {copy.sharePageTitle}
              </h2>
              <p className="mt-2 text-sm text-pk-muted">{enrichment?.shareText ?? row.name}</p>
              <ViralShareBar
                className="pk-public-loop__share-bar mt-4"
                url={`/loop/${row.id}`}
                shareText={enrichment?.shareText ?? row.name}
                locale={locale}
                loopId={row.id}
                channel="twitter"
              />
            </section>

            <section className="mt-10 grid gap-4 sm:grid-cols-3" aria-label={copy.actions}>
              <Link
                to={user ? "/dashboard" : "/auth"}
                className="pk-public-loop__cta group rounded-2xl border border-pk-border bg-pk-panel/50 p-5 transition hover:border-pk-accent/40 hover:bg-pk-panel/80"
              >
                <Zap className="h-5 w-5 text-pk-accent" />
                <h2 className="mt-3 text-lg font-bold">{copy.createYours}</h2>
                <p className="mt-2 text-sm text-pk-muted">{copy.createYoursHint}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-pk-accent">
                  {copy.openStudio}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </Link>

              <Link
                to="/community"
                className="pk-public-loop__cta group rounded-2xl border border-pk-border bg-pk-panel/50 p-5 transition hover:border-pk-accent/40 hover:bg-pk-panel/80"
              >
                <Music2 className="h-5 w-5 text-pk-accent" />
                <h2 className="mt-3 text-lg font-bold">{copy.exploreCommunity}</h2>
                <p className="mt-2 text-sm text-pk-muted">{copy.exploreCommunityHint}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-pk-accent">
                  {copy.browseTracks}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </Link>

              {genreSeo ? (
                <Link
                  to={genreSeo.path}
                  className="pk-public-loop__cta group rounded-2xl border border-pk-border bg-pk-panel/50 p-5 transition hover:border-pk-accent/40 hover:bg-pk-panel/80"
                >
                  <Sparkles className="h-5 w-5 text-pk-accent" />
                  <h2 className="mt-3 text-lg font-bold">{genreSeo.label}</h2>
                  <p className="mt-2 text-sm text-pk-muted">
                    {copy.genreSeoHint}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-pk-accent">
                    {copy.learnMore}
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ) : (
                <Link
                  to="/ai-beat-generator"
                  className="pk-public-loop__cta group rounded-2xl border border-pk-border bg-pk-panel/50 p-5 transition hover:border-pk-accent/40 hover:bg-pk-panel/80"
                >
                  <Sparkles className="h-5 w-5 text-pk-accent" />
                  <h2 className="mt-3 text-lg font-bold">{copy.aiBeatGenerator}</h2>
                  <p className="mt-2 text-sm text-pk-muted">
                    {copy.aiBeatGeneratorHint}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-pk-accent">
                    {copy.getStarted}
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              )}
            </section>

            {row && playbackQueue.length > 1 ? (
              <section className="mt-10 rounded-2xl border border-pk-border bg-pk-panel/40 p-6 sm:p-8" aria-labelledby="similar-tracks-title">
                <h2 id="similar-tracks-title" className="text-xl font-bold">
                  {copy.similarTracksTitle(row.genre)}
                </h2>
                <p className="mt-2 text-sm text-pk-muted">
                  {copy.similarTracksHint}
                </p>
                <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                  {playbackQueue
                    .filter((t) => t.id !== row.id)
                    .slice(0, 8)
                    .map((t) => (
                      <li key={t.id}>
                        <Link
                          to={`/loop/${t.id}`}
                          className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 transition-colors hover:border-pk-accent/30 hover:bg-white/[0.05]"
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-pk-accent/15 text-xs font-bold text-pk-accent">
                            ♪
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-pk-text">{t.name || "Track"}</span>
                            <span className="block truncate text-xs text-pk-muted">
                              {[t.genre, t.mood, t.bpm ? `${t.bpm} BPM` : null].filter(Boolean).join(" · ")}
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                </ul>
                {row.genre && genreSeo ? (
                  <p className="mt-4 text-sm">
                    <Link to={genreSeo.path} className="font-semibold text-pk-accent hover:underline">
                      {genreSeo.label} →
                    </Link>
                    {" · "}
                    <Link to="/trending" className="font-semibold text-pk-accent hover:underline">
                      {copy.trendingAiBeats}
                    </Link>
                  </p>
                ) : (
                  <p className="mt-4 text-sm">
                    <Link to="/trending" className="font-semibold text-pk-accent hover:underline">
                      {copy.trendingAiBeats}
                    </Link>
                  </p>
                )}
              </section>
            ) : null}

            <LoopCommentsSection
              loopId={row.id}
              loopOwnerId={row.user_id}
              locale={locale}
              userId={user?.id ?? null}
              commentCount={commentCount}
              onCommentCountChange={setCommentCount}
            />

            <section className="mt-10 rounded-2xl border border-pk-border bg-pk-panel/40 p-6 sm:p-8" aria-labelledby="loop-faq">
              <h2 id="loop-faq" className="text-xl font-bold">
                {copy.faq}
              </h2>
              <dl className="mt-5 space-y-5">
                {faqItems.map((item) => (
                  <div key={item.q}>
                    <dt className="font-semibold text-pk-text">{item.q}</dt>
                    <dd className="mt-1 text-sm leading-relaxed text-pk-muted">{item.a}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {canPlay ? (
              <audio
                className="sr-only"
                preload="metadata"
                src={row.audio_url ?? undefined}
                aria-label={row.name}
              >
                <track kind="captions" />
              </audio>
            ) : null}
          </>
        )}

        <footer className="mt-14 border-t border-pk-border pt-8 text-sm text-pk-muted">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link to="/blog" className="hover:text-pk-text">
              {copy.blog}
            </Link>
            <Link to="/pricing" className="hover:text-pk-text">
              {copy.pricing}
            </Link>
            <Link to="/legal#privacy" className="hover:text-pk-text">
              {copy.privacy}
            </Link>
            <Link to="/legal#terms" className="hover:text-pk-text">
              {copy.terms}
            </Link>
          </div>
          <div className="mt-4">© 2026 ProducerHit</div>
        </footer>
      </main>
    </MarketingPageShell>
  );
}
