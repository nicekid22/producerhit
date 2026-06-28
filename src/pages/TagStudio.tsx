import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { ProducerTagCreateForm, ProducerTagGrid } from "@/components/producerTag/ProducerTagCreateForm";
import { useAuthStore } from "@/stores/authStore";
import { useLocaleStore } from "@/stores/localeStore";
import { useResolvedPlan } from "@/hooks/useResolvedPlan";
import { canUseProducerTag } from "@/lib/planEntitlements";
import { deleteProducerTag, listProducerTags, type ProducerTag } from "@/lib/producerTag";
import { readProducerTagActiveId, writeProducerTagActiveId } from "@/lib/producerTagPrefs";
import { useGrowthUpsellStore } from "@/stores/growthUpsellStore";
import toast from "react-hot-toast";
import { Tag } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function TagStudioPage() {
  const locale = useLocaleStore((s) => s.locale);
  const isFr = locale === "fr";
  const user = useAuthStore((s) => s.user);
  const { plan, ready: planReady } = useResolvedPlan();
  const openUpsell = useGrowthUpsellStore((s) => s.openUpsell);
  const [tags, setTags] = useState<ProducerTag[]>([]);
  const [activeId, setActiveId] = useState<string | null>(readProducerTagActiveId());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
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
  }, [user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const planOk = canUseProducerTag(plan);

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-violet-300">
            <Tag className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-wide">Tag Studio</span>
          </div>
          <h1 className="text-2xl font-semibold text-white">
            {isFr ? "Mon tag producteur" : "My producer tag"}
          </h1>
          <p className="text-sm text-white/60">
            {isFr
              ? "Upload gratuit. Applique sur un morceau après génération (1 crédit max par morceau)."
              : "Free upload. Apply on a track after generation (1 credit max per track)."}
          </p>
        </header>

        {!planReady ? null : !planOk ? (
          <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-5">
            <p className="text-sm text-amber-100/90">
              {isFr ? "Disponible avec Pro, Studio ou Plus." : "Available on Pro, Studio, or Plus."}
            </p>
            <Button variant="primary" size="sm" className="mt-3" onClick={() => openUpsell("feature_producer_tag")}>
              {isFr ? "Voir les offres" : "View plans"}
            </Button>
          </div>
        ) : user?.id ? (
          <>
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
            <section className="space-y-3">
              <h2 className="text-lg font-medium text-white">{isFr ? "Mes tags" : "My tags"}</h2>
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
                  onDelete={(id) => {
                    void (async () => {
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
                    })();
                  }}
                />
              )}
            </section>
            <p className="text-xs text-white/40">
              {isFr ? "Ensuite, ouvre un morceau et clique " : "Then open a track and click "}
              <strong>{isFr ? "Appliquer mon tag" : "Apply my tag"}</strong>
              {isFr ? " dans la fiche détail." : " in track details."}
              {" "}
              <Link to="/library" className="text-violet-300 underline">
                {isFr ? "Bibliothèque" : "Library"}
              </Link>
            </p>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
