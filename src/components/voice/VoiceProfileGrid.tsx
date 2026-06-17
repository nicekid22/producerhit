import { useNavigate } from "react-router-dom";
import type { AppLocale } from "@/i18n/config";
import toast from "react-hot-toast";
import { Check, Mic2, Trash2, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  deleteVoiceProfile,
  getVoiceCloneRemaining,
  hasUnlimitedVoiceClone,
  voiceCloneMonthlyLimit,
  voiceProfileMaxCount,
  type VoiceProfile,
} from "@/lib/voiceProfile";
import { writeVoiceStudioPrefs } from "@/lib/voiceStudioPrefs";

type Props = {
  locale: AppLocale;
  userId: string;
  plan: string;
  cloneUsed: number;
  profiles: VoiceProfile[];
  activeProfileId: string | null;
  busy: boolean;
  onBusyChange: (busy: boolean) => void;
  onRefresh: () => Promise<void>;
  onActiveChange: (id: string | null) => void;
  onCreateClick?: () => void;
  onUpsell?: () => void;
};

function voiceInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.trim().slice(0, 2).toUpperCase() || "V";
}

export function VoiceProfileGrid({
  locale,
  userId,
  plan,
  cloneUsed,
  profiles,
  activeProfileId,
  busy,
  onBusyChange,
  onRefresh,
  onActiveChange,
  onCreateClick,
  onUpsell,
}: Props) {
  const isFr = locale === "fr";
  const navigate = useNavigate();
  const remaining = getVoiceCloneRemaining(plan, cloneUsed);
  const unlimited = hasUnlimitedVoiceClone(plan);
  const maxProfiles = voiceProfileMaxCount(plan);

  const activate = (id: string) => {
    if (remaining <= 0 && !unlimited && activeProfileId !== id) {
      toast.error(isFr ? "Quota clone épuisé ce mois" : "Clone quota used up this month");
      onUpsell?.();
      return;
    }
    const next = activeProfileId === id ? null : id;
    onActiveChange(next);
    writeVoiceStudioPrefs(userId, { profileId: next });
    toast.success(next ? (isFr ? "Voix activée" : "Voice activated") : isFr ? "Voix ACE par défaut" : "Default ACE voice");
  };

  const useInSong = (id: string) => {
    writeVoiceStudioPrefs(userId, { profileId: id });
    onActiveChange(id);
    navigate(`/dashboard?mode=song&voice=${encodeURIComponent(id)}`);
  };

  const onDelete = async (id: string) => {
    onBusyChange(true);
    try {
      await deleteVoiceProfile(id);
      if (activeProfileId === id) {
        onActiveChange(null);
        writeVoiceStudioPrefs(userId, { profileId: null });
      }
      await onRefresh();
      toast.success(isFr ? "Profil supprimé" : "Profile deleted");
    } catch {
      toast.error(isFr ? "Suppression impossible" : "Delete failed");
    } finally {
      onBusyChange(false);
    }
  };

  if (profiles.length === 0) {
    return (
      <div className="pk-voice-empty">
        <div className="pk-voice-empty__icon" aria-hidden>
          <Mic2 className="h-7 w-7" />
        </div>
        <h3 className="pk-voice-empty__title">{isFr ? "Aucune voix pour l'instant" : "No voices yet"}</h3>
        <p className="pk-voice-empty__text">
          {isFr
            ? "Enregistre 15–60 secondes de ta voix — ACE reproduira ton timbre sur tes chansons."
            : "Record 15–60 seconds of your voice — ACE will match your timbre on your songs."}
        </p>
        {onCreateClick ? (
          <button type="button" onClick={onCreateClick} className="pk-voice-empty__cta">
            + {isFr ? "Créer ma première voix" : "Create my first voice"}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="pk-voice-grid">
      {profiles.map((p) => {
        const active = activeProfileId === p.id;
        return (
          <article key={p.id} className={cn("pk-voice-card", active && "is-active")}>
            {active ? <span className="pk-voice-card__badge">{isFr ? "Active" : "Active"}</span> : null}
            <div className="pk-voice-card__head">
              <div className="pk-voice-card__avatar" aria-hidden>
                {voiceInitials(p.name)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="pk-voice-card__name">{p.name}</h3>
                <p className="pk-voice-card__meta">
                  {new Date(p.created_at).toLocaleDateString(isFr ? "fr-FR" : "en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  {p.sample_sec ? ` · ${Math.round(p.sample_sec)}s` : ""}
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                className="pk-voice-card__delete"
                aria-label={isFr ? "Supprimer" : "Delete"}
                onClick={() => void onDelete(p.id)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="pk-voice-card__wave" aria-hidden>
              {Array.from({ length: 24 }).map((_, i) => (
                <span key={i} style={{ animationDelay: `${i * 40}ms` }} />
              ))}
            </div>

            <div className="pk-voice-card__actions">
              <button
                type="button"
                disabled={busy}
                onClick={() => useInSong(p.id)}
                className="pk-voice-card__btn pk-voice-card__btn--primary"
              >
                <Wand2 className="h-3.5 w-3.5" aria-hidden />
                {isFr ? "Générer en Song Mode" : "Generate in Song Mode"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => activate(p.id)}
                className={cn("pk-voice-card__btn", active && "is-on")}
              >
                {active ? (
                  <>
                    <Check className="h-3.5 w-3.5" aria-hidden />
                    {isFr ? "Activée" : "Activated"}
                  </>
                ) : isFr ? (
                  "Activer"
                ) : (
                  "Activate"
                )}
              </button>
            </div>
          </article>
        );
      })}

      <p className="pk-voice-grid__foot">
        {profiles.length}/{maxProfiles} {isFr ? "profils" : "profiles"}
        <span aria-hidden> · </span>
        {unlimited
          ? isFr
            ? "Générations clone illimitées"
            : "Unlimited clone generations"
          : `${remaining}/${voiceCloneMonthlyLimit(plan)} ${isFr ? "chansons clone / mois" : "clone songs / month"}`}
      </p>
    </div>
  );
}
