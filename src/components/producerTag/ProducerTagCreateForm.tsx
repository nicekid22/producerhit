import { useCallback, useEffect, useRef, useState } from "react";
import type { AppLocale } from "@/i18n/config";
import toast from "react-hot-toast";
import { Loader2, Mic, Square, Tag, Upload } from "lucide-react";
import { trackClientEvent } from "@/lib/supabaseClient";
import { useVoiceAudioCapture } from "@/hooks/useVoiceAudioCapture";
import { cn } from "@/lib/utils";
import {
  PRODUCER_TAG_ACCEPT,
  PRODUCER_TAG_MAX_RECORD_SEC,
  producerTagMaxCount,
  producerTagSampleToRecord,
  type ProducerTag,
} from "@/lib/producerTag";
import { writeProducerTagActiveId } from "@/lib/producerTagPrefs";
import { Button } from "@/components/ui/Button";

type Props = {
  locale: AppLocale;
  userId: string;
  plan: string;
  tagCount: number;
  onCreated: (tag: ProducerTag) => void;
  onUpsell?: () => void;
};

export function ProducerTagCreateForm({ locale, userId, plan, tagCount, onCreated, onUpsell }: Props) {
  const isFr = locale === "fr";
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<"capture" | "name">("capture");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [tagName, setTagName] = useState(isFr ? "Mon tag" : "My tag");
  const maxTags = producerTagMaxCount(plan);
  const atLimit = tagCount >= maxTags;

  const resetCapture = useCallback(() => {
    setStep("capture");
    setPendingFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  }, [previewUrl]);

  const onFileReady = useCallback(
    (file: File) => {
      if (atLimit) {
        toast.error(isFr ? `Max ${maxTags} tag(s)` : `Max ${maxTags} tag(s)`);
        onUpsell?.();
        return;
      }
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPendingFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setStep("name");
    },
    [atLimit, isFr, maxTags, onUpsell, previewUrl],
  );

  const { recording, recordSec, startRecording, stopRecording } = useVoiceAudioCapture({
    maxSec: PRODUCER_TAG_MAX_RECORD_SEC,
    onComplete: onFileReady,
    onTooShort: () => toast.error(isFr ? "Enregistrement trop court" : "Recording too short"),
  });

  const saveTag = async () => {
    if (!pendingFile) return;
    setBusy(true);
    try {
      const tag = await producerTagSampleToRecord(userId, pendingFile, tagName, recordSec || undefined);
      writeProducerTagActiveId(tag.id);
      onCreated(tag);
      trackClientEvent("producer_tag_upload", { tagId: tag.id });
      toast.success(isFr ? "Tag enregistré" : "Tag saved");
      resetCapture();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : isFr ? "Échec" : "Failed");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  if (step === "name" && pendingFile) {
    return (
      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        {previewUrl ? <audio controls src={previewUrl} className="w-full" /> : null}
        <label className="block text-sm text-white/70">{isFr ? "Nom du tag" : "Tag name"}</label>
        <input
          value={tagName}
          onChange={(e) => setTagName(e.target.value.slice(0, 80))}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
        />
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={resetCapture} disabled={busy}>
            {isFr ? "Retour" : "Back"}
          </Button>
          <Button variant="primary" size="sm" onClick={() => void saveTag()} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : isFr ? "Enregistrer" : "Save"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-sm text-white/65">
        {isFr
          ? "Enregistre ou importe un jingle court (3–8 s) — gratuit avec Pro+."
          : "Record or upload a short jingle (3–8 s) — free with Pro+."}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant={recording ? "secondary" : "primary"}
          size="sm"
          disabled={atLimit || busy}
          onClick={() => {
            if (recording) stopRecording();
            else void startRecording().catch(() => toast.error(isFr ? "Micro indisponible" : "Mic unavailable"));
          }}
        >
          {recording ? <Square className="mr-1.5 h-4 w-4" /> : <Mic className="mr-1.5 h-4 w-4" />}
          {recording
            ? `${isFr ? "Stop" : "Stop"} (${recordSec}s)`
            : isFr
              ? "Enregistrer"
              : "Record"}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={atLimit || busy}
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="mr-1.5 h-4 w-4" />
          {isFr ? "Importer" : "Upload"}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept={PRODUCER_TAG_ACCEPT}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFileReady(f);
            e.target.value = "";
          }}
        />
      </div>
      {atLimit ? (
        <p className={cn("text-xs text-amber-300/90")}>
          {isFr ? `Limite ${maxTags} tags — upgrade pour plus.` : `Limit ${maxTags} tags — upgrade for more.`}
        </p>
      ) : null}
    </div>
  );
}

export function ProducerTagGrid({
  locale,
  tags,
  activeId,
  onSelect,
  onDelete,
}: {
  locale: AppLocale;
  tags: ProducerTag[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const isFr = locale === "fr";
  if (!tags.length) {
    return (
      <p className="text-sm text-white/50">{isFr ? "Aucun tag pour l'instant." : "No tags yet."}</p>
    );
  }
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {tags.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-center justify-between rounded-xl border px-3 py-2",
            activeId === t.id ? "border-violet-400/50 bg-violet-500/10" : "border-white/10 bg-white/[0.02]",
          )}
        >
          <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => onSelect(t.id)}>
            <Tag className="h-4 w-4 shrink-0 text-violet-300" />
            <span className="truncate text-sm font-medium text-white">{t.name}</span>
          </button>
          <button
            type="button"
            className="ml-2 text-xs text-white/45 hover:text-red-300"
            onClick={() => onDelete(t.id)}
          >
            {isFr ? "Suppr." : "Delete"}
          </button>
        </div>
      ))}
    </div>
  );
}
