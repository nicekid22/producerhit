import { AppShell } from "@/components/AppShell";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { readProfileCache, syncProfileCache } from "@/lib/profileBootstrap";
import {
  CREATOR_TYPE_OPTIONS,
  creatorProfileErrorMessage,
  profilePath,
  saveCreatorProfile,
  validateUsername,
  type CreatorSocialLinks,
  type CreatorType,
} from "@/lib/creatorProfile";
import { useAuthStore } from "@/stores/authStore";
import { getRemainingBeats, getTotalGenerationLimit } from "@/lib/planLimits";
import { buildReferralInviteUrl, ensureReferralCode } from "@/lib/referral";
import {
  REFERRAL_REFEREE_START_TOTAL,
  REFERRAL_REFERRER_SIGNUP_BONUS,
} from "@/lib/referralConfig";
import { Button } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";
import { Modal } from "@/components/ui/Modal";
import { useLocaleStore } from "@/stores/localeStore";
import { CreditCard, LogOut, Palette, Shield, Sparkles, UserRound, Users } from "lucide-react";
import { ThemeToggleButton } from "@/components/ThemeToggleButton";
import { CloudThemeSettingsBlock, visualThemeDescription } from "@/components/CloudThemeSettingsBlock";
import { CLOUD_THEME_ENABLED } from "@/lib/featureFlags";
import { discordCommunityUrl } from "@/lib/discordConfig";
import { useVisualThemeStore } from "@/stores/visualThemeStore";
import { PkIconLoader } from "@/components/ui/PkIconLoader";
import { hasEmailPassword, hasGoogleAuth, mapAuthError } from "@/lib/authProviders";
import { SettingsGrowthExtras } from "@/components/settings/SettingsGrowthExtras";
import { ReferralStatsPanel } from "@/components/growth/ReferralStatsPanel";
import { ReferralLeaderboard } from "@/components/growth/ReferralLeaderboard";
import { ViralShareBar } from "@/components/growth/ViralShareBar";
import { markActivationStepLocal } from "@/components/onboarding/OnboardingChecklist";
import { SettingsIdentityHero } from "@/components/settings/SettingsIdentityHero";

function tierClass(plan: string) {
  if (plan === "plus") return "pk-prism-tier-badge--plus";
  if (plan === "studio") return "pk-prism-tier-badge--studio";
  if (plan === "pro") return "pk-prism-tier-badge--pro";
  return "pk-prism-tier-badge--free";
}

export default function Settings() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const authStatus = useAuthStore((s) => s.status);
  const authProfile = useAuthStore((s) => s.profile);
  const profileReady = useAuthStore((s) => s.profileReady);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const signOut = useAuthStore((s) => s.signOut);
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const linkGoogle = useAuthStore((s) => s.linkGoogle);
  const setPassword = useAuthStore((s) => s.setPassword);
  const locale = useLocaleStore((s) => s.locale);
  const visualTheme = useVisualThemeStore((s) => s.theme);
  const isFr = locale === "fr";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("pk-settings-profile");

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [creatorType, setCreatorType] = useState<CreatorType | "">("");
  const [socialIg, setSocialIg] = useState("");
  const [socialTt, setSocialTt] = useState("");
  const [socialYt, setSocialYt] = useState("");
  const [socialX, setSocialX] = useState("");
  const [socialWeb, setSocialWeb] = useState("");
  const [plan, setPlan] = useState("free");
  const [usedThisMonth, setUsedThisMonth] = useState(0);
  const [referralBonus, setReferralBonus] = useState(0);
  const [levelBonus, setLevelBonus] = useState(0);
  const [dailyBonusMonth, setDailyBonusMonth] = useState(0);
  const [referralCode, setReferralCode] = useState("");
  const [referralLinkLoading, setReferralLinkLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [linkingGoogle, setLinkingGoogle] = useState(false);
  const profileFormHydratedRef = useRef(false);

  const emailLinked = hasEmailPassword(user);
  const googleLinked = hasGoogleAuth(user);

  const remaining = useMemo(
    () => getRemainingBeats(plan, usedThisMonth, referralBonus, levelBonus, dailyBonusMonth),
    [dailyBonusMonth, levelBonus, plan, referralBonus, usedThisMonth],
  );
  const limit = getTotalGenerationLimit(plan, { referralBonus, levelBonus, dailyBonusMonth });
  const referralLink = useMemo(() => (referralCode ? buildReferralInviteUrl(referralCode) : ""), [referralCode]);
  const pct = limit > 0 ? Math.min(100, Math.max(0, (usedThisMonth / limit) * 100)) : 0;
  const initials = useMemo(() => {
    const src = username.trim() || user?.email?.split("@")[0] || "?";
    return src.slice(0, 2).toUpperCase();
  }, [username, user?.email]);
  const publicProfileUrl = username.trim().length >= 3 ? profilePath(username.trim()) : null;
  const displayName = username.trim() || user?.email?.split("@")[0] || (isFr ? "Producer" : "Producer");
  const creatorTypeOptions = useMemo(
    () =>
      CREATOR_TYPE_OPTIONS.map((opt) => ({
        value: opt.value,
        label: isFr ? opt.labelFr : opt.labelEn,
      })),
    [isFr],
  );

  const navItems = useMemo(
    () => [
      { id: "pk-settings-profile", label: isFr ? "Profil" : "Profile" },
      { id: "pk-settings-progression", label: isFr ? "Progression" : "Progress" },
      { id: "pk-settings-referral", label: isFr ? "Parrainage" : "Referral" },
      { id: "pk-settings-plan", label: isFr ? "Plan" : "Plan" },
      { id: "pk-settings-security", label: isFr ? "Sécurité" : "Security" },
    ],
    [isFr],
  );

  const scrollToSection = useCallback((id: string) => {
    setActiveSection(id);
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }, []);

  useEffect(() => {
    if (loading) return;
    const hash = window.location.hash.replace(/^#/, "").trim();
    if (!hash) return;
    scrollToSection(hash);
  }, [loading, scrollToSection]);

  useEffect(() => {
    if (authStatus !== "ready" || !user) {
      setLoading(false);
      profileFormHydratedRef.current = false;
      return;
    }
    if (authProfile) {
      if (!profileFormHydratedRef.current) {
        profileFormHydratedRef.current = true;
        setUsername(authProfile.username ?? "");
        setBio(authProfile.bio ?? "");
        setCreatorType((authProfile.creator_type as CreatorType | null) ?? "");
        setSocialIg(authProfile.social?.ig ?? "");
        setSocialTt(authProfile.social?.tt ?? "");
        setSocialYt(authProfile.social?.yt ?? "");
        setSocialX(authProfile.social?.x ?? "");
        setSocialWeb(authProfile.social?.web ?? "");
      }
      setPlan(authProfile.plan);
      setUsedThisMonth(authProfile.loops_used_this_month);
      setReferralBonus(authProfile.referral_bonus);
      setLevelBonus(authProfile.level_bonus);
      setDailyBonusMonth(authProfile.daily_bonus_month);
      setReferralCode(authProfile.referral_code ?? "");
      syncProfileCache(authProfile.plan, authProfile.loops_used_this_month, user?.id, {
        referral_bonus: authProfile.referral_bonus,
        level_bonus: authProfile.level_bonus,
        daily_bonus_month: authProfile.daily_bonus_month,
      });
      setLoading(false);
      return;
    }
    const cached = user?.id ? readProfileCache(user.id) : null;
    if (cached) {
      setPlan(cached.plan);
      setUsedThisMonth(cached.usedThisMonth);
      setReferralBonus(cached.referralBonus);
      setLevelBonus(cached.levelBonus);
      setDailyBonusMonth(cached.dailyBonusMonth);
      setLoading(false);
      return;
    }
    setLoading(!profileReady);
  }, [authProfile, authStatus, profileReady, user]);

  useEffect(() => {
    if (authStatus !== "ready" || !user || loading || authProfile) return;
    if (!profileReady) return;
    void refreshProfile();
  }, [authProfile, authStatus, loading, profileReady, refreshProfile, user?.id]);

  useEffect(() => {
    if (authStatus !== "ready" || !user?.id || loading) return;
    if (referralCode.trim().length > 0) return;
    setReferralLinkLoading(true);
    void ensureReferralCode()
      .then(async (code) => {
        if (!code) return;
        setReferralCode(code);
        await refreshProfile();
      })
      .finally(() => setReferralLinkLoading(false));
  }, [authStatus, loading, referralCode, refreshProfile, user?.id]);

  return (
    <AppShell theme="prism" variant="single">
      <div className="pk-settings-page h-full space-y-5 px-4 pb-6 pt-4 md:pb-24 md:pt-6">
        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <PkIconLoader
              icon="settings"
              size="md"
              label={isFr ? "Chargement du profil…" : "Loading profile…"}
            />
          </div>
        ) : (
          <>
            <SettingsIdentityHero
              isFr={isFr}
              initials={initials}
              displayName={displayName}
              email={user?.email ?? ""}
              plan={plan}
              planClass={tierClass(plan)}
              usedThisMonth={usedThisMonth}
              limit={limit}
              remaining={remaining}
              pct={pct}
              publicProfileUrl={publicProfileUrl}
              navItems={navItems}
              activeSection={activeSection}
              onNav={scrollToSection}
            />

            <SettingsGrowthExtras locale={locale} plan={plan} compact />

            <div className="pk-settings-bento">
              <div id="pk-settings-profile" className="pk-prism-section-card pk-settings-section">
            <div className="pk-prism-section-head">
              <div className="pk-prism-section-head__icon">
                <UserRound className="h-4 w-4" />
              </div>
              <div>
                <div className="text-lg font-semibold">{isFr ? "Profil" : "Profile"}</div>
                <div className="text-xs text-pk-muted">{isFr ? "Identité publique du studio" : "Your studio identity"}</div>
              </div>
            </div>
            <div className="mt-5 grid gap-4">
              <div>
                <div className="text-xs text-pk-muted">{isFr ? "Username public" : "Public username"}</div>
                <input
                  id="settings-username"
                  aria-label={isFr ? "Username public" : "Public username"}
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
                  disabled={loading || saving}
                  className="mt-2 w-full rounded-pk border border-pk-border bg-pk-input px-3 py-2.5 text-sm outline-none focus:border-pk-accent"
                  placeholder={isFr ? "ton_pseudo" : "your_handle"}
                />
                <div className="mt-1 text-[11px] text-pk-muted">
                  {isFr ? "3–24 caractères · lettres, chiffres, _ · visible sur tes tracks publics" : "3–24 chars · letters, numbers, _ · shown on your public tracks"}
                </div>
                {publicProfileUrl ? (
                  <Link to={publicProfileUrl} className="mt-2 inline-block text-xs font-semibold text-pk-accent hover:underline">
                    {isFr ? "Voir mon profil public →" : "View public profile →"}
                  </Link>
                ) : null}
              </div>

              <Dropdown
                label={isFr ? "Type de créateur" : "Creator type"}
                value={creatorType}
                onChange={(value) => setCreatorType(value as CreatorType | "")}
                options={creatorTypeOptions}
                placeholder={isFr ? "Choisir…" : "Choose…"}
                disabled={loading || saving}
                className="[&_button]:py-2.5"
              />

              <div>
                <div className="text-xs text-pk-muted">Bio</div>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 280))}
                  disabled={loading || saving}
                  rows={3}
                  className="mt-2 w-full resize-none rounded-pk border border-pk-border bg-pk-input px-3 py-2.5 text-sm outline-none focus:border-pk-accent"
                  placeholder={isFr ? "Beatmaker, artiste, TikTok…" : "Beatmaker, artist, TikTok…"}
                />
                <div className="mt-1 text-[11px] text-pk-muted">{bio.length}/280</div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-xs text-pk-muted">Instagram</div>
                  <input
                    value={socialIg}
                    onChange={(e) => setSocialIg(e.target.value)}
                    disabled={loading || saving}
                    className="mt-2 w-full rounded-pk border border-pk-border bg-pk-input px-3 py-2.5 text-sm outline-none focus:border-pk-accent"
                    placeholder="@handle"
                  />
                </div>
                <div>
                  <div className="text-xs text-pk-muted">TikTok</div>
                  <input
                    value={socialTt}
                    onChange={(e) => setSocialTt(e.target.value)}
                    disabled={loading || saving}
                    className="mt-2 w-full rounded-pk border border-pk-border bg-pk-input px-3 py-2.5 text-sm outline-none focus:border-pk-accent"
                    placeholder="@handle"
                  />
                </div>
                <div>
                  <div className="text-xs text-pk-muted">YouTube</div>
                  <input
                    value={socialYt}
                    onChange={(e) => setSocialYt(e.target.value)}
                    disabled={loading || saving}
                    className="mt-2 w-full rounded-pk border border-pk-border bg-pk-input px-3 py-2.5 text-sm outline-none focus:border-pk-accent"
                    placeholder="@channel"
                  />
                </div>
                <div>
                  <div className="text-xs text-pk-muted">X</div>
                  <input
                    value={socialX}
                    onChange={(e) => setSocialX(e.target.value)}
                    disabled={loading || saving}
                    className="mt-2 w-full rounded-pk border border-pk-border bg-pk-input px-3 py-2.5 text-sm outline-none focus:border-pk-accent"
                    placeholder="@handle"
                  />
                </div>
                <div className="sm:col-span-2">
                  <div className="text-xs text-pk-muted">{isFr ? "Site web" : "Website"}</div>
                  <input
                    value={socialWeb}
                    onChange={(e) => setSocialWeb(e.target.value)}
                    disabled={loading || saving}
                    className="mt-2 w-full rounded-pk border border-pk-border bg-pk-input px-3 py-2.5 text-sm outline-none focus:border-pk-accent"
                    placeholder="https://…"
                  />
                </div>
              </div>

              <div>
                <div className="text-xs text-pk-muted">Email</div>
                <input
                  value={user?.email ?? ""}
                  readOnly
                  className="mt-2 w-full rounded-pk border border-pk-border bg-pk-input px-3 py-2.5 text-sm text-pk-muted outline-none"
                />
              </div>
            </div>
            <div className="mt-5">
              <Button
                variant="primary"
                disabled={loading || saving || !user}
                onClick={async () => {
                  if (!user) return;
                  const usernameError = validateUsername(username, isFr, true);
                  if (usernameError) {
                    toast.error(usernameError);
                    return;
                  }
                  setSaving(true);
                  try {
                    const social: CreatorSocialLinks = {
                      ig: socialIg,
                      tt: socialTt,
                      yt: socialYt,
                      x: socialX,
                      web: socialWeb,
                    };
                    const result = await saveCreatorProfile({
                      username: username.trim(),
                      avatar_id: authProfile?.avatar_id ?? 1,
                      bio,
                      creator_type: creatorType,
                      social,
                    });
                    if (!result.ok) {
                      toast.error(creatorProfileErrorMessage("error" in result ? result.error : "save_failed", isFr));
                      return;
                    }
                    const trimmed = username.trim();
                    setUsername(trimmed);
                    toast.success(isFr ? "Profil sauvegardé" : "Profile saved");
                    void refreshProfile().then((refreshed) => {
                      if (refreshed?.username) setUsername(refreshed.username);
                    });
                  } catch (err) {
                    const message = err instanceof Error ? err.message : "Save failed";
                    toast.error(message);
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {isFr ? "Sauvegarder le profil" : "Save profile"}
              </Button>
            </div>
          </div>

              <div className="pk-settings-bento__stack">
                <div id="pk-settings-appearance" className="pk-prism-section-card pk-settings-section pk-settings-section--compact">
                  <div className="pk-prism-section-head">
                    <div className="pk-prism-section-head__icon">
                      <Palette className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-base font-semibold">{isFr ? "Apparence" : "Appearance"}</div>
                      <div className="text-xs text-pk-muted">
                        {isFr ? "Thème studio" : "Studio theme"}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col gap-3">
                    <p className="text-xs leading-relaxed text-pk-muted">
                      {visualThemeDescription(visualTheme, isFr)}
                    </p>
                    {CLOUD_THEME_ENABLED ? (
                      <CloudThemeSettingsBlock />
                    ) : (
                      <div className="flex justify-end sm:justify-end">
                        <ThemeToggleButton variant="segmented" />
                      </div>
                    )}
                  </div>
                </div>

                <div id="pk-settings-plan" className="pk-prism-section-card pk-settings-section pk-settings-section--compact">
                  <div className="pk-prism-section-head">
                    <div className="pk-prism-section-head__icon">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-base font-semibold">{isFr ? "Abonnement" : "Subscription"}</div>
                      <div className="text-xs text-pk-muted">{isFr ? "Plan & facturation" : "Plan & billing"}</div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className={`pk-prism-tier-badge ${tierClass(plan)}`}>
                      <Sparkles className="h-3 w-3" />
                      {plan}
                    </span>
                  </div>
                  <div className="pk-prism-chip-cloud mt-3">
                    <span className="pk-prism-vibe-chip">{isFr ? "Exports HD" : "HD exports"}</span>
                    <span className="pk-prism-vibe-chip">{isFr ? "Cloud" : "Cloud"}</span>
                    <span className="pk-prism-vibe-chip">{isFr ? "Communauté" : "Community"}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link to="/pricing">
                      <Button variant="primary" size="sm">{isFr ? "Upgrade" : "Upgrade"}</Button>
                    </Link>
                    {plan !== "free" ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={portalLoading}
                        onClick={async () => {
                          setPortalLoading(true);
                          try {
                            const { data, error } = await supabase.functions.invoke("create-portal", {
                              body: { returnUrl: window.location.origin + "/settings" },
                            });
                            if (error) throw error;
                            const url = (data as { url?: string } | null)?.url;
                            if (!url) throw new Error("Missing portal URL");
                            window.location.href = url;
                          } catch (err) {
                            const message = err instanceof Error ? err.message : "Portal error";
                            toast.error(message);
                          } finally {
                            setPortalLoading(false);
                          }
                        }}
                      >
                        {portalLoading ? (isFr ? "Chargement…" : "Loading…") : isFr ? "Gérer" : "Manage"}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>

              <div id="pk-settings-referral" className="pk-prism-section-card pk-settings-section pk-settings-bento__full">
                <div className="pk-prism-section-head">
                  <div className="pk-prism-section-head__icon">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold">{isFr ? "Parrainage" : "Referral program"}</div>
                    <div className="text-xs text-pk-muted">
                      {isFr
                        ? `+${REFERRAL_REFERRER_SIGNUP_BONUS} gen pour toi · ${REFERRAL_REFEREE_START_TOTAL} gen pour eux`
                        : `+${REFERRAL_REFERRER_SIGNUP_BONUS} for you · ${REFERRAL_REFEREE_START_TOTAL} for them`}
                    </div>
                  </div>
                </div>
                <div className="pk-settings-referral-highlight text-sm leading-relaxed text-white/75">
                  <p className="font-semibold text-white">{isFr ? "Comment ça marche" : "How it works"}</p>
                  <ul className="mt-2 space-y-1.5 text-xs sm:text-sm">
                    <li>
                      {isFr
                        ? `Envoie ton lien — ${REFERRAL_REFEREE_START_TOTAL} générations dès l'inscription.`
                        : `Share your link — ${REFERRAL_REFEREE_START_TOTAL} generations on signup.`}
                    </li>
                    <li>
                      {isFr
                        ? `Tu reçois +${REFERRAL_REFERRER_SIGNUP_BONUS} gen par filleul inscrit.`
                        : `You get +${REFERRAL_REFERRER_SIGNUP_BONUS} gen per signup.`}
                    </li>
                  </ul>
                </div>
                <ReferralStatsPanel locale={locale} className="mt-4" />
                <ReferralLeaderboard locale={locale} className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4" />
                {referralBonus > 0 || levelBonus > 0 || dailyBonusMonth > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--prism-cyan)]">
                    {referralBonus > 0 ? (
                      <span>{isFr ? `Parrainage +${referralBonus}` : `Referral +${referralBonus}`}</span>
                    ) : null}
                    {levelBonus > 0 ? (
                      <span>{isFr ? `Niveaux +${levelBonus}` : `Levels +${levelBonus}`}</span>
                    ) : null}
                    {dailyBonusMonth > 0 ? (
                      <span>{isFr ? `Daily +${dailyBonusMonth}` : `Daily +${dailyBonusMonth}`}</span>
                    ) : null}
                  </div>
                ) : null}
                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div>
                    <div className="text-xs text-pk-muted">{isFr ? "Lien d'invitation" : "Invite link"}</div>
                    <input
                      value={referralLinkLoading ? (isFr ? "Génération…" : "Generating…") : referralLink}
                      readOnly
                      className="mt-2 w-full rounded-pk border border-pk-border bg-pk-input px-3 py-2.5 text-sm text-pk-muted outline-none"
                    />
                  </div>
                  <Button
                    variant="secondary"
                    disabled={!referralLink || referralLinkLoading}
                    onClick={() => {
                      void navigator.clipboard.writeText(referralLink).then(() => {
                        markActivationStepLocal("referral_share");
                        toast.success(isFr ? "Lien copié" : "Link copied");
                      });
                    }}
                  >
                    {isFr ? "Copier" : "Copy"}
                  </Button>
                </div>
                {referralCode ? (
                  <div className="mt-2 text-xs text-pk-muted">
                    {isFr ? "Code" : "Code"}: <span className="font-semibold text-white">{referralCode}</span>
                  </div>
                ) : null}
                {referralLink ? (
                  <div className="mt-4">
                    <div className="mb-2 text-xs text-pk-muted">{isFr ? "Partager" : "Share"}</div>
                    <ViralShareBar
                      url={referralLink}
                      shareText={
                        isFr
                          ? "Je crée mes beats avec ProducerHit — essaie avec mon lien"
                          : "I make beats with ProducerHit — try with my link"
                      }
                      locale={locale}
                      channel="referral"
                      onShare={() => markActivationStepLocal("referral_share")}
                    />
                  </div>
                ) : null}
              </div>

              <div id="pk-settings-discord" className="pk-prism-section-card pk-settings-section">
                <div className="pk-prism-section-head">
                  <div className="pk-prism-section-head__icon">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold">Discord</div>
                    <div className="text-xs text-pk-muted">
                      {isFr ? "Challenges · crédits bonus · salons FR/ES/PT" : "Challenges · bonus credits · FR/ES/PT lounges"}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={discordCommunityUrl("settings")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pk-prism-btn inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-semibold"
                  >
                    {isFr ? "Rejoindre" : "Join"}
                  </a>
                  <Link to="/community" className="pk-glass-btn inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-semibold">
                    {isFr ? "Hub" : "Hub"}
                  </Link>
                </div>
              </div>

              <div id="pk-settings-security" className="pk-prism-section-card pk-settings-section">
                <div className="pk-prism-section-head">
                  <div className="pk-prism-section-head__icon">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold">{isFr ? "Compte & sécurité" : "Account & security"}</div>
                    <div className="text-xs text-pk-muted">
                      {isFr ? "Connexion, mot de passe, session" : "Sign-in, password, session"}
                    </div>
                  </div>
                </div>

                <div className="pk-settings-security-block">
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={[
                        "rounded-full px-3 py-1 text-[11px] font-semibold",
                        emailLinked ? "bg-emerald-500/15 text-emerald-200" : "bg-white/5 text-pk-muted",
                      ].join(" ")}
                    >
                      {isFr ? "Email" : "Email"} {emailLinked ? "✓" : "—"}
                    </span>
                    <span
                      className={[
                        "rounded-full px-3 py-1 text-[11px] font-semibold",
                        googleLinked ? "bg-emerald-500/15 text-emerald-200" : "bg-white/5 text-pk-muted",
                      ].join(" ")}
                    >
                      Google {googleLinked ? "✓" : "—"}
                    </span>
                  </div>
                  {!googleLinked ? (
                    <div className="mt-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={linkingGoogle}
                        onClick={async () => {
                          setLinkingGoogle(true);
                          try {
                            await linkGoogle("/settings");
                          } catch (err) {
                            toast.error(mapAuthError(err, locale, "link"));
                            setLinkingGoogle(false);
                          }
                        }}
                      >
                        {linkingGoogle ? (isFr ? "Redirection…" : "Redirecting…") : isFr ? "Lier Google" : "Link Google"}
                      </Button>
                    </div>
                  ) : null}
                  {!emailLinked ? (
                    <div className="mt-3 space-y-3 rounded-pk border border-pk-border/80 bg-white/[0.02] p-3">
                      <p className="text-xs text-pk-muted">
                        {isFr ? "Définis un mot de passe pour te connecter sans Google." : "Set a password to sign in without Google."}
                      </p>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        minLength={6}
                        placeholder={isFr ? "Mot de passe (6+ car.)" : "Password (6+ chars)"}
                        className="w-full rounded-pk border border-pk-border bg-pk-input px-3 py-2 text-sm outline-none focus:border-pk-accent"
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={savingPassword || newPassword.length < 6}
                        onClick={async () => {
                          setSavingPassword(true);
                          try {
                            await setPassword(newPassword);
                            setNewPassword("");
                            toast.success(isFr ? "Mot de passe enregistré" : "Password saved");
                          } catch (err) {
                            toast.error(mapAuthError(err, locale, "password"));
                          } finally {
                            setSavingPassword(false);
                          }
                        }}
                      >
                        {savingPassword ? (isFr ? "Enregistrement…" : "Saving…") : isFr ? "Créer mot de passe" : "Set password"}
                      </Button>
                    </div>
                  ) : null}
                </div>

                <div className="pk-settings-security-block">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={!user?.email}
                      onClick={async () => {
                        const email = user?.email;
                        if (!email) return;
                        try {
                          await resetPassword(email);
                          toast.success(
                            isFr ? "Email envoyé" : "Email sent",
                          );
                        } catch (err) {
                          toast.error(mapAuthError(err, locale, "password"));
                        }
                      }}
                    >
                      {isFr ? "Changer mot de passe" : "Change password"}
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
                      {isFr ? "Supprimer compte" : "Delete account"}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={async () => {
                        try {
                          await signOut();
                          toast.success(isFr ? "Déconnecté" : "Signed out");
                          navigate("/auth", { replace: true });
                        } catch (err) {
                          const message = err instanceof Error ? err.message : "Sign out failed";
                          toast.error(message);
                        }
                      }}
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      {isFr ? "Déconnexion" : "Sign out"}
                    </Button>
                  </div>
                  <p className="mt-2 text-[11px] text-pk-muted">
                    {isFr ? "Suppression de compte gérée manuellement (MVP)." : "Account deletion is manual (MVP)."}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <Modal
        open={confirmDelete}
        title="Delete account"
        description="This will sign you out. For MVP, account deletion is handled by support."
        confirmText="Continue"
        danger
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          void (async () => {
            try {
              await signOut();
              toast("Contact support to delete your account.");
              navigate("/auth", { replace: true });
            } catch (err) {
              const message = err instanceof Error ? err.message : "Failed";
              toast.error(message);
            } finally {
              setConfirmDelete(false);
            }
          })();
        }}
      />
    </AppShell>
  );
}
