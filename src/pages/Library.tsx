import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { AppShell } from "@/components/AppShell";
import { AppShellAsideHeader } from "@/components/AppShellAsideHeader";
import { PrismFilterPill } from "@/components/prism/PrismFilterPill";
import { PrismPageHero } from "@/components/prism/PrismPageHero";
import { PrismStat } from "@/components/prism/PrismStat";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useLoopsStore } from "@/stores/loopsStore";
import { LoopCardItem } from "@/components/LoopCardItem";
import { useLocaleStore } from "@/stores/localeStore";
import { Bookmark, Clock, Copy, Disc3, Gauge, Info, KeyRound, Layers, Search, Sigma, Sparkles, X } from "lucide-react";
import { coverGradient, coverImageUrl } from "@/lib/utils";

type Filter = "all" | "genre" | "key" | "bpm";

function formatTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export default function Library() {
  const locale = useLocaleStore((s) => s.locale);
  const loops = useLoopsStore((s) => s.loops);
  const loopsLoading = useLoopsStore((s) => s.loading);
  const loopsSyncError = useLoopsStore((s) => s.lastSyncError);
  const loadMyLoops = useLoopsStore((s) => s.loadMyLoops);
  const durationsSecById = useLoopsStore((s) => s.durationsSecById);
  const deleteLoopRemote = useLoopsStore((s) => s.deleteLoopRemote);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [bpmMin, setBpmMin] = useState(90);
  const [bpmMax, setBpmMax] = useState(160);

  const filtered = useMemo(() => {
    const base = loops;
    const text = q.trim().toLowerCase();
    const afterSearch = text
      ? base.filter((l) => [l.name, l.genre, l.key, l.mood].some((x) => x.toLowerCase().includes(text)))
      : base;

    if (filter === "all") return afterSearch;
    if (filter === "genre") return afterSearch.slice().sort((a, b) => a.genre.localeCompare(b.genre));
    if (filter === "key") return afterSearch.slice().sort((a, b) => a.key.localeCompare(b.key));

    const min = Math.max(60, Math.min(200, bpmMin));
    const max = Math.max(min, Math.min(200, bpmMax));
    return afterSearch
      .filter((l) => l.bpm >= min && l.bpm <= max)
      .slice()
      .sort((a, b) => a.bpm - b.bpm);
  }, [bpmMax, bpmMin, filter, loops, q]);

  const savedCount = useMemo(() => loops.filter((l) => l.isSaved).length, [loops]);
  const totalCount = loops.length;
  const genreCount = useMemo(() => new Set(loops.map((l) => l.genre).filter(Boolean)).size, [loops]);
  const topGenres = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of loops) {
      if (!l.genre) continue;
      counts.set(l.genre, (counts.get(l.genre) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [loops]);
  const detailsLoop = useMemo(() => (detailsId ? loops.find((l) => l.id === detailsId) ?? null : null), [detailsId, loops]);
  const isFr = locale === "fr";

  return (
    <AppShell
      theme="prism"
      left={
        <AppShellAsideHeader
          icon={Disc3}
          eyebrow={isFr ? "VAULT CRÉATIF" : "CREATIVE VAULT"}
          title={isFr ? "Bibliothèque" : "Library"}
          subtitle={
            isFr
              ? "Toutes tes créations, prêtes à être rejouées, remixées ou partagées."
              : "All your creations — ready to replay, remix, or share."
          }
          stats={[
            { label: isFr ? "Total" : "Total", value: totalCount },
            { label: isFr ? "Sauvés" : "Saved", value: savedCount },
            { label: isFr ? "Genres" : "Genres", value: genreCount },
            { label: isFr ? "Résultats" : "Showing", value: filtered.length },
          ]}
        >
          {topGenres.length ? (
            <div>
              <div className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/40">
                {isFr ? "Top vibes" : "Top vibes"}
              </div>
              <div className="pk-prism-chip-cloud mt-2">
                {topGenres.map(([g, n]) => (
                  <span key={g} className="pk-prism-vibe-chip">
                    {g} · {n}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          <Link
            to="/dashboard"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full pk-prism-btn px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[#050508] transition-all hover:brightness-110"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {isFr ? "Nouveau beat" : "New beat"}
          </Link>
        </AppShellAsideHeader>
      }
    >
      <div className="h-full space-y-5 px-4 pb-36 pt-6 md:pb-24">
        <PrismPageHero
          eyebrow={isFr ? "ARCHIVE PREMIUM" : "PREMIUM ARCHIVE"}
          title={<span className="pk-prism-holo-text">{isFr ? "Ta bibliothèque sonore" : "Your sound library"}</span>}
          description={
            isFr
              ? "Retrouve chaque beat généré, filtre par vibe, et ouvre les détails en un clic."
              : "Find every generated beat, filter by vibe, and open details in one click."
          }
          actions={
            <Link to="/dashboard">
              <Button variant="primary" size="sm">
                <Sparkles className="h-4 w-4" />
                {isFr ? "Créer" : "Create"}
              </Button>
            </Link>
          }
        >
          <div className="pk-prism-stat-grid">
            <PrismStat label={isFr ? "Beats" : "Beats"} value={totalCount} icon={<Disc3 className="h-4 w-4" />} accent="cyan" />
            <PrismStat label={isFr ? "Favoris" : "Saved"} value={savedCount} icon={<Bookmark className="h-4 w-4" />} accent="violet" />
            <PrismStat label={isFr ? "Genres" : "Genres"} value={genreCount} icon={<Layers className="h-4 w-4" />} />
            <PrismStat label={isFr ? "Affichés" : "Visible"} value={filtered.length} icon={<Search className="h-4 w-4" />} />
          </div>
        </PrismPageHero>

        <div className="flex flex-col gap-4">
          {loopsSyncError ? (
            <div className="rounded-pk pk-prism-card-soft p-4">
              <div className="text-sm font-semibold">{locale === "fr" ? "Sync en problème" : "Sync issue"}</div>
              <div className="mt-1 text-sm text-pk-muted">
                {locale === "fr"
                  ? "Affichage en cache. Clique sur Réessayer pour recharger depuis la base."
                  : "Showing cached data. Click Retry to reload from the database."}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    void loadMyLoops();
                  }}
                >
                  {locale === "fr" ? "Réessayer" : "Retry"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={loopsLoading}
                  onClick={() => window.location.reload()}
                >
                  {locale === "fr" ? "Recharger la page" : "Reload page"}
                </Button>
              </div>
            </div>
          ) : loopsLoading ? (
            <div className="rounded-pk pk-prism-card-soft p-4">
              <div className="text-sm font-semibold">{locale === "fr" ? "Synchronisation…" : "Syncing…"}</div>
              <div className="mt-1 text-sm text-pk-muted">
                {locale === "fr" ? "Chargement de tes créations." : "Loading your creations."}
              </div>
            </div>
          ) : null}

          <div className="pk-prism-section-card">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-2">
                <PrismFilterPill active={filter === "all"} onClick={() => setFilter("all")}>
                  {isFr ? "Tout" : "All"}
                </PrismFilterPill>
                <PrismFilterPill active={filter === "genre"} onClick={() => setFilter("genre")}>
                  {isFr ? "Genre" : "Genre"}
                </PrismFilterPill>
                <PrismFilterPill active={filter === "key"} onClick={() => setFilter("key")}>
                  {isFr ? "Tonalité" : "Key"}
                </PrismFilterPill>
                <PrismFilterPill active={filter === "bpm"} onClick={() => setFilter("bpm")}>
                  BPM
                </PrismFilterPill>
              </div>

              <div className="pk-prism-input-shell md:max-w-sm md:flex-1">
                <Search />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={isFr ? "Rechercher un beat, mood, clé…" : "Search beat, mood, key…"}
                />
              </div>
            </div>
          </div>

          {filter === "bpm" ? (
            <div className="pk-prism-section-card grid gap-3 md:grid-cols-2">
              <div>
                <div className="text-xs text-pk-muted">{locale === "fr" ? "BPM min" : "Min BPM"}</div>
                <input
                  type="number"
                  min={60}
                  max={200}
                  value={bpmMin}
                  onChange={(e) => setBpmMin(Number(e.target.value))}
                  className="mt-2 w-full rounded-pk border border-pk-border bg-pk-input px-3 py-2 text-sm outline-none focus:border-pk-accent"
                />
              </div>
              <div>
                <div className="text-xs text-pk-muted">{locale === "fr" ? "BPM max" : "Max BPM"}</div>
                <input
                  type="number"
                  min={60}
                  max={200}
                  value={bpmMax}
                  onChange={(e) => setBpmMax(Number(e.target.value))}
                  className="mt-2 w-full rounded-pk border border-pk-border bg-pk-input px-3 py-2 text-sm outline-none focus:border-pk-accent"
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-5">
          {filtered.length === 0 ? (
            <EmptyState
              title={locale === "fr" ? "Aucun beat pour l’instant" : "No beats yet"}
              description={locale === "fr" ? "Génère ton premier beat pour démarrer." : "Generate your first beat to get started."}
            />
          ) : (
            detailsLoop ? (
              <div className="md:grid md:grid-cols-[minmax(0,1fr)_420px] md:gap-4">
                <div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filtered.map((l) => (
                      <div key={l.id}>
                        <LoopCardItem
                          loop={l}
                          onDelete={() => setConfirmId(l.id)}
                          onOpenDetails={(loop) => setDetailsId((prev) => (prev === loop.id ? null : loop.id))}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 md:hidden">
                    <div className="relative overflow-hidden rounded-2xl pk-prism-card-soft p-5 backdrop-blur">
                      <div className="pk-prism-panel-glow" />
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">{detailsLoop.name}</div>
                          <div className="mt-1 text-xs text-pk-muted">{detailsLoop.genre}</div>
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => setDetailsId(null)} aria-label="Close">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="mt-4 overflow-hidden rounded-pk border border-pk-border bg-white/5">
                        <div className="relative aspect-square w-full bg-center bg-cover" style={{ backgroundImage: coverGradient(detailsLoop) }} aria-hidden>
                          <img
                            key={coverImageUrl(detailsLoop)}
                            src={coverImageUrl(detailsLoop)}
                            alt=""
                            className="absolute inset-0 h-full w-full object-contain"
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                            style={{ display: "block", opacity: 0 }}
                            onLoad={(e) => {
                              e.currentTarget.style.display = "block";
                              e.currentTarget.style.opacity = "1";
                              e.currentTarget.dataset.retry = "0";
                            }}
                            onError={(e) => {
                              const img = e.currentTarget;
                              img.style.opacity = "0";
                              const retry = Number(img.dataset.retry ?? "0");
                              if (retry < 4) {
                                img.dataset.retry = String(retry + 1);
                                const url = coverImageUrl(detailsLoop);
                                window.setTimeout(() => {
                                  img.style.display = "block";
                                  img.style.opacity = "0";
                                  img.src = "";
                                  img.src = url;
                                }, 900 * (retry + 1));
                                return;
                              }
                              img.style.display = "none";
                            }}
                          />
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-pk border border-pk-border bg-white/5 p-2">
                          <div className="flex items-center gap-1 text-pk-muted">
                            <Gauge className="h-3.5 w-3.5" />
                            BPM
                          </div>
                          <div className="mt-1 font-semibold text-pk-text">
                            {typeof detailsLoop.details?.bpm === "number" && detailsLoop.details.bpm > 0 ? detailsLoop.details.bpm : "—"}
                          </div>
                        </div>
                        <div className="rounded-pk border border-pk-border bg-white/5 p-2">
                          <div className="flex items-center gap-1 text-pk-muted">
                            <Clock className="h-3.5 w-3.5" />
                            Duration
                          </div>
                          <div className="mt-1 font-semibold text-pk-text">
                            {(() => {
                              const dur = (detailsLoop.details?.duration ?? durationsSecById[detailsLoop.id]) as number | null | undefined;
                              return typeof dur === "number" && isFinite(dur) && dur > 0 ? formatTime(dur) : "—";
                            })()}
                          </div>
                        </div>
                        <div className="rounded-pk border border-pk-border bg-white/5 p-2">
                          <div className="flex items-center gap-1 text-pk-muted">
                            <KeyRound className="h-3.5 w-3.5" />
                            Key
                          </div>
                          <div className="mt-1 font-semibold text-pk-text">{detailsLoop.details?.keyScale || "—"}</div>
                        </div>
                        <div className="rounded-pk border border-pk-border bg-white/5 p-2">
                          <div className="flex items-center gap-1 text-pk-muted">
                            <Sigma className="h-3.5 w-3.5" />
                            Time Sig
                          </div>
                          <div className="mt-1 font-semibold text-pk-text">{detailsLoop.details?.timeSignature || "—"}</div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center gap-2 text-xs font-semibold text-pk-text">
                          <Info className="h-4 w-4 text-pk-muted" />
                          Details
                        </div>
                        <div className="mt-2 rounded-pk border border-pk-border bg-white/5 p-3 text-xs text-pk-text">
                          {detailsLoop.details?.caption || detailsLoop.prompt || "—"}
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs font-semibold text-pk-text">Lyrics</div>
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={!detailsLoop.details?.lyrics?.trim()}
                            onClick={() => {
                              const text = detailsLoop.details?.lyrics?.trim() ?? "";
                              if (!text) return;
                              void (async () => {
                                try {
                                  await navigator.clipboard.writeText(text);
                                  toast.success("Lyrics copied");
                                } catch {
                                  toast.error("Copy failed");
                                }
                              })();
                            }}
                            aria-label="Copy lyrics"
                            title="Copy lyrics"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <pre className="mt-2 whitespace-pre-wrap rounded-pk border border-pk-border bg-white/5 p-3 text-xs text-pk-text">
                          {detailsLoop.details?.lyrics?.trim() ? detailsLoop.details.lyrics.trim() : "—"}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="hidden md:block">
                  <div className="sticky top-6 max-h-[calc(100vh-32px)] overflow-y-auto">
                    <div className="relative overflow-hidden rounded-2xl pk-prism-card-soft p-5 backdrop-blur">
                      <div className="pk-prism-panel-glow" />
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">{detailsLoop.name}</div>
                          <div className="mt-1 text-xs text-pk-muted">{detailsLoop.genre}</div>
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => setDetailsId(null)} aria-label="Close">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="mt-4 overflow-hidden rounded-pk border border-pk-border bg-white/5">
                        <div className="relative aspect-square w-full bg-center bg-cover" style={{ backgroundImage: coverGradient(detailsLoop) }} aria-hidden>
                          <img
                            key={coverImageUrl(detailsLoop)}
                            src={coverImageUrl(detailsLoop)}
                            alt=""
                            className="absolute inset-0 h-full w-full object-contain"
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                            style={{ display: "block", opacity: 0 }}
                            onLoad={(e) => {
                              e.currentTarget.style.display = "block";
                              e.currentTarget.style.opacity = "1";
                              e.currentTarget.dataset.retry = "0";
                            }}
                            onError={(e) => {
                              const img = e.currentTarget;
                              img.style.opacity = "0";
                              const retry = Number(img.dataset.retry ?? "0");
                              if (retry < 4) {
                                img.dataset.retry = String(retry + 1);
                                const url = coverImageUrl(detailsLoop);
                                window.setTimeout(() => {
                                  img.style.display = "block";
                                  img.style.opacity = "0";
                                  img.src = "";
                                  img.src = url;
                                }, 900 * (retry + 1));
                                return;
                              }
                              img.style.display = "none";
                            }}
                          />
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-pk border border-pk-border bg-white/5 p-2">
                          <div className="flex items-center gap-1 text-pk-muted">
                            <Gauge className="h-3.5 w-3.5" />
                            BPM
                          </div>
                          <div className="mt-1 font-semibold text-pk-text">
                            {typeof detailsLoop.details?.bpm === "number" && detailsLoop.details.bpm > 0 ? detailsLoop.details.bpm : "—"}
                          </div>
                        </div>
                        <div className="rounded-pk border border-pk-border bg-white/5 p-2">
                          <div className="flex items-center gap-1 text-pk-muted">
                            <Clock className="h-3.5 w-3.5" />
                            Duration
                          </div>
                          <div className="mt-1 font-semibold text-pk-text">
                            {(() => {
                              const dur = (detailsLoop.details?.duration ?? durationsSecById[detailsLoop.id]) as number | null | undefined;
                              return typeof dur === "number" && isFinite(dur) && dur > 0 ? formatTime(dur) : "—";
                            })()}
                          </div>
                        </div>
                        <div className="rounded-pk border border-pk-border bg-white/5 p-2">
                          <div className="flex items-center gap-1 text-pk-muted">
                            <KeyRound className="h-3.5 w-3.5" />
                            Key
                          </div>
                          <div className="mt-1 font-semibold text-pk-text">{detailsLoop.details?.keyScale || "—"}</div>
                        </div>
                        <div className="rounded-pk border border-pk-border bg-white/5 p-2">
                          <div className="flex items-center gap-1 text-pk-muted">
                            <Sigma className="h-3.5 w-3.5" />
                            Time Sig
                          </div>
                          <div className="mt-1 font-semibold text-pk-text">{detailsLoop.details?.timeSignature || "—"}</div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center gap-2 text-xs font-semibold text-pk-text">
                          <Info className="h-4 w-4 text-pk-muted" />
                          Details
                        </div>
                        <div className="mt-2 rounded-pk border border-pk-border bg-white/5 p-3 text-xs text-pk-text">
                          {detailsLoop.details?.caption || detailsLoop.prompt || "—"}
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs font-semibold text-pk-text">Lyrics</div>
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={!detailsLoop.details?.lyrics?.trim()}
                            onClick={() => {
                              const text = detailsLoop.details?.lyrics?.trim() ?? "";
                              if (!text) return;
                              void (async () => {
                                try {
                                  await navigator.clipboard.writeText(text);
                                  toast.success("Lyrics copied");
                                } catch {
                                  toast.error("Copy failed");
                                }
                              })();
                            }}
                            aria-label="Copy lyrics"
                            title="Copy lyrics"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <pre className="mt-2 whitespace-pre-wrap rounded-pk border border-pk-border bg-white/5 p-3 text-xs text-pk-text">
                          {detailsLoop.details?.lyrics?.trim() ? detailsLoop.details.lyrics.trim() : "—"}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map((l) => (
                  <div key={l.id}>
                    <LoopCardItem loop={l} onDelete={() => setConfirmId(l.id)} onOpenDetails={(loop) => setDetailsId(loop.id)} />
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      

      <Modal
        open={!!confirmId}
        title="Delete beat"
        description="Cette action est irréversible."
        confirmText="Delete"
        danger
        onClose={() => setConfirmId(null)}
        onConfirm={() => {
          if (!confirmId) return;
          void (async () => {
            try {
              await deleteLoopRemote(confirmId);
              toast.success("Beat supprimé");
            } catch (err) {
              const message = err instanceof Error ? err.message : "Erreur inconnue";
              toast.error(message);
            } finally {
              setConfirmId(null);
            }
          })();
        }}
      />
    </AppShell>
  );
}
