import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Play, Tag, X } from "lucide-react";
import type { AppLocale } from "@/i18n/config";
import type { Loop } from "@/types/loop";
import type { LoopProducerTagMeta, ProducerTagFxPreset, ProducerTagPlacement } from "@producerhit/shared";
import { computeTagOffsetSec, readLoopProducerTagMeta } from "@producerhit/shared";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import {
  PRODUCER_TAG_CREDIT_COST,
  applyProducerTagToLoop,
  listProducerTags,
  removeProducerTagFromLoop,
  type ProducerTag,
} from "@/lib/producerTag";
import { readProducerTagActiveId, writeProducerTagActiveId } from "@/lib/producerTagPrefs";
import {
  BASIC_PLACEMENTS,
  EXTENDED_PLACEMENTS,
  FX_PRESETS,
  previewProducerTagMix,
} from "@/lib/producerTagPreview";
import { canUseProducerTagFx, canUseExtendedProducerTagPlacement } from "@/lib/planEntitlements";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  open: boolean;
  onClose: () => void;
  loop: Loop;
  locale: AppLocale;
  plan: string;
  creditsRemaining?: number;
  onNeedCredits?: () => void;
  onApplied?: (result: { audioUrl: string; creditConsumed: boolean; producerTag: LoopProducerTagMeta }) => void;
  onRemoved?: (audioUrl: string) => void;
};

export function ProducerTagApplyModal({
  open,
  onClose,
  loop,
  locale,
  plan,
  creditsRemaining,
  onNeedCredits,
  onApplied,
  onRemoved,
}: Props) {
  const isFr = locale === "fr";
  const [tags, setTags] = useState<ProducerTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [activeTagId, setActiveTagId] = useState<string | null>(null);
  const [placement, setPlacement] = useState<ProducerTagPlacement>("intro");
  const [fxPreset, setFxPreset] = useState<ProducerTagFxPreset>("clean");
  const [volumeDb, setVolumeDb] = useState(-3);
  const [variantId, setVariantId] = useState("");

  const existingMeta = useMemo(() => readLoopProducerTagMeta(loop.stemsUrl), [loop.stemsUrl]);
  const alreadyTagged = Boolean(existingMeta?.tagId);
  const extendedPlacement = canUseExtendedProducerTagPlacement(plan);
  const extendedFx = canUseProducerTagFx(plan);
  const placements = extendedPlacement ? EXTENDED_PLACEMENTS : BASIC_PLACEMENTS;

  const activeTag = tags.find((t) => t.id === activeTagId) ?? null;
  const variants = activeTag?.settings_json?.variants ?? [];

  const loadTags = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listProducerTags();
      setTags(res.tags);
      const stored = readProducerTagActiveId();
      const pick = stored && res.tags.some((t) => t.id === stored) ? stored : res.tags[0]?.id ?? null;
      setActiveTagId(pick);
    } catch {
      setTags([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void loadTags();
    if (existingMeta?.placement) setPlacement(existingMeta.placement);
    if (existingMeta?.fxPreset) setFxPreset(existingMeta.fxPreset);
    if (typeof existingMeta?.volumeDb === "number") setVolumeDb(existingMeta.volumeDb);
  }, [open, loadTags, existingMeta]);

  const getTagSignedUrl = async (path: string) => {
    const { data, error } = await supabase.storage.from("producer-tags").createSignedUrl(path, 3600);
    if (error || !data?.signedUrl) throw error ?? new Error("signed_url_failed");
    return data.signedUrl;
  };

  const handlePreview = async () => {
    if (!loop.audioUrl || !activeTag) return;
    setPreviewBusy(true);
    try {
      const tagPath =
        variantId && variants.find((v) => v.id === variantId)?.storagePath
          ? variants.find((v) => v.id === variantId)!.storagePath
          : activeTag.storage_path;
      const tagUrl = await getTagSignedUrl(tagPath);
      const durationSec = loop.details?.duration ?? 120;
      const tagDurationSec = activeTag.duration_sec ?? 2.5;
      const offsetSec = computeTagOffsetSec({
        bpm: loop.bpm ?? loop.details?.bpm ?? undefined,
        durationSec,
        tagDurationSec,
        placement,
        randomSeed: loop.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0),
      });
      const session = await previewProducerTagMix({
        beatUrl: loop.audioUrl,
        tagUrl,
        offsetSec,
        volumeDb,
        durationSec: Math.min(durationSec, offsetSec + tagDurationSec + 4),
      });
      window.setTimeout(() => session.stop(), Math.min(durationSec, offsetSec + tagDurationSec + 4) * 1000);
    } catch {
      toast.error(isFr ? "Preview impossible" : "Preview failed");
    } finally {
      setPreviewBusy(false);
    }
  };

  const handleApply = async () => {
    if (!activeTagId || !loop.audioUrl) return;
    if (!alreadyTagged && (creditsRemaining ?? 0) < PRODUCER_TAG_CREDIT_COST) {
      onNeedCredits?.();
      return;
    }
    setBusy(true);
    try {
      const result = await applyProducerTagToLoop({
        loopId: loop.id,
        tagId: activeTagId,
        placement,
        volumeDb,
        fxPreset: extendedFx ? fxPreset : "clean",
        variantId: variantId || undefined,
      });
      writeProducerTagActiveId(activeTagId);
      onApplied?.({
        audioUrl: result.audioUrl,
        creditConsumed: result.creditConsumed,
        producerTag: result.producerTag,
      });
      toast.success(
        result.creditConsumed
          ? isFr
            ? "Tag appliqué (1 crédit)"
            : "Tag applied (1 credit)"
          : isFr
            ? "Tag mis à jour"
            : "Tag updated",
      );
      onClose();
    } catch (e) {
      if (e instanceof Error && e.message === "no_credits") {
        onNeedCredits?.();
        return;
      }
      toast.error(isFr ? "Échec application tag" : "Failed to apply tag");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    setBusy(true);
    try {
      const url = await removeProducerTagFromLoop(loop.id);
      onRemoved?.(url);
      toast.success(isFr ? "Tag retiré" : "Tag removed");
      onClose();
    } catch {
      toast.error(isFr ? "Échec retrait" : "Remove failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isFr ? "Appliquer mon tag producteur" : "Apply producer tag"}
      description={
        alreadyTagged
          ? isFr
            ? "Repositionner ou changer de tag — gratuit sur ce morceau."
            : "Reposition or change tag — free on this track."
          : isFr
            ? `1 crédit la première fois sur ce morceau.`
            : `1 credit the first time on this track.`
      }
      confirmText={isFr ? "Appliquer" : "Apply"}
      onConfirm={() => void handleApply()}
      hideFooter
    >
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-white/50" />
          </div>
        ) : tags.length === 0 ? (
          <p className="text-sm text-white/60">
            {isFr ? "Crée un tag dans Tag Studio d'abord." : "Create a tag in Tag Studio first."}
          </p>
        ) : (
          <>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-white/45">
                {isFr ? "Tag" : "Tag"}
              </p>
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setActiveTagId(t.id);
                      setVariantId("");
                    }}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm",
                      activeTagId === t.id
                        ? "border-violet-400/60 bg-violet-500/15 text-white"
                        : "border-white/10 text-white/70",
                    )}
                  >
                    <Tag className="mr-1 inline h-3.5 w-3.5" />
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {variants.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-white/45">
                  {isFr ? "Variante" : "Variant"}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs",
                      !variantId ? "border-violet-400/60 bg-violet-500/15" : "border-white/10",
                    )}
                    onClick={() => setVariantId("")}
                  >
                    Original
                  </button>
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs",
                        variantId === v.id ? "border-violet-400/60 bg-violet-500/15" : "border-white/10",
                      )}
                      onClick={() => setVariantId(v.id)}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-white/45">
                {isFr ? "Placement" : "Placement"}
              </p>
              <div className="flex flex-wrap gap-2">
                {placements.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlacement(p)}
                    className={cn(
                      "rounded-lg border px-2.5 py-1 text-xs capitalize",
                      placement === p ? "border-violet-400/60 bg-violet-500/15" : "border-white/10",
                    )}
                  >
                    {p.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>

            {extendedFx ? (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-white/45">FX</p>
                <div className="flex flex-wrap gap-2">
                  {FX_PRESETS.map((fx) => (
                    <button
                      key={fx.id}
                      type="button"
                      onClick={() => setFxPreset(fx.id)}
                      className={cn(
                        "rounded-lg border px-2.5 py-1 text-xs",
                        fxPreset === fx.id ? "border-violet-400/60 bg-violet-500/15" : "border-white/10",
                      )}
                    >
                      {isFr ? fx.labelFr : fx.labelEn}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <label className="text-xs text-white/50">
                {isFr ? "Volume tag" : "Tag volume"} ({volumeDb} dB)
              </label>
              <input
                type="range"
                min={-12}
                max={0}
                step={1}
                value={volumeDb}
                onChange={(e) => setVolumeDb(Number(e.target.value))}
                className="mt-1 w-full"
              />
            </div>
          </>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={busy}>
            <X className="mr-1 h-4 w-4" />
            {isFr ? "Fermer" : "Close"}
          </Button>
          {tags.length > 0 ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => void handlePreview()} disabled={previewBusy || busy}>
                {previewBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="mr-1 h-4 w-4" />}
                Preview
              </Button>
              <Button variant="primary" size="sm" onClick={() => void handleApply()} disabled={busy || !activeTagId}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : isFr ? "Appliquer" : "Apply"}
              </Button>
            </>
          ) : null}
          {alreadyTagged ? (
            <Button variant="secondary" size="sm" onClick={() => void handleRemove()} disabled={busy}>
              {isFr ? "Retirer le tag" : "Remove tag"}
            </Button>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
