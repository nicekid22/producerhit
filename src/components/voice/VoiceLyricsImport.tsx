import { useCallback, useEffect, useRef, useState } from "react";
import type { AppLocale } from "@/i18n/config";
import toast from "react-hot-toast";
import { Loader2, Mic, Square, Upload } from "lucide-react";
import { DiscreetInfoTip } from "@/components/dashboard/DiscreetInfoTip";
import { useVoiceAudioCapture } from "@/hooks/useVoiceAudioCapture";
import { cn } from "@/lib/utils";
import {
  VOICE_ACCEPT,
  getVoiceToSongRemaining,
  hasUnlimitedVoiceToSong,
  voiceFileToLyrics,
  voiceToSongMonthlyLimit,
} from "@/lib/voiceToSong";

type Props = {
  locale: AppLocale;
  userId: string;
  plan: string;
  used: number;
  onTranscript: (text: string) => void;
  onUsageUpdate?: (used: number) => void;
  onUpsell?: () => void;
};

export function VoiceLyricsImport({ locale, userId, plan, used, onTranscript, onUsageUpdate, onUpsell }: Props) {
  const isFr = locale === "fr";
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [localUsed, setLocalUsed] = useState(used);
  const remaining = getVoiceToSongRemaining(plan, localUsed);
  const unlimited = hasUnlimitedVoiceToSong(plan);

  useEffect(() => setLocalUsed(used), [used]);

  const runTranscribe = useCallback(
    async (file: File) => {
      if (remaining <= 0 && !unlimited) {
        toast.error(isFr ? "Essais transcription épuisés" : "Transcription trials used up");
        onUpsell?.();
        return;
      }
      setBusy(true);
      try {
        const result = await voiceFileToLyrics(userId, file);
        onTranscript(result.text);
        setLocalUsed(result.used);
        onUsageUpdate?.(result.used);
        toast.success(isFr ? "Paroles extraites" : "Lyrics extracted");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "error";
        if (msg === "limit_reached") {
          toast.error(isFr ? "Quota voix atteint" : "Voice quota reached");
          onUpsell?.();
        } else if (msg === "file_too_large") {
          toast.error(isFr ? "Max 12 Mo" : "Max 12 MB");
        } else if (msg === "gemini_failed" || msg === "no_transcribe_backend") {
          toast.error(
            isFr
              ? "Transcription indisponible (API Gemini) — réessaie plus tard"
              : "Transcription unavailable (Gemini API) — try again later",
          );
        } else if (msg === "audio_too_short") {
          toast.error(isFr ? "Audio trop court" : "Audio too short");
        } else {
          toast.error(isFr ? "Échec — réessaie" : "Failed — try again");
        }
      } finally {
        setBusy(false);
      }
    },
    [isFr, onTranscript, onUpsell, onUsageUpdate, remaining, unlimited, userId],
  );

  const { recording, recordSec, startRecording, stopRecording } = useVoiceAudioCapture({
    onComplete: (file) => void runTranscribe(file),
    onTooShort: () => toast.error(isFr ? "Enregistrement trop court" : "Recording too short"),
  });

  const quotaLabel = unlimited
    ? isFr
      ? "Illimité"
      : "Unlimited"
    : `${remaining}/${voiceToSongMonthlyLimit(plan)}`;

  return (
    <div className="pk-voice-lyrics-import mt-2 flex flex-wrap items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-pk-muted">
        {isFr ? "Importer depuis ma voix" : "Import from my voice"}
      </span>
      <DiscreetInfoTip
        text={
          isFr
            ? "Enregistre ou upload un extrait — on transcrit en paroles."
            : "Record or upload a clip — we transcribe it into lyrics."
        }
      />
      <span className="text-[10px] text-pk-muted">{quotaLabel}</span>
      <div className="ml-auto flex flex-wrap gap-1.5">
        <VoiceActionBtn
          busy={busy}
          recording={recording}
          recordSec={recordSec}
          isFr={isFr}
          onClick={() => (recording ? stopRecording() : void startRecording().catch(() => toast.error(isFr ? "Accès micro refusé" : "Microphone denied")))}
        />
        <button
          type="button"
          disabled={busy || recording}
          onClick={() => inputRef.current?.click()}
          className="pk-voice-to-song__btn inline-flex items-center gap-1 rounded-full bg-white/8 px-2.5 py-1 text-[10px] font-semibold text-white/80 hover:bg-white/12 disabled:opacity-50"
        >
          <Upload className="h-3 w-3" aria-hidden />
          {isFr ? "Fichier" : "File"}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={VOICE_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void runTranscribe(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function VoiceActionBtn({
  busy,
  recording,
  recordSec,
  isFr,
  onClick,
}: {
  busy: boolean;
  recording: boolean;
  recordSec: number;
  isFr: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className={cn(
        "pk-voice-to-song__btn inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors",
        recording ? "bg-red-500/20 text-red-200 ring-1 ring-red-400/40" : "bg-white/8 text-white/80 hover:bg-white/12",
      )}
    >
      {busy ? (
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
      ) : recording ? (
        <Square className="h-3 w-3" fill="currentColor" aria-hidden />
      ) : (
        <Mic className="h-3 w-3" aria-hidden />
      )}
      {recording ? `${recordSec}s` : isFr ? "Micro" : "Mic"}
    </button>
  );
}
