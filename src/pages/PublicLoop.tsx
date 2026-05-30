import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Loader2, Pause, Play, Share2, Sparkles, Star } from "lucide-react";
import { PkIconLoader } from "@/components/ui/PkIconLoader";
import toast from "react-hot-toast";
import { Navbar } from "@/components/Navbar";
import { isPlayablePublicLoop, resolvePlayableCommunityAudio, type PublicLoopRow } from "@/lib/publicLoops";
import { fetchPublicProfileCards, type PublicProfileCard } from "@/lib/creatorProfile";
import { ProfileAuthorChip } from "@/components/profile/ProfileAuthorChip";
import { savePendingRemix, buildRemixPromptFromMeta } from "@/lib/pendingRemix";
import { buildOgLoopImageUrl, setLoopOpenGraph } from "@/lib/seoMeta";
import { buildLoopShareUrl } from "@/lib/growthLinks";
import { supabase } from "@/lib/supabaseClient";
import { useLocaleStore } from "@/stores/localeStore";
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
  const navigate = useNavigate();
  const locale = useLocaleStore((s) => s.locale);
  const isFr = locale === "fr";
  const user = useAuthStore((s) => s.user);
  const current = usePlayerStore((s) => s.current);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const setCurrent = usePlayerStore((s) => s.setCurrent);
  const setPlaying = usePlayerStore((s) => s.setPlaying);
  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState<LoopRow | null>(null);
  const [ratingSum, setRatingSum] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [myRating, setMyRating] = useState<number | null>(null);
  const [savingRating, setSavingRating] = useState(false);
  const [resolvingAudio, setResolvingAudio] = useState(false);
  const [remixLoading, setRemixLoading] = useState(false);
  const [author, setAuthor] = useState<PublicProfileCard | null>(null);

  const shareUrl = useMemo(
    () => (id ? buildLoopShareUrl(id, "twitter") : "https://www.producerhit.com/community"),
    [id],
  );

  useEffect(() => {
    if (!row || !id) return;
    const title = `${row.name} — ${row.genre || "Beat"} | ProducerHit`;
    const description = [
      row.genre,
      row.mood,
      row.bpm ? `${row.bpm} BPM` : null,
      isFr ? "Écoute et remixe sur ProducerHit" : "Listen and remix on ProducerHit",
    ]
      .filter(Boolean)
      .join(" · ");
    setLoopOpenGraph({
      title,
      description,
      url: `https://www.producerhit.com/loop/${id}`,
      imageUrl: buildOgLoopImageUrl({ id, title: row.name, genre: row.genre, bpm: row.bpm }),
    });
  }, [id, isFr, row]);

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

  const canView = row?.is_public === true;
  const canPlay = row ? isPlayablePublicLoop(row.audio_url, row.stems_url) : false;
  if (!id) return <Navigate to="/community" replace />;
  if (!loading && (!row || !canView)) return <Navigate to="/community" replace />;

  const togglePlay = () => {
    if (!row) return;
    if (current?.id === row.id) {
      setPlaying(!isPlaying);
      return;
    }
    void (async () => {
      setResolvingAudio(true);
      const playableRow: PublicLoopRow = {
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
      const url = await resolvePlayableCommunityAudio(playableRow).catch(() => "");
      setResolvingAudio(false);
      if (!url) {
        toast.error(isFr ? "Audio indisponible" : "Audio unavailable");
        return;
      }

      setCurrent(toLoop({ ...row, audio_url: url }), true);
    })();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(isFr ? "Lien copié" : "Link copied");
    } catch {
      toast.error(isFr ? "Impossible de copier" : "Could not copy");
    }
  };

  const remixThisVibe = () => {
    if (!row || !id) return;
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
        const audioUrl = await resolvePlayableCommunityAudio(publicRow);
        savePendingRemix({
          sourceLoopId: id,
          sourceLoopName: row.name,
          audioUrl,
          prompt: buildRemixPromptFromMeta({
            prompt: row.prompt,
            genre: row.genre,
            mood: row.mood,
            locale,
          }),
          genre: row.genre || undefined,
          mood: row.mood || undefined,
          bpm: row.bpm > 0 ? row.bpm : undefined,
          source: "public_loop",
        });
        if (!user) {
          navigate("/auth", { state: { from: "/dashboard?remix=1" } });
          return;
        }
        navigate("/dashboard?remix=1");
      } catch {
        toast.error(isFr ? "Audio indisponible pour remix" : "Audio unavailable for remix");
      } finally {
        setRemixLoading(false);
      }
    })();
  };

  const setRating = (value: number) => {
    const next = Math.max(1, Math.min(5, Math.round(value)));
    if (!user) {
      toast(isFr ? "Connecte-toi pour noter" : "Login to rate");
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
        toast.error(isFr ? "Impossible de noter" : "Could not rate");
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

  return (
    <div className="min-h-screen bg-pk-bg text-pk-text">
      <Navbar variant="marketing" />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="text-sm text-pk-muted">
          <Link className="font-semibold text-pk-accent hover:underline" to="/community">
            {isFr ? "Communauté" : "Community"}
          </Link>
          <span className="px-2">/</span>
          <span>{row?.name ?? (isFr ? "Chargement…" : "Loading…")}</span>
        </div>

        <div className="mt-8 rounded-2xl border border-pk-border bg-pk-panel/70 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          {loading || !row ? (
            <div className="flex flex-col items-center py-10 text-center">
              <PkIconLoader
                icon="community"
                size="md"
                label={isFr ? "Chargement du morceau…" : "Loading track…"}
              />
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="text-balance text-2xl font-bold tracking-tight">{row.name}</h1>
                  <div className="mt-2 text-xs font-semibold text-pk-muted">
                    {row.genre} · {row.bpm > 0 ? `${row.bpm} BPM` : isFr ? "Auto BPM" : "Auto BPM"} ·{" "}
                    {row.key ? `${row.key} ${row.scale}` : isFr ? "Auto key" : "Auto key"}
                  </div>
                  {author ? (
                    <div className="mt-3">
                      <ProfileAuthorChip author={author} isFr={isFr} size="md" hideAvatar />
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={togglePlay}
                  disabled={!canPlay || resolvingAudio}
                  className={[
                    "inline-flex h-11 w-11 items-center justify-center rounded-full border",
                    canPlay && !resolvingAudio
                      ? "border-pk-border bg-white/5 hover:bg-white/10"
                      : "cursor-not-allowed border-pk-border bg-white/5 text-pk-muted",
                  ].join(" ")}
                  aria-label={current?.id === row.id && isPlaying ? "Pause" : "Play"}
                >
                  {current?.id === row.id && isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </button>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
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
                        className="inline-flex"
                        aria-label={isFr ? `Noter ${star} sur 5` : `Rate ${star} of 5`}
                        title={isFr ? `Noter ${star}/5` : `Rate ${star}/5`}
                      >
                        <Star className={on ? "h-5 w-5 fill-yellow-400 text-yellow-400" : "h-5 w-5 text-[#d1d5db]"} />
                      </button>
                    );
                  })}
                </div>
                <div className="text-sm font-semibold text-pk-muted">
                  {ratingCount > 0 ? `${(ratingSum / ratingCount).toFixed(1)} (${ratingCount})` : isFr ? "Pas encore de note" : "No ratings yet"}
                </div>
              </div>

              <div className="mt-6">
                <div className="text-xs font-semibold text-pk-muted">{isFr ? "Prompt" : "Prompt"}</div>
                <div className="mt-2 whitespace-pre-wrap text-sm text-pk-text">{row.prompt || "—"}</div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={remixThisVibe}
                  disabled={remixLoading}
                  className="pk-prism-btn inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold disabled:opacity-60"
                >
                  {remixLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {isFr ? "Remix this vibe" : "Remix this vibe"}
                </button>
                <button
                  type="button"
                  onClick={copyLink}
                  className="pk-glass-btn pk-glass-btn--ghost inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold"
                >
                  <Share2 className="h-4 w-4" />
                  {isFr ? "Copier le lien" : "Copy link"}
                </button>
              </div>
            </>
          )}
        </div>

        <footer className="mt-14 border-t border-pk-border pt-8 text-sm text-pk-muted">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link to="/blog" className="hover:text-pk-text">
              {isFr ? "Blog" : "Blog"}
            </Link>
            <Link to="/legal#privacy" className="hover:text-pk-text">
              {isFr ? "Confidentialité" : "Privacy"}
            </Link>
            <Link to="/legal#terms" className="hover:text-pk-text">
              {isFr ? "Conditions" : "Terms"}
            </Link>
            <Link to="/legal#contact" className="hover:text-pk-text">
              {isFr ? "Support" : "Support"}
            </Link>
            <a className="hover:text-pk-text" href="mailto:info.producermarket@gmail.com">
              info.producermarket@gmail.com
            </a>
          </div>
          <div className="mt-4">© 2026 ProducerHit</div>
        </footer>
      </main>
    </div>
  );
}
