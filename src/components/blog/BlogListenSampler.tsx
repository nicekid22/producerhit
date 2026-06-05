import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Play, Shuffle, Square } from "lucide-react";
import { publicRowToCoverLoop, resolveLoopDisplayCoverUrl } from "@/lib/coverArt";
import {
  BLOG_SAMPLER_QUEUE_SOURCE,
  findPublicRowIndex,
  playPublicRowsInQueue,
} from "@/lib/communityPlaybackQueue";
import { fetchPublicLoops, type PublicLoopRow } from "@/lib/publicLoops";
import { usePlayerStore } from "@/stores/playerStore";
import { cn } from "@/lib/utils";

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

function rowMatches(row: PublicLoopRow, matchers: RegExp[]): boolean {
  const hay = `${row.genre ?? ""} ${row.mood ?? ""} ${row.name ?? ""} ${row.influence ?? ""}`;
  return matchers.some((re) => re.test(hay));
}

type Props = {
  locale: "en" | "fr";
  genreMatchers: RegExp[];
  className?: string;
};

export function BlogListenSampler({ locale, genreMatchers, className }: Props) {
  const isFr = locale === "fr";
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<PublicLoopRow[]>([]);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const current = usePlayerStore((s) => s.current);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const setPlaying = usePlayerStore((s) => s.setPlaying);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const pool = await fetchPublicLoops({ limit: 56, playableOnly: true, timeoutMs: 14000 });
      const matched = pool.filter((r) => rowMatches(r, genreMatchers));
      const fill = matched.length >= 3 ? matched : pool;
      const picked = shuffle(fill).slice(0, 4);
      setRows(picked);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [genreMatchers]);

  useEffect(() => {
    void load();
  }, [load]);

  const playRow = async (row: PublicLoopRow, playlist?: PublicLoopRow[]) => {
    const list = playlist ?? rows;
    const idx = findPublicRowIndex(list, row.id);
    const ok = await playPublicRowsInQueue(list, idx >= 0 ? idx : 0, {
      source: BLOG_SAMPLER_QUEUE_SOURCE,
      onResolveStart: (rowId) => setResolvingId(rowId),
      onResolveEnd: () => setResolvingId(null),
    });
    if (!ok) setResolvingId(null);
  };

  const playRandom = () => {
    if (!rows.length) return;
    const pick = rows[Math.floor(Math.random() * rows.length)]!;
    void playRow(pick);
  };

  const stopIfPlaying = () => {
    if (isPlaying) setPlaying(false);
  };

  const header = useMemo(
    () => (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-cyan-200/70">
            {isFr ? "Écoute la communauté" : "Listen to the community"}
          </div>
          <p className="mt-1 text-sm text-white/65">
            {isFr
              ? "Exemples publics — lecture aléatoire pour sentir le style."
              : "Public examples — shuffle play to feel the vibe."}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={loading || !rows.length}
            onClick={() => void playRandom()}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/85 hover:bg-white/10 disabled:opacity-40"
          >
            <Shuffle className="h-3.5 w-3.5" />
            {isFr ? "Aléatoire" : "Shuffle"}
          </button>
          {isPlaying ? (
            <button
              type="button"
              onClick={stopIfPlaying}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/85 hover:bg-white/10"
            >
              <Square className="h-3.5 w-3.5" />
              {isFr ? "Pause" : "Pause"}
            </button>
          ) : null}
        </div>
      </div>
    ),
    [isFr, isPlaying, loading, playRandom, rows.length, stopIfPlaying],
  );

  return (
    <section
      className={cn(
        "pk-blog-listen not-prose rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/[0.08] via-violet-500/[0.06] to-black/40 p-5",
        className,
      )}
    >
      {header}
      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-white/50">
          <Loader2 className="h-4 w-4 animate-spin" />
          {isFr ? "Chargement des tracks…" : "Loading tracks…"}
        </div>
      ) : rows.length === 0 ? (
        <p className="mt-4 text-sm text-white/50">
          {isFr ? "Aucun extrait pour le moment — " : "No previews yet — "}
          <Link to="/community" className="text-cyan-300 hover:underline">
            {isFr ? "explorer la communauté" : "browse community"}
          </Link>
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {rows.map((row) => {
            const loop = publicRowToCoverLoop(row);
            const cover = resolveLoopDisplayCoverUrl(loop, 96);
            const active = current?.id === loop.id;
            const busy = resolvingId === row.id;
            return (
              <li key={row.id}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void playRow(row)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                    active
                      ? "border-cyan-400/35 bg-cyan-500/[0.12]"
                      : "border-white/10 bg-black/25 hover:border-white/20 hover:bg-white/[0.04]",
                  )}
                >
                  <span
                    className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white/5"
                    style={
                      cover
                        ? undefined
                        : {
                            background: `linear-gradient(135deg, rgba(157,124,255,0.35), rgba(103,195,255,0.2))`,
                          }
                    }
                  >
                    {cover ? <img src={cover} alt="" className="h-full w-full object-cover" loading="lazy" /> : null}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/35">
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                      ) : (
                        <Play className="h-4 w-4 text-white" fill="currentColor" />
                      )}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-white">{row.name || "Track"}</span>
                    <span className="block truncate text-xs text-white/45">
                      {[row.genre, row.mood, row.bpm ? `${row.bpm} BPM` : null].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-3 text-[11px] text-white/40">
        {isFr
          ? "Tracks publiques ProducerHit — le lecteur en bas de l’écran enchaîne la playlist."
          : "Public ProducerHit tracks — use the bottom player to queue through the playlist."}
      </p>
    </section>
  );
}
