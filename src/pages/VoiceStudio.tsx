import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { PkIconLoader } from "@/components/ui/PkIconLoader";
import { VoiceProfileCreateForm } from "@/components/voice/VoiceProfileCreateForm";
import { VoiceProfileGrid } from "@/components/voice/VoiceProfileGrid";
import { VoiceStudioHero } from "@/components/voice/VoiceStudioHero";
import { useAuthStore } from "@/stores/authStore";
import { useGrowthUpsellStore } from "@/stores/growthUpsellStore";
import { useLocaleStore } from "@/stores/localeStore";
import { readProfileCache } from "@/lib/profileBootstrap";
import {
  getVoiceToSongRemaining,
  hasUnlimitedVoiceToSong,
  voiceToSongMonthlyLimit,
} from "@/lib/voiceToSong";
import {
  getVoiceCloneRemaining,
  hasUnlimitedVoiceClone,
  listVoiceProfiles,
  voiceCloneMonthlyLimit,
  voiceProfileMaxCount,
  type VoiceProfile,
} from "@/lib/voiceProfile";
import { shouldShowPlanUpsell } from "@/lib/growthUpsell";
import { readVoiceStudioPrefs, writeVoiceStudioPrefs } from "@/lib/voiceStudioPrefs";
import { CheckoutRecoveryBanner } from "@/components/billing/CheckoutRecoveryBanner";
import { FreeUpgradeStrip } from "@/components/billing/FreeUpgradeStrip";
import { normalizePlan } from "@/lib/billing";
import { Plus, Type, Users, Wand2 } from "lucide-react";

export default function VoiceStudioPage() {
  const locale = useLocaleStore((s) => s.locale);
  const isFr = locale === "fr";
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const openUpsell = useGrowthUpsellStore((s) => s.openUpsell);
  const [searchParams, setSearchParams] = useSearchParams();
  const createRef = useRef<HTMLDivElement>(null);

  const [plan, setPlan] = useState("free");
  const [voiceToSongUsed, setVoiceToSongUsed] = useState(0);
  const [voiceCloneUsed, setVoiceCloneUsed] = useState(0);
  const [profiles, setProfiles] = useState<VoiceProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const showCreate = searchParams.get("create") === "1";

  useEffect(() => {
    if (!profile) return;
    setPlan(profile.plan ?? "free");
    setVoiceToSongUsed(profile.voice_to_song_used_this_month ?? 0);
    setVoiceCloneUsed(profile.voice_clone_used_this_month ?? 0);
  }, [profile]);

  useEffect(() => {
    if (!user?.id) return;
    const cached = readProfileCache(user.id);
    if (cached) setPlan(cached.plan);
    const prefs = readVoiceStudioPrefs(user.id);
    setActiveProfileId(prefs.profileId);
  }, [user?.id]);

  const refreshProfiles = useCallback(async () => {
    try {
      const rows = await listVoiceProfiles();
      setProfiles(rows);
      if (activeProfileId && !rows.some((p) => p.id === activeProfileId)) {
        setActiveProfileId(null);
        if (user?.id) writeVoiceStudioPrefs(user.id, { profileId: null });
      }
    } catch {
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, [activeProfileId, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    void refreshProfiles();
  }, [refreshProfiles, user?.id]);

  useEffect(() => {
    if (!showCreate || !createRef.current) return;
    createRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [showCreate]);

  const t = useCallback((en: string, fr: string) => (isFr ? fr : en), [isFr]);

  const promptUpsell = useCallback(
    (reason: "feature_voice_to_song" | "feature_voice_clone") => {
      if (shouldShowPlanUpsell(plan, reason, { source: "voice_studio", plan })) {
        openUpsell(reason, { source: "voice_studio", plan });
      }
    },
    [openUpsell, plan],
  );

  const scrollToCreate = useCallback(() => {
    setSearchParams({ create: "1" });
    requestAnimationFrame(() => createRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [setSearchParams]);

  const transcribeRemaining = getVoiceToSongRemaining(plan, voiceToSongUsed);
  const cloneRemaining = getVoiceCloneRemaining(plan, voiceCloneUsed);
  const maxProfiles = voiceProfileMaxCount(plan);

  const heroStats = useMemo(
    () => [
      {
        label: t("Profiles", "Profils"),
        value: `${profiles.length}/${maxProfiles}`,
        icon: Users,
      },
      {
        label: t("Clone / mo", "Clone / mois"),
        value: hasUnlimitedVoiceClone(plan)
          ? t("Unlimited", "Illimité")
          : `${cloneRemaining}/${voiceCloneMonthlyLimit(plan)}`,
        icon: Wand2,
      },
      {
        label: t("Transcribe / mo", "Transcription / mois"),
        value: hasUnlimitedVoiceToSong(plan)
          ? t("Unlimited", "Illimité")
          : `${transcribeRemaining}/${voiceToSongMonthlyLimit(plan)}`,
        icon: Type,
      },
    ],
    [cloneRemaining, maxProfiles, plan, profiles.length, t, transcribeRemaining],
  );

  if (!user?.id) {
    return (
      <AppShell theme="prism" variant="single">
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <p className="text-pk-muted">{t("Sign in to manage your voices.", "Connecte-toi pour gérer tes voix.")}</p>
          <Link to="/auth" className="mt-4 inline-block text-pk-accent hover:underline">
            {t("Sign in", "Se connecter")}
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell theme="prism" variant="single">
      <div className="pk-voice-studio-page pk-prism-page flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-4 md:px-6">
          <CheckoutRecoveryBanner locale={locale} location="voice_studio" currentPlan={normalizePlan(plan)} className="mb-4" />
          {plan === "free" ? (
            <FreeUpgradeStrip locale={locale} location="voice_studio_strip" plan={plan} className="mb-4" />
          ) : null}
          <VoiceStudioHero isFr={isFr} stats={heroStats} profileCount={profiles.length} />

          <div className="pk-voice-studio-layout">
            <section className="pk-voice-studio-panel">
              <div className="pk-voice-studio-panel__head">
                <div>
                  <h2 className="pk-voice-studio-panel__title">{t("My voices", "Mes voix")}</h2>
                  <p className="pk-voice-studio-panel__sub">
                    {t("Activate a profile or jump straight to Song Mode.", "Active un profil ou passe directement en Song Mode.")}
                  </p>
                </div>
                <button type="button" onClick={scrollToCreate} className="pk-voice-studio-panel__new">
                  <Plus className="h-4 w-4" aria-hidden />
                  {t("New voice", "Nouvelle voix")}
                </button>
              </div>

              <div className="pk-voice-studio-panel__body">
                {loading ? (
                  <div className="grid min-h-[220px] place-items-center">
                    <PkIconLoader icon="voice" size="md" label={t("Loading…", "Chargement…")} />
                  </div>
                ) : (
                  <VoiceProfileGrid
                    locale={locale}
                    userId={user.id}
                    plan={plan}
                    cloneUsed={voiceCloneUsed}
                    profiles={profiles}
                    activeProfileId={activeProfileId}
                    busy={busy}
                    onBusyChange={setBusy}
                    onRefresh={refreshProfiles}
                    onActiveChange={(id) => {
                      setActiveProfileId(id);
                      writeVoiceStudioPrefs(user.id, { profileId: id });
                    }}
                    onCreateClick={scrollToCreate}
                    onUpsell={() => promptUpsell("feature_voice_clone")}
                  />
                )}
              </div>
            </section>

            <aside ref={createRef} id="create-voice" className="pk-voice-studio-panel pk-voice-studio-panel--create">
              <VoiceProfileCreateForm
                locale={locale}
                userId={user.id}
                plan={plan}
                profileCount={profiles.length}
                autoFocus={showCreate}
                onCreated={(p) => {
                  void refreshProfiles();
                  void refreshProfile();
                  setActiveProfileId(p.id);
                  writeVoiceStudioPrefs(user.id, { profileId: p.id });
                  setSearchParams({});
                }}
                onUpsell={() => promptUpsell("feature_voice_clone")}
              />
            </aside>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
