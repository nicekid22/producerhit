import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { AppShell } from "@/components/AppShell";
import { LoopDetailsPanel } from "@/components/dashboard/LoopDetailsPanel";
import { LoopDetailsSheet, LoopDetailsSheetHeader } from "@/components/dashboard/LoopDetailsSheet";
import { PrismFilterPill } from "@/components/prism/PrismFilterPill";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useLoopsStore } from "@/stores/loopsStore";
import { LoopCardItem } from "@/components/LoopCardItem";
import { useLocaleStore } from "@/stores/localeStore";
import { useMobileUiV2 } from "@/hooks/useMobileUiV2";
import { Disc3, ListMusic, Music2, Search, X } from "lucide-react";
import { PkIconLoader } from "@/components/ui/PkIconLoader";
import { dedupeLoopsById } from "@/lib/loopWorkspaceUtils";
import { genreCoverGradient } from "@/lib/genreCoverStyle";
import { cn } from "@/lib/utils";
import { LibraryVaultHero } from "@/components/library/LibraryVaultHero";
import { LibraryCollectionsRow } from "@/components/library/LibraryCollectionsRow";
import { buildLibraryCollections, loopsForCollection } from "@/lib/libraryCurations";

type Filter = "all" | "genre" | "key" | "bpm";

export default function Library() {
  const locale = useLocaleStore((s) => s.locale);
  const loops = useLoopsStore((s) => s.loops);
  const loopsTotalCount = useLoopsStore((s) => s.loopsTotalCount);
  const loopsLoading = useLoopsStore((s) => s.loading);
  const loopsSyncError = useLoopsStore((s) => s.lastSyncError);
  const loopsHydrated = useLoopsStore((s) => s.loopsHydrated);
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
  const [collectionId, setCollectionId] = useState<string | null>(null);

  const libraryLoops = useMemo(() => dedupeLoopsById(loops), [loops]);
  const collections = useMemo(() => buildLibraryCollections(libraryLoops), [libraryLoops]);
  const playlists = useMemo(() => collections.filter((c) => c.kind === "playlist"), [collections]);
  const mixtapes = useMemo(() => collections.filter((c) => c.kind === "mixtape"), [collections]);
  const scopedLoops = useMemo(
    () => loopsForCollection(libraryLoops, collectionId, collections),
    [collectionId, collections, libraryLoops],
  );

  useEffect(() => {
    if (loopsHydrated) return;
    void loadMyLoops();
  }, [loadMyLoops, loopsHydrated]);

  const filtered = useMemo(() => {
    const base = genreFilter ? scopedLoops.filter((l) => l.genre === genreFilter) : scopedLoops;
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
  }, [bpmMax, bpmMin, filter, genreFilter, scopedLoops, q]);

  const savedCount = useMemo(() => libraryLoops.filter((l) => l.isSaved).length, [libraryLoops]);
  const libraryTotalCount = loopsTotalCount ?? libraryLoops.length;
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
  const activeCollection = useMemo(
    () => (collectionId ? collections.find((c) => c.id === collectionId) ?? null : null),
    [collectionId, collections],
  );
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
    <AppShell theme="prism" variant="single">
      <div className="pk-library-page h-full space-y-4 px-4 pb-6 pt-4 md:pb-24 md:pt-6">
        <LibraryVaultHero
          isFr={isFr}
          totalCount={libraryTotalCount}
          savedCount={savedCount}
          playlistCount={playlists.length}
          mixtapeCount={mixtapes.length}
        />

        {!loopsLoading && libraryLoops.length > 0 ? (
          <div className="pk-library-collections space-y-5">
            <LibraryCollectionsRow
              title={isFr ? "Tes playlists" : "Your playlists"}
              subtitle={isFr ? "Tes morceaux, classés pour revenir écouter" : "Your tracks, curated to replay"}
              icon={ListMusic}
              collections={playlists}
              activeId={collectionId}
              isFr={isFr}
              onSelect={setCollectionId}
            />
            <LibraryCollectionsRow
              title={isFr ? "Mixtapes pour toi" : "Mixtapes for you"}
              subtitle={isFr ? "Comme Spotify — vibes auto-générées" : "Spotify-style — auto-generated vibes"}
              icon={Disc3}
              collections={mixtapes}
              activeId={collectionId}
              isFr={isFr}
              onSelect={setCollectionId}
            />
          </div>
        ) : null}

        {activeCollection ? (
          <div className="pk-library-active-filter pk-library-active-filter--collection">
            <span>
              {activeCollection.kind === "mixtape"
                ? isFr
                  ? "Mixtape"
                  : "Mixtape"
                : isFr
                  ? "Playlist"
                  : "Playlist"}
              {" · "}
              <strong>{isFr ? activeCollection.titleFr : activeCollection.titleEn}</strong>
            </span>
            <button type="button" className="pk-library-active-filter__clear" onClick={() => setCollectionId(null)}>
              <X className="h-3.5 w-3.5" />
              {isFr ? "Tout afficher" : "Show all"}
            </button>
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
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
            <div className="flex justify-center rounded-pk pk-prism-card-soft p-6">
              <PkIconLoader
                icon="library"
                size="md"
                label={locale === "fr" ? "Synchronisation…" : "Syncing…"}
                sublabel={locale === "fr" ? "On prépare ta bibliothèque cozy." : "Setting up your cozy library."}
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
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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

              <div className="pk-prism-input-shell md:max-w-xs md:flex-1">
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
            <div className="pk-prism-section-card grid gap-3 px-4 py-3 md:grid-cols-2">
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

        <div className="mt-2">
          {filtered.length === 0 ? (
            <EmptyState
              title={locale === "fr" ? "Aucun beat pour l'instant" : "No beats yet"}
              description={locale === "fr" ? "Génère ton premier beat pour démarrer." : "Generate your first beat to get started."}
            />
          ) : detailsLoop && !mobileUiV2 ? (
            <div className="md:grid md:grid-cols-[minmax(0,1fr)_400px] md:gap-4">
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
