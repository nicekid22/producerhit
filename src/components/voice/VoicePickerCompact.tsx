import { useCallback, useEffect, useState } from "react";
import type { AppLocale } from "@/i18n/config";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Mic2, Plus, Settings2 } from "lucide-react";
import { DiscreetInfoTip } from "@/components/dashboard/DiscreetInfoTip";
import { Dropdown, type DropdownOption } from "@/components/ui/Dropdown";
import {
  getVoiceCloneRemaining,
  hasUnlimitedVoiceClone,
  listVoiceProfiles,
  voiceCloneMonthlyLimit,
  type VoiceProfile,
} from "@/lib/voiceProfile";
import { cn } from "@/lib/utils";

type Props = {
  locale: AppLocale;
  plan: string;
  cloneUsed: number;
  activeProfileId: string | null;
  strength: number;
  onActiveProfileChange: (id: string | null) => void;
  onStrengthChange: (strength: number) => void;
  onUpsell?: () => void;
};

export function VoicePickerCompact({
  locale,
  plan,
  cloneUsed,
  activeProfileId,
  strength,
  onActiveProfileChange,
  onStrengthChange,
  onUpsell,
}: Props) {
  const isFr = locale === "fr";
  const [profiles, setProfiles] = useState<VoiceProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const remaining = getVoiceCloneRemaining(plan, cloneUsed);
  const unlimited = hasUnlimitedVoiceClone(plan);

  const refresh = useCallback(async () => {
    try {
      const rows = await listVoiceProfiles();
      setProfiles(rows);
      if (activeProfileId && !rows.some((p) => p.id === activeProfileId)) {
        onActiveProfileChange(null);
      }
    } catch {
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, [activeProfileId, onActiveProfileChange]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  const options: DropdownOption[] = [
    { value: "", label: isFr ? "Voix ACE par défaut" : "Default ACE voice" },
    ...profiles.map((p) => ({ value: p.id, label: p.name })),
  ];

  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? null;

  const onSelect = (value: string) => {
    if (!value) {
      onActiveProfileChange(null);
      return;
    }
    if (remaining <= 0 && !unlimited) {
      toast.error(isFr ? "Quota clone épuisé ce mois" : "Clone quota used up this month");
      onUpsell?.();
      return;
    }
    onActiveProfileChange(value);
  };

  const quotaLabel = unlimited
    ? isFr
      ? "Générations illimitées"
      : "Unlimited gens"
    : `${remaining}/${voiceCloneMonthlyLimit(plan)} ${isFr ? "chansons/mois" : "songs/mo"}`;

  return (
    <div className="pk-voice-picker mt-3 space-y-2 rounded-pk border border-pk-border/80 bg-pk-bg/40 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Mic2 className="h-3.5 w-3.5 text-pk-accent" aria-hidden />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-pk-muted">
          {isFr ? "Voix chantée" : "Singing voice"}
        </span>
        <DiscreetInfoTip
          text={
            isFr
              ? "Choisis un profil vocal cloné — ACE chante avec ton timbre."
              : "Pick a cloned voice profile — ACE sings with your timbre."
          }
        />
        <span className="ml-auto text-[10px] text-pk-muted">{quotaLabel}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-[180px] flex-1">
          <Dropdown
            value={activeProfileId ?? ""}
            options={options}
            disabled={loading}
            onChange={onSelect}
            placeholder={loading ? (isFr ? "Chargement…" : "Loading…") : isFr ? "Choisir une voix" : "Choose a voice"}
          />
        </div>
        <Link
          to="/voice-studio?create=1"
          className="pk-voice-to-song__btn inline-flex items-center gap-1 rounded-full bg-pk-accent/15 px-3 py-1.5 text-[11px] font-semibold text-pk-accent ring-1 ring-pk-accent/25 hover:bg-pk-accent/25"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          {isFr ? "Créer une voix" : "New voice"}
        </Link>
        <Link
          to="/voice-studio"
          className="pk-voice-to-song__btn inline-flex items-center gap-1 rounded-full bg-white/8 px-2.5 py-1.5 text-[11px] font-semibold text-white/70 hover:bg-white/12"
          title={isFr ? "Gérer mes voix" : "Manage voices"}
        >
          <Settings2 className="h-3.5 w-3.5" aria-hidden />
          <span className="hidden sm:inline">{isFr ? "Voice Studio" : "Voice Studio"}</span>
        </Link>
      </div>

      {activeProfile ? (
        <>
          <label className="flex items-center gap-2 text-[10px] text-pk-muted">
            <span className="shrink-0">{isFr ? "Force timbre" : "Timbre strength"}</span>
            <input
              type="range"
              min={0.35}
              max={0.95}
              step={0.05}
              value={strength}
              onChange={(e) => onStrengthChange(Number(e.target.value))}
              className="min-w-0 flex-1"
            />
            <span className="w-8 text-right tabular-nums">{strength.toFixed(2)}</span>
          </label>
          <p className={cn("text-[10px]", "text-emerald-300/90")}>
            {isFr ? `Actif : ${activeProfile.name}` : `Active: ${activeProfile.name}`}
          </p>
        </>
      ) : profiles.length === 0 && !loading ? (
        <p className="text-[10px] leading-relaxed text-pk-muted">
          {isFr
            ? "Crée ta première voix dans Voice Studio — 15–60 s a cappella recommandé."
            : "Create your first voice in Voice Studio — 15–60 s a cappella recommended."}
        </p>
      ) : null}
    </div>
  );
}
