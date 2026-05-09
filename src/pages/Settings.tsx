import { AppShell } from "@/components/AppShell";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/stores/authStore";
import { PLAN_LIMITS, getRemainingBeats } from "@/lib/planLimits";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useLocaleStore } from "@/stores/localeStore";

export default function Settings() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const locale = useLocaleStore((s) => s.locale);
  const isFr = locale === "fr";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const [username, setUsername] = useState("");
  const [plan, setPlan] = useState("free");
  const [usedThisMonth, setUsedThisMonth] = useState(0);

  const remaining = useMemo(() => getRemainingBeats(plan, usedThisMonth), [plan, usedThisMonth]);
  const limit = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.free;
  const pct = limit > 0 ? Math.min(100, Math.max(0, (usedThisMonth / limit) * 100)) : 0;

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    void (async () => {
      setLoading(true);
      try {
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
  }, [user]);

  return (
    <AppShell
      left={
        <div className="h-full bg-pk-panel">
          <div className="border-b border-pk-border p-4">
            <div className="text-sm font-semibold">{isFr ? "Paramètres" : "Settings"}</div>
            <div className="mt-2 text-sm text-pk-muted">
              {isFr ? "Profil, plan et contrôle du compte." : "Profile, plan, and account controls."}
            </div>
          </div>
          <div className="p-4">
            <div className="text-sm font-semibold">{isFr ? "Plan actuel" : "Current plan"}</div>
            <div className="mt-2 flex items-center gap-2 text-sm text-pk-muted">
              <Badge variant="muted">{plan}</Badge>
              <span>
                {isFr ? `${usedThisMonth} / ${limit} utilisés` : `${usedThisMonth} / ${limit} used`}
              </span>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-black/30">
              <div className="h-2 rounded-full bg-[#7c3aed]" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-pk-muted">
              <span>
                {isFr
                  ? `${remaining} génération${remaining !== 1 ? "s" : ""} restante${remaining !== 1 ? "s" : ""} ce mois-ci`
                  : `${remaining} beat${remaining !== 1 ? "s" : ""} remaining this month`}
              </span>
              <Link to="/pricing" className="text-[#7c3aed] hover:underline">
                {isFr ? "Upgrade" : "Upgrade Plan"}
              </Link>
            </div>
          </div>
        </div>
      }
    >
      <div className="h-full px-4 pb-36 pt-6 md:pb-24">
        <div className="grid gap-4">
          <div className="rounded-pk border border-pk-border bg-pk-panel p-6">
            <div className="text-lg font-semibold">{isFr ? "Profil" : "Profile"}</div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-xs text-pk-muted">{isFr ? "Nom" : "Username"}</div>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading || saving}
                  className="mt-2 w-full rounded-pk border border-pk-border bg-pk-input px-3 py-2 text-sm outline-none focus:border-pk-accent"
                  placeholder={isFr ? "Ton nom" : "Your name"}
                />
              </div>
              <div>
                <div className="text-xs text-pk-muted">Email</div>
                <input
                  value={user?.email ?? ""}
                  readOnly
                  className="mt-2 w-full rounded-pk border border-pk-border bg-pk-input px-3 py-2 text-sm text-pk-muted outline-none"
                />
              </div>
            </div>
            <div className="mt-4">
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

          <div className="rounded-pk border border-pk-border bg-pk-panel p-6">
            <div className="text-lg font-semibold">{isFr ? "Plan" : "Plan"}</div>
            <div className="mt-2 text-sm text-pk-muted">
              <span className="mr-2">{isFr ? "Actuel :" : "Current:"}</span>
              <Badge variant="muted">{plan}</Badge>
            </div>
            <div className="mt-4 text-sm text-pk-muted">
              {isFr ? "Générations utilisées ce mois-ci : " : "Beats used this month: "}
              <span className="text-pk-text">
                {usedThisMonth} / {limit}
              </span>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-black/30">
              <div className="h-2 rounded-full bg-[#7c3aed]" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                <Link to="/pricing">
                  <Button variant="secondary">{isFr ? "Upgrade" : "Upgrade Plan"}</Button>
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
          </div>

          <div className="rounded-pk border border-pk-border bg-pk-panel p-6">
            <div className="text-lg font-semibold">{isFr ? "Compte" : "Account"}</div>
            <div className="mt-4 flex flex-wrap gap-2">
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
              Account deletion is manual in the MVP. The button will sign you out and prompt you to contact support.
            </div>
          </div>

          <div className="rounded-pk border border-pk-border bg-pk-panel p-6">
            <div className="text-lg font-semibold">Danger zone</div>
            <div className="mt-4">
              <Button
                variant="secondary"
                onClick={async () => {
                  try {
                    await signOut();
                    toast.success("Signed out");
                  } catch (err) {
                    const message = err instanceof Error ? err.message : "Sign out failed";
                    toast.error(message);
                  }
                }}
              >
                Sign out
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
