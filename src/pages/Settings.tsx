import { AppShell } from "@/components/AppShell";
import { AppShellAsideHeader } from "@/components/AppShellAsideHeader";
import { PrismPageHero } from "@/components/prism/PrismPageHero";
import { PrismStat } from "@/components/prism/PrismStat";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/stores/authStore";
import { PLAN_LIMITS, getRemainingBeats } from "@/lib/planLimits";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useLocaleStore } from "@/stores/localeStore";
import { CreditCard, Shield, Sparkles, UserRound, Zap } from "lucide-react";

function tierClass(plan: string) {
  if (plan === "studio") return "pk-prism-tier-badge--studio";
  if (plan === "pro") return "pk-prism-tier-badge--pro";
  return "pk-prism-tier-badge--free";
}

export default function Settings() {
  const user = useAuthStore((s) => s.user);
  const authStatus = useAuthStore((s) => s.status);
  const signOut = useAuthStore((s) => s.signOut);
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const locale = useLocaleStore((s) => s.locale);
  const isFr = locale === "fr";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const [username, setUsername] = useState("");
  const [plan, setPlan] = useState(() => {
    try {
      const raw = window.localStorage.getItem("producerhit_plan");
      return raw === "pro" || raw === "studio" || raw === "free" ? raw : "free";
    } catch {
      return "free";
    }
  });
  const [usedThisMonth, setUsedThisMonth] = useState(() => {
    try {
      const raw = window.localStorage.getItem("producerhit_used_this_month");
      const n = raw ? Number(raw) : 0;
      return Number.isFinite(n) && n >= 0 ? n : 0;
    } catch {
      return 0;
    }
  });

  const remaining = useMemo(() => getRemainingBeats(plan, usedThisMonth), [plan, usedThisMonth]);
  const limit = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.free;
  const pct = limit > 0 ? Math.min(100, Math.max(0, (usedThisMonth / limit) * 100)) : 0;
  const initials = useMemo(() => {
    const src = username.trim() || user?.email?.split("@")[0] || "?";
    return src.slice(0, 2).toUpperCase();
  }, [username, user?.email]);

  useEffect(() => {
    if (authStatus !== "ready") return;
    if (!user) return;
    let mounted = true;
    void (async () => {
      setLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error("Not authenticated");
        await supabase.rpc("reset_loops_usage_if_needed");
        const { data, error } = await supabase
          .from("profiles")
          .select("username, plan, loops_used_this_month")
          .eq("id", user.id)
          .single();
        if (error) throw error;
        if (mounted) {
          setUsername(typeof data?.username === "string" ? data.username : "");
          setPlan(typeof data?.plan === "string" ? data.plan : "free");
          setUsedThisMonth(typeof data?.loops_used_this_month === "number" ? data.loops_used_this_month : 0);
          try {
            const nextPlan = typeof data?.plan === "string" ? data.plan : "free";
            const nextUsed = typeof data?.loops_used_this_month === "number" ? data.loops_used_this_month : 0;
            window.localStorage.setItem("producerhit_plan", nextPlan);
            window.localStorage.setItem("producerhit_used_this_month", String(nextUsed));
          } catch {
            // ignore
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load profile";
        toast.error(message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [authStatus, user]);

  return (
    <AppShell
      theme="prism"
      left={
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
      }
    >
      <div className="h-full space-y-5 px-4 pb-36 pt-6 md:pb-24">
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
            <PrismStat label={isFr ? "Profil" : "Profile"} value={initials} icon={<UserRound className="h-4 w-4" />} />
          </div>
        </PrismPageHero>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="pk-prism-section-card">
            <div className="pk-prism-section-head">
              <div className="pk-prism-section-head__icon">
                <UserRound className="h-4 w-4" />
              </div>
              <div>
                <div className="text-lg font-semibold">{isFr ? "Profil" : "Profile"}</div>
                <div className="text-xs text-pk-muted">{isFr ? "Identité publique du studio" : "Your studio identity"}</div>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-4">
              <div className="pk-prism-aside-avatar h-14 w-14 text-base">{initials}</div>
              <div className="min-w-0 text-sm text-pk-muted">
                <div className="truncate font-semibold text-white">{username || (isFr ? "Sans nom" : "No name")}</div>
                <div className="truncate">{user?.email ?? "—"}</div>
              </div>
            </div>
            <div className="mt-5 grid gap-4">
              <div>
                <div className="text-xs text-pk-muted">{isFr ? "Nom" : "Username"}</div>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading || saving}
                  className="mt-2 w-full rounded-pk border border-pk-border bg-pk-input px-3 py-2.5 text-sm outline-none focus:border-pk-accent"
                  placeholder={isFr ? "Ton nom de producteur" : "Your producer name"}
                />
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
                  setSaving(true);
                  try {
                    const { error } = await supabase.from("profiles").update({ username }).eq("id", user.id);
                    if (error) throw error;
                    toast.success(isFr ? "Sauvegardé" : "Saved");
                  } catch (err) {
                    const message = err instanceof Error ? err.message : "Save failed";
                    toast.error(message);
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {isFr ? "Sauvegarder" : "Save"}
              </Button>
            </div>
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
                    toast.success(isFr ? "Email de reset envoyé" : "Password reset email sent");
                  } catch (err) {
                    const message = err instanceof Error ? err.message : "Request failed";
                    toast.error(message);
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
