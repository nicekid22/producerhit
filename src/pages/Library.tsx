import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { AppShell } from "@/components/AppShell";
import { AppShellAsideHeader } from "@/components/AppShellAsideHeader";
import { LoopDetailsPanel } from "@/components/dashboard/LoopDetailsPanel";
import { LoopDetailsSheet, LoopDetailsSheetHeader } from "@/components/dashboard/LoopDetailsSheet";
import { PrismFilterPill } from "@/components/prism/PrismFilterPill";
import { PrismPageHero } from "@/components/prism/PrismPageHero";
import { PrismStat } from "@/components/prism/PrismStat";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useLoopsStore } from "@/stores/loopsStore";
import { LoopCardItem } from "@/components/LoopCardItem";
import { useLocaleStore } from "@/stores/localeStore";
import { useMobileUiV2 } from "@/hooks/useMobileUiV2";
import { Bookmark, Disc3, Layers, Music2, Search, Sparkles, X } from "lucide-react";
import { PkIconLoader } from "@/components/ui/PkIconLoader";
import { dedupeLoopsById } from "@/lib/loopWorkspaceUtils";
import { genreCoverGradient } from "@/lib/genreCoverStyle";
import { cn } from "@/lib/utils";

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
  const loopsTotalCount = useLoopsStore((s) => s.loopsTotalCount);
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
  const [genreFilter, setGenreFilter] = useState<string | null>(null);

  const libraryLoops = useMemo(() => dedupeLoopsById(loops), [loops]);

  useEffect(() => {
    void loadMyLoops();
  }, [loadMyLoops]);

  const filtered = useMemo(() => {
    const base = genreFilter ? libraryLoops.filter((l) => l.genre === genreFilter) : libraryLoops;
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
  }, [bpmMax, bpmMin, filter, genreFilter, libraryLoops, q]);

  const savedCount = useMemo(() => libraryLoops.filter((l) => l.isSaved).length, [libraryLoops]);
  const libraryTotalCount = loopsTotalCount ?? libraryLoops.length;
  const genreCount = useMemo(() => new Set(libraryLoops.map((l) => l.genre).filter(Boolean)).size, [libraryLoops]);
  const topGenres = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of libraryLoops) {
      if (!l.genre) continue;
      counts.set(l.genre, (counts.get(l.genre) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [libraryLoops]);
  const detailsLoop = useMemo(
    () => (detailsId ? libraryLoops.find((l) => l.id === detailsId) ?? null : null),
    [detailsId, libraryLoops],
  );
  const mobileUiV2 = useMobileUiV2();
  const renameLoopRemote = useLoopsStore((s) => s.renameLoopRemote);
  const [detailsTitle, setDetailsTitle] = useState("");
  const [savingDetailsTitle, setSavingDetailsTitle] = useState(false);
  useEffect(() => {
    setDetailsTitle(detailsLoop?.name ?? "");
  }, [detailsLoop?.id, detailsLoop?.name]);
  const saveDetailsTitle = useCallback(() => {
    if (!detailsLoop) return;
    const next = detailsTitle.trim();
    if (!next || next === detailsLoop.name) return;
    void (async () => {
      setSavingDetailsTitle(true);
      try {
        await renameLoopRemote(detailsLoop.id, next);
        toast.success(locale === "fr" ? "Titre mis à jour" : "Title updated");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : locale === "fr" ? "Erreur" : "Error");
      } finally {
        setSavingDetailsTitle(false);
      }
    })();
  }, [detailsLoop, detailsTitle, locale, renameLoopRemote]);
  const isFr = locale === "fr";

  return (
    <AppShell
      theme="prism"
      variant={mobileUiV2 ? "single" : "split"}
      left={mobileUiV2 ? undefined : 
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
            { label: isFr ? "Total" : "Total", value: libraryTotalCount },
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
                  <button
                    key={g}
                    type="button"
                    className="pk-prism-vibe-chip transition-opacity hover:opacity-90"
                    onClick={() => {
                      setGenreFilter((prev) => (prev === g ? null : g));
                      setQ("");
                    }}
                  >
                    {g} · {n}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <Link
            to="/dashboard"
            className="pk-prism-btn mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {isFr ? "Nouveau beat" : "New beat"}
          </Link>
        </AppShellAsideHeader>
      }
    >
      <div className="pk-library-page h-full space-y-5 px-4 pt-6">
        <PrismPageHero
          className="pk-library-hero"
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
            <PrismStat label={isFr ? "Beats" : "Beats"} value={libraryTotalCount} icon={<Disc3 className="h-4 w-4" />} accent="cyan" />
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
            <div className="flex justify-center rounded-pk pk-prism-card-soft p-8">
              <PkIconLoader
                icon="library"
                size="md"
                label={locale === "fr" ? "Synchronisation…" : "Syncing…"}
                sublabel={locale === "fr" ? "Chargement de tes créations." : "Loading your creations."}
              />
            </div>
          ) : null}

          {topGenres.length ? (
            <div className="pk-library-genre-banners">
              <button
                type="button"
                className={cn(
                  "pk-library-genre-tile",
                  !genreFilter ? "pk-library-genre-tile--active" : "",
                )}
                onClick={() => setGenreFilter(null)}
              >
                <Music2 className="pk-library-genre-tile__icon" aria-hidden />
                <span className="pk-library-genre-tile__label">{isFr ? "Tout le vault" : "All vault"}</span>
                <span className="pk-library-genre-tile__count">{libraryLoops.length}</span>
              </button>
              {topGenres.map(([g, n]) => (
                <button
                  key={g}
                  type="button"
                  className={cn(
                    "pk-library-genre-tile",
                    genreFilter === g ? "pk-library-genre-tile--active" : "",
                  )}
                  style={{ backgroundImage: genreCoverGradient(g) }}
                  onClick={() => {
                    setGenreFilter((prev) => (prev === g ? null : g));
                    setQ("");
                  }}
                >
                  <span className="pk-library-genre-tile__label">{g}</span>
                  <span className="pk-library-genre-tile__count">{n}</span>
                </button>
              ))}
            </div>
          ) : null}

          {genreFilter ? (
            <div className="pk-library-active-filter">
              <span>
                {isFr ? "Filtre" : "Filter"} · <strong>{genreFilter}</strong>
              </span>
              <button type="button" className="pk-library-active-filter__clear" onClick={() => setGenreFilter(null)}>
                <X className="h-3.5 w-3.5" />
                {isFr ? "Effacer" : "Clear"}
              </button>
            </div>
          ) : null}

          <div className="pk-prism-section-card pk-library-toolbar">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-2 pk-chip-scroll md:overflow-visible">
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
            detailsLoop && !mobileUiV2 ? (
              <div className="md:grid md:grid-cols-[minmax(0,1fr)_420px] md:gap-4">
                <div>
                  <div className="pk-library-grid">
                    {filtered.map((l) => (
                      <LoopCardItem
                        key={l.id}
                        loop={l}
                        cardVariant="library"
                        compact={mobileUiV2}
                        queueLoops={filtered}
                        queueSource="library"
                        onDelete={() => setConfirmId(l.id)}
                        onOpenDetails={(loop) => setDetailsId((prev) => (prev === loop.id ? null : loop.id))}
                      />
                    ))}
                  </div>
                </div>

                <div className="hidden md:block">
                  <div className="sticky top-6 max-h-[calc(100vh-32px)] overflow-y-auto">
                    <div className="pk-library-detail-panel pk-studio-detail-panel relative overflow-hidden rounded-2xl p-5 backdrop-blur">
                      <div className="pk-prism-panel-glow" />
                      <LoopDetailsSheetHeader
                        title={detailsLoop.name}
                        subtitle={detailsLoop.genre}
                        onClose={() => setDetailsId(null)}
                        closeLabel={isFr ? "Fermer" : "Close"}
                      />
                      <LoopDetailsPanel
                        loop={detailsLoop}
                        locale={locale}
                        detailsTitle={detailsTitle}
                        onDetailsTitleChange={setDetailsTitle}
                        savingDetailsTitle={savingDetailsTitle}
                        onSaveTitle={saveDetailsTitle}
                        durationSec={durationsSecById[detailsLoop.id]}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="pk-library-grid">
                {filtered.map((l) => (
                  <LoopCardItem
                    key={l.id}
                    loop={l}
                    cardVariant="library"
                    compact={mobileUiV2}
                    queueLoops={filtered}
                    onDelete={() => setConfirmId(l.id)}
                    onOpenDetails={(loop) => setDetailsId(loop.id)}
                  />
                ))}
              </div>
            )
          )}
        </div>
      </div>

      

      {mobileUiV2 && detailsLoop ? (
        <LoopDetailsSheet
          open
          onClose={() => setDetailsId(null)}
          title={detailsLoop.name}
          subtitle={detailsLoop.genre}
          closeLabel={isFr ? "Fermer" : "Close"}
        >
          <LoopDetailsPanel
            loop={detailsLoop}
            locale={locale}
            detailsTitle={detailsTitle}
            onDetailsTitleChange={setDetailsTitle}
            savingDetailsTitle={savingDetailsTitle}
            onSaveTitle={saveDetailsTitle}
            durationSec={durationsSecById[detailsLoop.id]}
            compact
          />
        </LoopDetailsSheet>
      ) : null}

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
