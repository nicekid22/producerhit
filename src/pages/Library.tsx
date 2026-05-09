import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useLoopsStore } from "@/stores/loopsStore";
import { LoopCardItem } from "@/components/LoopCardItem";
import { useLocaleStore } from "@/stores/localeStore";
import { Clock, Copy, Gauge, Info, KeyRound, Sigma, X } from "lucide-react";

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
  const detailsLoop = useMemo(() => (detailsId ? loops.find((l) => l.id === detailsId) ?? null : null), [detailsId, loops]);

  return (
    <AppShell
      left={
        <div className="h-full bg-pk-panel">
          <div className="p-4">
            <div className="text-sm font-semibold">{locale === "fr" ? "Bibliothèque" : "Library"}</div>
            <div className="mt-2 text-sm text-pk-muted">
              {locale === "fr"
                ? `${totalCount} beat${totalCount > 1 ? "s" : ""} · ${savedCount} sauvegardé${savedCount > 1 ? "s" : ""}`
                : `${totalCount} beat${totalCount > 1 ? "s" : ""} · ${savedCount} saved`}
            </div>
            <div className="mt-4 rounded-pk border border-pk-border bg-pk-bg p-4 text-sm text-pk-muted">
              {locale === "fr"
                ? "Astuce: utilise les filtres en haut pour retrouver vite une vibe (genre, tonalité, BPM)."
                : "Tip: use the filters to quickly find a vibe (genre, key, BPM)."}
            </div>
          </div>
        </div>
      }
    >
      <div className="h-full px-4 pb-36 pt-6 md:pb-24">
        <div className="flex flex-col gap-4">
          <div>
            <div className="text-lg font-semibold">{locale === "fr" ? "Bibliothèque" : "Library"}</div>
            <div className="mt-1 text-sm text-pk-muted">
              {locale === "fr" ? "Historique de tes beats (générés + sauvegardés)" : "History of your beats (generated + saved)"}
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-pk border border-pk-border bg-pk-panel p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              <Button variant={filter === "all" ? "primary" : "secondary"} size="sm" onClick={() => setFilter("all")}>
                {locale === "fr" ? "Tout" : "All"}
              </Button>
              <Button variant={filter === "genre" ? "primary" : "secondary"} size="sm" onClick={() => setFilter("genre")}>
                {locale === "fr" ? "Par genre" : "By Genre"}
              </Button>
              <Button variant={filter === "key" ? "primary" : "secondary"} size="sm" onClick={() => setFilter("key")}>
                {locale === "fr" ? "Par tonalité" : "By Key"}
              </Button>
              <Button variant={filter === "bpm" ? "primary" : "secondary"} size="sm" onClick={() => setFilter("bpm")}>
                {locale === "fr" ? "Par BPM" : "By BPM range"}
              </Button>
            </div>

            <div className="flex flex-1 items-center gap-2 md:max-w-md">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full rounded-pk border border-pk-border bg-pk-input px-3 py-2 text-sm outline-none placeholder:text-pk-muted focus:border-pk-accent"
                placeholder={locale === "fr" ? "Rechercher…" : "Search beats…"}
              />
            </div>
          </div>

          {filter === "bpm" ? (
            <div className="grid gap-3 rounded-pk border border-pk-border bg-pk-panel p-4 md:grid-cols-2">
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
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((l) => (
                <div key={l.id}>
                  <LoopCardItem loop={l} onDelete={() => setConfirmId(l.id)} onOpenDetails={() => setDetailsId(l.id)} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {detailsLoop ? (
        <div className="fixed inset-0 z-40">
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-black/50"
            aria-label="Close details"
            onClick={() => setDetailsId(null)}
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-[420px] overflow-y-auto border-l border-pk-border bg-pk-panel/95 p-5 backdrop-blur">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#7c3aed]/20 to-transparent" />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{detailsLoop.name}</div>
                <div className="mt-1 text-xs text-pk-muted">{detailsLoop.genre}</div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setDetailsId(null)} aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
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
