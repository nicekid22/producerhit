import { AppShell } from "@/components/AppShell";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { runCheckoutWithAuth } from "@/lib/billing";
import { CheckoutRecoveryBanner } from "@/components/billing/CheckoutRecoveryBanner";
import { FreeUpgradeStrip } from "@/components/billing/FreeUpgradeStrip";
import { useResolvedPlan } from "@/hooks/useResolvedPlan";
import { supabase } from "@/lib/supabaseClient";
import { readProfileCache, syncProfileCache } from "@/lib/profileBootstrap";
import { validateLegalName } from "@/lib/saveLegalName";
import {
  creatorProfileErrorMessage,
  profilePath,
  saveCreatorProfile,
  validateUsername,
  type CreatorSocialLinks,
  type CreatorType,
} from "@/lib/creatorProfile";
import {
  buildSettingsSection,
  creatorTypeOptionsI18n,
} from "@/i18n/settingsCatalog";
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
import { discordCommunityUrl } from "@/lib/discordConfig";
import { PkIconLoader } from "@/components/ui/PkIconLoader";
import { hasEmailPassword, hasGoogleAuth, mapAuthError } from "@/lib/authProviders";
import { SettingsGrowthExtras } from "@/components/settings/SettingsGrowthExtras";
import { SettingsAppearancePanel } from "@/components/settings/SettingsAppearancePanel";
import { ReferralStatsPanel } from "@/components/growth/ReferralStatsPanel";
import { ReferralLeaderboard } from "@/components/growth/ReferralLeaderboard";
import { ViralShareBar } from "@/components/growth/ViralShareBar";
import { markActivationStepLocal } from "@/lib/onboardingProgress";
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
  const { plan: billingPlan, ready: billingPlanReady, bannersReady: billingBannersReady } = useResolvedPlan();
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const signOut = useAuthStore((s) => s.signOut);
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const linkGoogle = useAuthStore((s) => s.linkGoogle);
  const setPassword = useAuthStore((s) => s.setPassword);
  const locale = useLocaleStore((s) => s.locale);
  const copy = useMemo(() => buildSettingsSection(locale), [locale]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("pk-settings-profile");

  const [username, setUsername] = useState("");
  const [legalFirstName, setLegalFirstName] = useState("");
  const [legalLastName, setLegalLastName] = useState("");
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
  const displayName = username.trim() || user?.email?.split("@")[0] || "Producer";
  const creatorTypeOptions = useMemo(() => creatorTypeOptionsI18n(locale), [locale]);

  const navItems = useMemo(
    () => [
      { id: "pk-settings-profile", label: copy.navProfile },
      { id: "pk-settings-plan", label: copy.navPlan },
      { id: "pk-settings-referral", label: copy.navReferral },
      { id: "pk-settings-security", label: copy.navSecurity },
    ],
    [copy],
  );

  const setActiveTab = useCallback((id: string) => {
    setActiveSection(id);
  }, []);

  useEffect(() => {
    if (loading) return;
    const hash = window.location.hash.replace(/^#/, "").trim();
    if (!hash) return;
    setActiveTab(hash);
  }, [loading, setActiveTab]);

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
        setLegalFirstName(authProfile.legal_first_name ?? "");
        setLegalLastName(authProfile.legal_last_name ?? "");
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
        purchased_bonus: authProfile.purchased_bonus ?? 0,
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
              label={copy.loadingProfile}
            />
          </div>
        ) : (
          <>
            <SettingsIdentityHero
              copy={copy}
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
              onNav={setActiveTab}
              onUpgrade={
                plan === "free"
                  ? () => void runCheckoutWithAuth({ plan: "pro", location: "settings_hero", locale })
                  : remaining === 0
                    ? () => navigate("/pricing")
                    : undefined
              }
            />

            <SettingsGrowthExtras locale={locale} plan={plan} compact />

            {activeSection === "pk-settings-profile" ? (
              <div className="pk-settings-bento">
                <div id="pk-settings-profile" className="pk-prism-section-card pk-settings-section">
                  <div className="pk-prism-section-head">
                    <div className="pk-prism-section-head__icon">
                      <UserRound className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold">{copy.navProfile}</div>
                      <div className="text-xs text-pk-muted">{copy.studioIdentity}</div>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-4">
                    <div>
                      <div className="text-xs text-pk-muted">{copy.publicUsername}</div>
                      <input
                        id="settings-username"
                        aria-label={copy.publicUsername}
                        value={username}
                        onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
                        disabled={loading || saving}
                        className="mt-2 w-full rounded-pk border border-pk-border bg-pk-input px-3 py-2.5 text-sm outline-none focus:border-pk-accent"
                        placeholder={copy.usernamePlaceholder}
                      />
                      <div className="mt-1 text-[11px] text-pk-muted">
                        {copy.usernameHint}
                      </div>
                      {publicProfileUrl ? (
                        <Link to={publicProfileUrl} className="mt-2 inline-block text-xs font-semibold text-pk-accent hover:underline">
                          {copy.viewPublicProfile}
                        </Link>
                      ) : null}
                    </div>

                    <div className="rounded-pk border border-pk-border/80 bg-pk-input/40 p-4 sm:col-span-2">
                      <div className="text-sm font-semibold">{copy.legalNameTitle}</div>
                      <p className="mt-1 text-[11px] leading-relaxed text-pk-muted">{copy.legalNameHint}</p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div>
                          <div className="text-xs text-pk-muted">{copy.firstName}</div>
                          <input
                            value={legalFirstName}
                            onChange={(e) => setLegalFirstName(e.target.value)}
                            disabled={loading || saving}
                            className="mt-2 w-full rounded-pk border border-pk-border bg-pk-input px-3 py-2.5 text-sm outline-none focus:border-pk-accent"
                            autoComplete="given-name"
                          />
                        </div>
                        <div>
                          <div className="text-xs text-pk-muted">{copy.lastName}</div>
                          <input
                            value={legalLastName}
                            onChange={(e) => setLegalLastName(e.target.value)}
                            disabled={loading || saving}
                            className="mt-2 w-full rounded-pk border border-pk-border bg-pk-input px-3 py-2.5 text-sm outline-none focus:border-pk-accent"
                            autoComplete="family-name"
                          />
                        </div>
                      </div>
                    </div>

                    <Dropdown
                      label={copy.creatorType}
                      value={creatorType}
                      onChange={(value) => setCreatorType(value as CreatorType | "")}
                      options={creatorTypeOptions}
                      placeholder={copy.choose}
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
                        placeholder={copy.bioPlaceholder}
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
                        <div className="text-xs text-pk-muted">{copy.website}</div>
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
                        const usernameError = validateUsername(username, locale, true);
                        if (usernameError) {
                          toast.error(usernameError);
                          return;
                        }
                        if (legalFirstName.trim() || legalLastName.trim()) {
                          const firstErr = validateLegalName(legalFirstName, locale);
                          const lastErr = validateLegalName(legalLastName, locale);
                          if (firstErr || lastErr) {
                            toast.error(firstErr ?? lastErr ?? copy.invalidLegalName);
                            return;
                          }
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
                            legal_first_name: legalFirstName.trim(),
                            legal_last_name: legalLastName.trim(),
                          });
                          if (!result.ok) {
                            toast.error(creatorProfileErrorMessage("error" in result ? result.error : "save_failed", locale));
                            return;
                          }
                          const trimmed = username.trim();
                          setUsername(trimmed);
                          toast.success(copy.profileSaved);
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
                      {copy.saveProfile}
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
                        <div className="text-base font-semibold">{copy.appearance}</div>
                        <div className="text-xs text-pk-muted">
                          {copy.studioTheme}
                        </div>
                      </div>
                    </div>
                    <SettingsAppearancePanel />
                  </div>
                </div>
              </div>
            ) : null}

            {activeSection === "pk-settings-plan" ? (
              <div className="pk-settings-bento">
                <div id="pk-settings-plan" className="pk-prism-section-card pk-settings-section pk-settings-section--compact">
                  <CheckoutRecoveryBanner
                    locale={locale}
                    location="settings"
                    currentPlan={billingBannersReady ? billingPlan : undefined}
                    planReady={billingBannersReady}
                    className="mb-4"
                  />
                  {billingBannersReady && billingPlan === "free" ? (
                    <FreeUpgradeStrip
                      locale={locale}
                      location="settings_strip"
                      plan={billingPlan}
                      ready={billingBannersReady}
                      className="mb-4"
                    />
                  ) : null}
                  <div className="pk-prism-section-head">
                    <div className="pk-prism-section-head__icon">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-base font-semibold">{copy.subscription}</div>
                      <div className="text-xs text-pk-muted">{copy.planBilling}</div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className={`pk-prism-tier-badge ${tierClass(plan)}`}>
                      <Sparkles className="h-3 w-3" />
                      {plan}
                    </span>
                  </div>
                  <div className="pk-prism-chip-cloud mt-3">
                    <span className="pk-prism-vibe-chip">{copy.hdExports}</span>
                    <span className="pk-prism-vibe-chip">{copy.cloud}</span>
                    <span className="pk-prism-vibe-chip">{copy.community}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {plan === "free" ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => void runCheckoutWithAuth({ plan: "pro", location: "settings_upgrade", locale })}
                      >
                        {copy.upgrade}
                      </Button>
                    ) : (
                      <Link to="/pricing">
                        <Button variant="primary" size="sm">{copy.upgrade}</Button>
                      </Link>
                    )}
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
                        {portalLoading ? copy.loading : copy.manage}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            {activeSection === "pk-settings-referral" ? (
              <div className="pk-settings-bento">
                <div id="pk-settings-referral" className="pk-prism-section-card pk-settings-section pk-settings-bento__full">
                  <div className="pk-prism-section-head">
                    <div className="pk-prism-section-head__icon">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold">{copy.referralProgram}</div>
                      <div className="text-xs text-pk-muted">
                        {copy.referralSubtitle(REFERRAL_REFERRER_SIGNUP_BONUS, REFERRAL_REFEREE_START_TOTAL)}
                      </div>
                    </div>
                  </div>
                  <div className="pk-settings-referral-highlight text-sm leading-relaxed text-white/75">
                    <p className="font-semibold text-white">{copy.howItWorks}</p>
                    <ul className="mt-2 space-y-1.5 text-xs sm:text-sm">
                      <li>{copy.referralStep1(REFERRAL_REFEREE_START_TOTAL)}</li>
                      <li>{copy.referralStep2(REFERRAL_REFERRER_SIGNUP_BONUS)}</li>
                    </ul>
                  </div>
                  <ReferralStatsPanel locale={locale} className="mt-4" />
                  <ReferralLeaderboard locale={locale} className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4" />
                  {referralBonus > 0 || levelBonus > 0 || dailyBonusMonth > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--prism-cyan)]">
                      {referralBonus > 0 ? (
                        <span>{copy.referralBonusLabel(referralBonus)}</span>
                      ) : null}
                      {levelBonus > 0 ? (
                        <span>{copy.levelsBonusLabel(levelBonus)}</span>
                      ) : null}
                      {dailyBonusMonth > 0 ? (
                        <span>{copy.dailyBonusLabel(dailyBonusMonth)}</span>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                    <div>
                      <div className="text-xs text-pk-muted">{copy.inviteLink}</div>
                      <input
                        value={referralLinkLoading ? copy.generating : referralLink}
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
                          toast.success(copy.linkCopied);
                        });
                      }}
                    >
                      {copy.copy}
                    </Button>
                  </div>
                  {referralCode ? (
                    <div className="mt-2 text-xs text-pk-muted">
                      {copy.code}: <span className="font-semibold text-white">{referralCode}</span>
                    </div>
                  ) : null}
                  {referralLink ? (
                    <div className="mt-4">
                      <div className="mb-2 text-xs text-pk-muted">{copy.share}</div>
                      <ViralShareBar
                        url={referralLink}
                        shareText={copy.referralShareText}
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
                        {copy.discordHint}
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
                      {copy.join}
                    </a>
                    <Link to="/community" className="pk-glass-btn inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-semibold">
                      {copy.hub}
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}

            {activeSection === "pk-settings-security" ? (
              <div className="pk-settings-bento">
                <div id="pk-settings-security" className="pk-prism-section-card pk-settings-section">
                  <div className="pk-prism-section-head">
                    <div className="pk-prism-section-head__icon">
                      <Shield className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold">{copy.accountSecurity}</div>
                      <div className="text-xs text-pk-muted">{copy.signInSession}</div>
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
                        {copy.email} {emailLinked ? "✓" : "—"}
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
                          {linkingGoogle ? copy.redirecting : copy.linkGoogle}
                        </Button>
                      </div>
                    ) : null}
                    {!emailLinked ? (
                      <div className="mt-3 space-y-3 rounded-pk border border-pk-border/80 bg-white/[0.02] p-3">
                        <p className="text-xs text-pk-muted">
                          {copy.setPasswordHint}
                        </p>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          minLength={6}
                          placeholder={copy.passwordPlaceholder}
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
                              toast.success(copy.passwordSaved);
                            } catch (err) {
                              toast.error(mapAuthError(err, locale, "password"));
                            } finally {
                              setSavingPassword(false);
                            }
                          }}
                        >
                          {savingPassword ? copy.saving : copy.setPassword}
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
                            toast.success(copy.emailSent);
                          } catch (err) {
                            toast.error(mapAuthError(err, locale, "password"));
                          }
                        }}
                      >
                        {copy.changePassword}
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
                        {copy.deleteAccount}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={async () => {
                          try {
                            await signOut();
                            toast.success(copy.signedOut);
                            navigate("/auth", { replace: true });
                          } catch (err) {
                            const message = err instanceof Error ? err.message : "Sign out failed";
                            toast.error(message);
                          }
                        }}
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        {copy.signOut}
                      </Button>
                    </div>
                    <p className="mt-2 text-[11px] text-pk-muted">
                      {copy.deleteManual}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
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
