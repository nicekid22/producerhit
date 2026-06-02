import { AppShell } from "@/components/AppShell";
import { AppShellAsideHeader } from "@/components/AppShellAsideHeader";
import { PrismPageHero } from "@/components/prism/PrismPageHero";
import { PrismStat } from "@/components/prism/PrismStat";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { syncProfileCache } from "@/lib/profileBootstrap";
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
import { PLAN_LIMITS, getRemainingBeats, getTotalGenerationLimit } from "@/lib/planLimits";
import { buildReferralInviteUrl, ensureReferralCode } from "@/lib/referral";
import {
  REFERRAL_FREE_BASE,
  REFERRAL_REFEREE_BONUS,
  REFERRAL_REFEREE_START_TOTAL,
  REFERRAL_REFERRER_PLUS_BONUS,
} from "@/lib/referralConfig";
import { Button } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";
import { Modal } from "@/components/ui/Modal";
import { useLocaleStore } from "@/stores/localeStore";
import { CreditCard, Shield, Sparkles, UserRound, Zap } from "lucide-react";
import { PkIconLoader } from "@/components/ui/PkIconLoader";
import { hasEmailPassword, hasGoogleAuth, mapAuthError } from "@/lib/authProviders";
import { useMobileUiV2 } from "@/hooks/useMobileUiV2";
import { SettingsGrowthExtras } from "@/components/settings/SettingsGrowthExtras";

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
  const isFr = locale === "fr";
  const mobileUiV2 = useMobileUiV2();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

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
  const profileDisplay = username.trim() || (isFr ? "Non défini" : "Not set");
  const creatorTypeOptions = useMemo(
    () =>
      CREATOR_TYPE_OPTIONS.map((opt) => ({
        value: opt.value,
        label: isFr ? opt.labelFr : opt.labelEn,
      })),
    [isFr],
  );

  useEffect(() => {
    if (authStatus !== "ready" || !user) {
      setLoading(false);
      return;
    }
    if (authProfile) {
      setUsername(authProfile.username ?? "");
      setBio(authProfile.bio ?? "");
      setCreatorType((authProfile.creator_type as CreatorType | null) ?? "");
      setSocialIg(authProfile.social?.ig ?? "");
      setSocialTt(authProfile.social?.tt ?? "");
      setSocialYt(authProfile.social?.yt ?? "");
      setSocialX(authProfile.social?.x ?? "");
      setSocialWeb(authProfile.social?.web ?? "");
      setPlan(authProfile.plan);
      setUsedThisMonth(authProfile.loops_used_this_month);
      setReferralBonus(authProfile.referral_bonus);
      setLevelBonus(authProfile.level_bonus);
      setDailyBonusMonth(authProfile.daily_bonus_month);
      setReferralCode(authProfile.referral_code ?? "");
      syncProfileCache(authProfile.plan, authProfile.loops_used_this_month, user?.id);
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
    <AppShell
      theme="prism"
      variant={mobileUiV2 ? "single" : "split"}
      left={
        mobileUiV2 ? undefined : (
        <AppShellAsideHeader
          eyebrow={isFr ? "CENTRE DE CONTRÔLE" : "CONTROL CENTER"}
          title={isFr ? "Paramètres" : "Settings"}
          subtitle={user?.email ?? (isFr ? "Connecte-toi pour gérer ton compte." : "Sign in to manage your account.")}
          avatarInitials={initials}
          stats={[
            { label: "Plan", value: plan },
            { label: isFr ? "Utilisés" : "Used", value: `${usedThisMonth}/${limit}` },
            { label: isFr ? "Restants" : "Left", value: remaining },
            { label: isFr ? "Quota" : "Quota", value: `${Math.round(pct)}%` },
          ]}
        >
          <div className={`pk-prism-tier-badge ${tierClass(plan)}`}>
            <Sparkles className="h-3 w-3" />
            {plan}
          </div>
          <div className="mt-4 pk-prism-progress-track">
            <div className="pk-prism-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-pk-muted">
            <span>
              {isFr
                ? `${remaining} génération${remaining !== 1 ? "s" : ""} restante${remaining !== 1 ? "s" : ""}`
                : `${remaining} beat${remaining !== 1 ? "s" : ""} left`}
            </span>
            <Link to="/pricing" className="pk-prism-holo-text hover:opacity-90">
              Upgrade
            </Link>
          </div>
        </AppShellAsideHeader>
        )
      }
    >
      <div className="h-full space-y-5 px-4 pb-6 pt-6 md:pb-24">
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
        <PrismPageHero
          eyebrow={isFr ? "COMPTE PRODUCER" : "PRODUCER ACCOUNT"}
          title={<span className="pk-prism-holo-text">{isFr ? "Ton espace personnel" : "Your personal space"}</span>}
          description={
            isFr
              ? "Profil, abonnement et sécurité — tout est centralisé ici."
              : "Profile, subscription, and security — all in one place."
          }
          actions={
            <Link to="/pricing">
              <Button variant="primary" size="sm">
                <Zap className="h-4 w-4" />
                {isFr ? "Voir les plans" : "View plans"}
              </Button>
            </Link>
          }
        >
          <div className="pk-prism-stat-grid">
            <PrismStat label="Plan" value={plan} icon={<CreditCard className="h-4 w-4" />} accent="violet" />
            <PrismStat label={isFr ? "Ce mois" : "This month"} value={`${usedThisMonth}/${limit}`} icon={<Zap className="h-4 w-4" />} accent="cyan" />
            <PrismStat label={isFr ? "Restants" : "Remaining"} value={remaining} icon={<Sparkles className="h-4 w-4" />} />
            <PrismStat label={isFr ? "Profil" : "Profile"} value={profileDisplay} icon={<UserRound className="h-4 w-4" />} />
          </div>
        </PrismPageHero>

        <SettingsGrowthExtras locale={locale} plan={plan} />

        <div className="grid gap-4 lg:grid-cols-2">
          <div id="pk-settings-profile" className="pk-prism-section-card">
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
                    setUsername(username.trim());
                    const refreshed = await refreshProfile();
                    if (refreshed?.username) setUsername(refreshed.username);
                    toast.success(isFr ? "Profil sauvegardé" : "Profile saved");
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

          <div id="pk-settings-referral" className="pk-prism-section-card lg:col-span-2">
            <div className="pk-prism-section-head">
              <div className="pk-prism-section-head__icon">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="text-lg font-semibold">{isFr ? "Parrainage" : "Referral program"}</div>
                <div className="text-xs text-pk-muted">
                  {isFr
                    ? `Offre inratable — ${REFERRAL_REFEREE_START_TOTAL} gen pour eux, +${REFERRAL_REFERRER_PLUS_BONUS} pour toi quand ils passent Plus.`
                    : `Unbeatable offer — ${REFERRAL_REFEREE_START_TOTAL} gens for them, +${REFERRAL_REFERRER_PLUS_BONUS} for you when they go Plus.`}
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-violet-400/20 bg-violet-500/[0.06] p-4 text-sm leading-relaxed text-white/75">
              <p className="font-semibold text-white">
                {isFr ? "Comment ça marche" : "How it works"}
              </p>
              <ul className="mt-2 space-y-2 text-xs sm:text-sm">
                <li>
                  {isFr
                    ? `1. Envoie ton lien — ton pote s'inscrit et obtient ${REFERRAL_REFEREE_START_TOTAL} générations dès le départ (${REFERRAL_FREE_BASE} free + ${REFERRAL_REFEREE_BONUS} bonus lien).`
                    : `1. Send your link — your friend signs up and starts with ${REFERRAL_REFEREE_START_TOTAL} generations (${REFERRAL_FREE_BASE} free + ${REFERRAL_REFEREE_BONUS} link bonus).`}
                </li>
                <li>
                  {isFr
                    ? `2. Quand ton filleul passe au plan Plus, tu reçois +${REFERRAL_REFERRER_PLUS_BONUS} générations automatiquement.`
                    : `2. When your referral upgrades to Plus, you automatically get +${REFERRAL_REFERRER_PLUS_BONUS} generations.`}
                </li>
                <li>
                  {isFr
                    ? "3. Loot daily, niveaux, streaks — les bonus s'enchaînent."
                    : "3. Daily loot, levels, streaks — bonuses keep stacking."}
                </li>
              </ul>
            </div>
            {referralBonus > 0 || levelBonus > 0 || dailyBonusMonth > 0 ? (
              <div className="mt-4 space-y-1 text-sm text-[var(--prism-cyan)]">
                {referralBonus > 0 ? (
                  <div>{isFr ? `Parrainage : +${referralBonus} gen` : `Referral: +${referralBonus} gen`}</div>
                ) : null}
                {levelBonus > 0 ? (
                  <div>{isFr ? `Niveaux : +${levelBonus} gen` : `Levels: +${levelBonus} gen`}</div>
                ) : null}
                {dailyBonusMonth > 0 ? (
                  <div>{isFr ? `Bonus daily ce mois : +${dailyBonusMonth} gen` : `Daily bonus this month: +${dailyBonusMonth} gen`}</div>
                ) : null}
              </div>
            ) : null}
            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <div className="text-xs text-pk-muted">{isFr ? "Ton lien d’invitation" : "Your invite link"}</div>
                <input
                  value={referralLinkLoading ? (isFr ? "Génération du lien…" : "Generating link…") : referralLink}
                  readOnly
                  className="mt-2 w-full rounded-pk border border-pk-border bg-pk-input px-3 py-2.5 text-sm text-pk-muted outline-none"
                />
              </div>
              <Button
                variant="secondary"
                disabled={!referralLink || referralLinkLoading}
                onClick={() => {
                  void navigator.clipboard.writeText(referralLink).then(() => {
                    toast.success(isFr ? "Lien copié" : "Link copied");
                  });
                }}
              >
                {isFr ? "Copier" : "Copy"}
              </Button>
            </div>
            {referralCode ? (
              <div className="mt-3 text-xs text-pk-muted">
                {isFr ? "Code" : "Code"}: <span className="font-semibold text-white">{referralCode}</span>
              </div>
            ) : null}
          </div>

          <div className="pk-prism-section-card">
            <div className="pk-prism-section-head">
              <div className="pk-prism-section-head__icon">
                <CreditCard className="h-4 w-4" />
              </div>
              <div>
                <div className="text-lg font-semibold">{isFr ? "Abonnement" : "Subscription"}</div>
                <div className="text-xs text-pk-muted">{isFr ? "Quota mensuel & upgrade" : "Monthly quota & upgrades"}</div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className={`pk-prism-tier-badge ${tierClass(plan)}`}>{plan}</span>
              <span className="text-sm text-pk-muted">
                {usedThisMonth} / {limit} {isFr ? "générations" : "generations"}
              </span>
            </div>
            <div className="mt-4 pk-prism-progress-track">
              <div className="pk-prism-progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="pk-prism-chip-cloud mt-4">
              <span className="pk-prism-vibe-chip">{isFr ? "Exports HD" : "HD exports"}</span>
              <span className="pk-prism-vibe-chip">{isFr ? "Historique cloud" : "Cloud history"}</span>
              <span className="pk-prism-vibe-chip">{isFr ? "Communauté" : "Community"}</span>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link to="/pricing">
                <Button variant="primary">{isFr ? "Upgrade" : "Upgrade Plan"}</Button>
              </Link>
              {plan !== "free" ? (
                <Button
                  variant="secondary"
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
                  {portalLoading ? (isFr ? "Chargement…" : "Loading…") : isFr ? "Gérer l’abonnement" : "Manage subscription"}
                </Button>
              ) : null}
            </div>
          </div>

          <div className="pk-prism-section-card">
            <div className="pk-prism-section-head">
              <div className="pk-prism-section-head__icon">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <div className="text-lg font-semibold">{isFr ? "Connexion au compte" : "Account sign-in"}</div>
                <div className="text-xs text-pk-muted">
                  {isFr ? "Email, Google — un seul compte ProducerHit" : "Email, Google — one ProducerHit account"}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span
                className={[
                  "rounded-full px-3 py-1 text-[11px] font-semibold",
                  emailLinked ? "bg-emerald-500/15 text-emerald-200" : "bg-white/5 text-pk-muted",
                ].join(" ")}
              >
                {isFr ? "Email / mot de passe" : "Email / password"} {emailLinked ? "✓" : "—"}
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
              <div className="mt-4">
                <Button
                  variant="secondary"
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
              <div className="mt-4 space-y-3 rounded-pk border border-pk-border/80 bg-white/[0.02] p-4">
                <p className="text-xs text-pk-muted">
                  {isFr
                    ? "Compte créé avec Google ? Définis un mot de passe pour te connecter sans Google."
                    : "Signed up with Google? Set a password to sign in without Google."}
                </p>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  placeholder={isFr ? "Nouveau mot de passe (6+ caractères)" : "New password (6+ chars)"}
                  className="w-full rounded-pk border border-pk-border bg-pk-input px-3 py-2.5 text-sm outline-none focus:border-pk-accent"
                />
                <Button
                  variant="primary"
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
                  {savingPassword ? (isFr ? "Enregistrement…" : "Saving…") : isFr ? "Créer un mot de passe" : "Set password"}
                </Button>
              </div>
            ) : null}
          </div>

          <div className="pk-prism-section-card">
            <div className="pk-prism-section-head">
              <div className="pk-prism-section-head__icon">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <div className="text-lg font-semibold">{isFr ? "Sécurité" : "Security"}</div>
                <div className="text-xs text-pk-muted">{isFr ? "Mot de passe & suppression" : "Password & deletion"}</div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                disabled={!user?.email}
                onClick={async () => {
                  const email = user?.email;
                  if (!email) return;
                  try {
                    await resetPassword(email);
                    toast.success(
                      isFr
                        ? "Email envoyé — réinitialise ou crée ton mot de passe"
                        : "Email sent — reset or create your password",
                    );
                  } catch (err) {
                    toast.error(mapAuthError(err, locale, "password"));
                  }
                }}
              >
                {isFr ? "Changer le mot de passe" : "Change Password"}
              </Button>
              <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                {isFr ? "Supprimer le compte" : "Delete Account"}
              </Button>
            </div>
            <div className="mt-3 text-xs text-pk-muted">
              {isFr
                ? "La suppression de compte est gérée manuellement pour le MVP."
                : "Account deletion is manual in the MVP."}
            </div>
          </div>

          <div className="pk-prism-section-card">
            <div className="pk-prism-section-head">
              <div className="pk-prism-section-head__icon">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <div className="text-lg font-semibold">Session</div>
                <div className="text-xs text-pk-muted">{isFr ? "Déconnexion rapide" : "Quick sign out"}</div>
              </div>
            </div>
            <div className="mt-5">
              <Button
                variant="secondary"
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
                {isFr ? "Se déconnecter" : "Sign out"}
              </Button>
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
