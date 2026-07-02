import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocaleStore } from "@/stores/localeStore";
import { useAuthStore } from "@/stores/authStore";
import { useResolvedPlan } from "@/hooks/useResolvedPlan";
import { canUseProducerTag } from "@/lib/planEntitlements";
import { deleteProducerTag, listProducerTags, type ProducerTag } from "@/lib/producerTag";
import { readProducerTagActiveId, writeProducerTagActiveId } from "@/lib/producerTagPrefs";
import { useGrowthUpsellStore } from "@/stores/growthUpsellStore";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { ProducerTagCreateForm, ProducerTagGrid } from "@/components/producerTag/ProducerTagCreateForm";

type Props = {
  open: boolean;
  loopName?: string;
  onClose: () => void;
};

export function TagStudioModal({ open, loopName, onClose }: Props) {
  const locale = useLocaleStore((s) => s.locale);
  const isFr = locale === "fr";
  const user = useAuthStore((s) => s.user);
  const { plan, ready: planReady } = useResolvedPlan();
  const openUpsell = useGrowthUpsellStore((s) => s.openUpsell);
  const [tags, setTags] = useState<ProducerTag[]>([]);
  const [activeId, setActiveId] = useState<string | null>(readProducerTagActiveId());
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await listProducerTags();
      setTags(res.tags);
      const stored = readProducerTagActiveId();
      if (stored && res.tags.some((t) => t.id === stored)) setActiveId(stored);
      else if (res.tags[0]?.id) setActiveId(res.tags[0].id);
    } catch {
      setTags([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    void refresh();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const planOk = canUseProducerTag(plan);

  return createPortal(
    <div className={cn("pk-studio-modal-root", "fixed inset-0 z-[140] flex items-center justify-center")} role="dialog" aria-modal="true" aria-label={isFr ? "Tag Studio" : "Tag Studio"}>
      <button type="button" className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} aria-label={isFr ? "Fermer" : "Close"} />
      <div className={cn("pk-studio-modal", "relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border border-white/10 bg-pk-panel p-4 shadow-2xl md:p-6")} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-violet-300">
            <Tag className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-wide">{isFr ? "Tag Studio" : "Tag Studio"}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label={isFr ? "Fermer" : "Close"}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/60">
          {isFr
            ? `Tag appliqué depuis : ${loopName ?? "ce morceau"}`
            : `Tag session for: ${loopName ?? "this track"}`}
        </div>

        {!planReady ? null : !planOk ? (
          <div className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-5">
            <p className="text-sm text-amber-100/90">
              {isFr ? "Disponible avec Pro, Studio ou Plus." : "Available on Pro, Studio, or Plus."}
            </p>
            <Button variant="primary" size="sm" className="mt-3" onClick={() => openUpsell("feature_producer_tag")}>
              {isFr ? "Voir les offres" : "View plans"}
            </Button>
          </div>
        ) : user?.id ? (
          <div className="mt-4 space-y-4">
            <ProducerTagCreateForm
              locale={locale}
              userId={user.id}
              plan={plan}
              tagCount={tags.length}
              onCreated={(tag) => {
                setTags((prev) => [tag, ...prev]);
                setActiveId(tag.id);
              }}
              onUpsell={() => openUpsell("feature_producer_tag")}
            />
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-white">{isFr ? "Mes tags" : "My tags"}</h3>
              {loading ? (
                <p className="text-sm text-white/50">{isFr ? "Chargement…" : "Loading…"}</p>
              ) : (
                <ProducerTagGrid
                  locale={locale}
                  tags={tags}
                  activeId={activeId}
                  onSelect={(id) => {
                    setActiveId(id);
                    writeProducerTagActiveId(id);
                  }}
                  onDelete={async (id) => {
                    try {
                      await deleteProducerTag(id);
                      setTags((prev) => prev.filter((t) => t.id !== id));
                      if (activeId === id) {
                        writeProducerTagActiveId(null);
                        setActiveId(null);
                      }
                      toast.success(isFr ? "Tag supprimé" : "Tag deleted");
                    } catch {
                      toast.error(isFr ? "Échec" : "Failed");
                    }
                  }}
                />
              )}
            </section>
            <p className="text-xs text-white/40">
              {isFr
                ? "Tu peux ensuite appliquer ce tag depuis la fiche détail du morceau."
                : "You can apply this tag from the track details panel."}
            </p>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
