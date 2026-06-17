import { useCallback, useRef, useState } from "react";
import type { AppLocale } from "@/i18n/config";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Check, Loader2, Mic, Square, Upload, Wand2 } from "lucide-react";
import { useVoiceAudioCapture } from "@/hooks/useVoiceAudioCapture";
import { cn } from "@/lib/utils";
import {
  VOICE_ACCEPT,
  voiceProfileMaxCount,
  voiceSampleToProfile,
  type VoiceProfile,
} from "@/lib/voiceProfile";
import { writeVoiceStudioPrefs } from "@/lib/voiceStudioPrefs";

type Props = {
  locale: AppLocale;
  userId: string;
  plan: string;
  profileCount: number;
  onCreated: (profile: VoiceProfile) => void;
  onUpsell?: () => void;
  autoFocus?: boolean;
};

export function VoiceProfileCreateForm({
  locale,
  userId,
  plan,
  profileCount,
  onCreated,
  onUpsell,
  autoFocus,
}: Props) {
  const isFr = locale === "fr";
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<"capture" | "name">("capture");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [profileName, setProfileName] = useState(isFr ? "Ma voix" : "My voice");
  const [savedProfile, setSavedProfile] = useState<VoiceProfile | null>(null);
  const maxProfiles = voiceProfileMaxCount(plan);
  const atLimit = profileCount >= maxProfiles;

  const resetCapture = useCallback(() => {
    setStep("capture");
    setPendingFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSavedProfile(null);
  }, [previewUrl]);

  const onFileReady = useCallback(
    (file: File) => {
      if (atLimit) {
        toast.error(isFr ? `Max ${maxProfiles} profil(s) vocal(aux)` : `Max ${maxProfiles} voice profile(s)`);
        onUpsell?.();
        return;
      }
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPendingFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setStep("name");
    },
    [atLimit, isFr, maxProfiles, onUpsell, previewUrl],
  );

  const { recording, recordSec, startRecording, stopRecording } = useVoiceAudioCapture({
    onComplete: onFileReady,
    onTooShort: () => toast.error(isFr ? "Enregistrement trop court (min ~15 s)" : "Recording too short (min ~15 s)"),
  });

  const saveProfile = async () => {
    if (!pendingFile) return;
    setBusy(true);
    try {
      const profile = await voiceSampleToProfile(userId, pendingFile, profileName);
      setSavedProfile(profile);
      onCreated(profile);
      toast.success(isFr ? "Voix sauvegardée" : "Voice saved");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "error";
      if (msg === "profile_limit_reached") {
        toast.error(isFr ? "Limite profils atteinte" : "Profile limit reached");
        onUpsell?.();
      } else {
        toast.error(isFr ? "Impossible de sauver la voix" : "Could not save voice");
      }
    } finally {
      setBusy(false);
    }
  };

  const useInSongMode = (profileId: string) => {
    writeVoiceStudioPrefs(userId, { profileId });
    navigate(`/dashboard?mode=song&voice=${encodeURIComponent(profileId)}`);
  };

  if (savedProfile) {
    return (
      <div className="pk-voice-create pk-voice-create--success">
        <div className="pk-voice-create__success-icon" aria-hidden>
          <Check className="h-6 w-6" />
        </div>
        <h3 className="pk-voice-create__title">{isFr ? `"${savedProfile.name}" est prête` : `"${savedProfile.name}" is ready`}</h3>
        <p className="pk-voice-create__hint">
          {isFr ? "Sélectionne-la dans Song Mode pour générer avec ton timbre." : "Pick it in Song Mode to generate with your timbre."}
        </p>
        <div className="pk-voice-create__actions">
          <button type="button" onClick={() => useInSongMode(savedProfile.id)} className="pk-voice-create__primary">
            <Wand2 className="h-4 w-4" aria-hidden />
            {isFr ? "Ouvrir Song Mode" : "Open Song Mode"}
          </button>
          <button type="button" onClick={resetCapture} className="pk-voice-create__ghost">
            {isFr ? "Créer une autre" : "Create another"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pk-voice-create">
      <div className="pk-voice-create__header">
        <h2 className="pk-voice-create__title">{isFr ? "Nouvelle voix" : "New voice"}</h2>
        <span className="pk-voice-create__quota">
          {profileCount}/{maxProfiles}
        </span>
      </div>

      <div className="pk-voice-create__steps" aria-hidden>
        <span className={cn("pk-voice-create__step", step === "capture" && "is-current")}>1</span>
        <span className="pk-voice-create__step-line" />
        <span className={cn("pk-voice-create__step", step === "name" && "is-current")}>2</span>
      </div>
      <p className="pk-voice-create__step-label">
        {step === "capture"
          ? isFr
            ? "Enregistre ou importe ton échantillon"
            : "Record or import your sample"
          : isFr
            ? "Nomme et valide ton profil"
            : "Name and save your profile"}
      </p>

      {step === "capture" ? (
        <div
          className={cn(
            "pk-voice-create__dropzone",
            recording && "is-recording",
            atLimit && "is-disabled",
          )}
        >
          <Mic className="pk-voice-create__dropzone-icon" aria-hidden />
          <p className="pk-voice-create__dropzone-text">
            {atLimit
              ? isFr
                ? "Limite de profils atteinte"
                : "Profile limit reached"
              : isFr
                ? "Voix claire, a cappella ou hook — 15 à 60 secondes"
                : "Clear voice, a cappella or hook — 15 to 60 seconds"}
          </p>
          <div className="pk-voice-create__dropzone-actions">
            <CaptureBtn
              busy={busy || atLimit}
              recording={recording}
              recordSec={recordSec}
              isFr={isFr}
              onClick={() =>
                recording
                  ? stopRecording()
                  : void startRecording().catch(() => toast.error(isFr ? "Accès micro refusé" : "Microphone denied"))
              }
            />
            <button
              type="button"
              disabled={busy || recording || atLimit}
              onClick={() => fileRef.current?.click()}
              className="pk-voice-create__secondary"
            >
              <Upload className="h-4 w-4" aria-hidden />
              {isFr ? "Fichier audio" : "Audio file"}
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept={VOICE_ACCEPT}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFileReady(f);
              e.target.value = "";
            }}
          />
        </div>
      ) : (
        <div className="pk-voice-create__review">
          {previewUrl ? (
            <audio controls src={previewUrl} className="pk-voice-create__audio" preload="metadata" />
          ) : null}
          <label className="pk-voice-create__field-label">{isFr ? "Nom du profil" : "Profile name"}</label>
          <input
            autoFocus={autoFocus}
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            className="pk-voice-create__input"
            placeholder={isFr ? "ex. Ma voix rap" : "e.g. My rap voice"}
          />
          <div className="pk-voice-create__actions">
            <button type="button" disabled={busy} onClick={() => void saveProfile()} className="pk-voice-create__primary">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              {isFr ? "Sauvegarder" : "Save"}
            </button>
            <button type="button" disabled={busy} onClick={resetCapture} className="pk-voice-create__ghost">
              {isFr ? "Recommencer" : "Start over"}
            </button>
          </div>
        </div>
      )}

      <ul className="pk-voice-create__tips">
        <li>{isFr ? "Environnement calme, micro proche." : "Quiet room, mic close."}</li>
        <li>{isFr ? "Force timbre réglable dans Song Mode." : "Timbre strength adjustable in Song Mode."}</li>
        <li>{isFr ? "Import paroles voix → Dashboard → Paroles." : "Voice → lyrics import lives in Dashboard → Lyrics."}</li>
      </ul>
    </div>
  );
}

function CaptureBtn({
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
    <button type="button" disabled={busy} onClick={onClick} className={cn("pk-voice-create__record", recording && "is-recording")}>
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : recording ? (
        <Square className="h-4 w-4" fill="currentColor" aria-hidden />
      ) : (
        <Mic className="h-4 w-4" aria-hidden />
      )}
      {recording ? (isFr ? `Stop · ${recordSec}s` : `Stop · ${recordSec}s`) : isFr ? "Enregistrer" : "Record"}
    </button>
  );
}
