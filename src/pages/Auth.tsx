import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthStore } from "@/stores/authStore";
import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { Navbar } from "@/components/Navbar";
import { ThemeBrandMark } from "@/components/ThemeBrandMark";
import { trackClientEvent } from "@/lib/supabaseClient";
import { getAttributionProps } from "@/lib/attribution";
import { useLocaleStore } from "@/stores/localeStore";
import { mapAuthError } from "@/lib/authProviders";
import { markJustAuthenticated, sanitizePostAuthPath } from "@/lib/postAuthRedirect";
import { resolveAuthModeFromSearch, resolvePostAuthRedirect, type AuthMode } from "@/lib/authRoutes";

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const signInWithPassword = useAuthStore((s) => s.signInWithPassword);
  const signUp = useAuthStore((s) => s.signUp);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const user = useAuthStore((s) => s.user);
  const locale = useLocaleStore((s) => s.locale);
  const isFr = locale === "fr";

  const initialMode = useMemo(() => resolveAuthModeFromSearch(location.search), [location.search]);
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [awaitingEmailConfirm, setAwaitingEmailConfirm] = useState(false);

  useEffect(() => {
    setMode(resolveAuthModeFromSearch(location.search));
  }, [location.search]);

  const googleIcon = (
    <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.14 0 5.77 1.08 7.92 3.06l5.4-5.4C33.86 3.84 29.36 2 24 2 14.64 2 6.64 7.38 3.12 15.12l6.6 5.12C11.52 14.1 17.28 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46 24.5c0-1.56-.14-3.06-.4-4.5H24v8.52h12.34c-.54 2.9-2.18 5.36-4.66 7.02l7.14 5.52C43.02 37.1 46 31.32 46 24.5z" />
      <path fill="#FBBC05" d="M9.72 28.24A14.7 14.7 0 0 1 9 24c0-1.48.22-2.92.62-4.28l-6.6-5.12A22 22 0 0 0 2 24c0 3.56.86 6.92 2.4 9.88l7.32-5.64z" />
      <path fill="#34A853" d="M24 46c5.36 0 9.86-1.78 13.14-4.84l-7.14-5.52c-1.98 1.34-4.52 2.14-6.99 2.14-6.66 0-12.36-4.48-14.4-10.56l-7.32 5.64C6.7 40.72 14.64 46 24 46z" />
      <path fill="none" d="M0 0h48v48H0z" />
    </svg>
  );

  const redirectTo = useMemo(() => {
    const state = location.state as { from?: string; authError?: string } | null;
    const next = new URLSearchParams(location.search).get("next");
    return sanitizePostAuthPath(next || state?.from || "/dashboard");
  }, [location.search, location.state]);

  const getPostAuthRedirect = useCallback(() => resolvePostAuthRedirect(redirectTo), [redirectTo]);

  const finishAuthRedirect = useCallback(() => {
    markJustAuthenticated();
    navigate(getPostAuthRedirect(), { replace: true });
  }, [getPostAuthRedirect, navigate]);

  useEffect(() => {
    const state = location.state as { authError?: string } | null;
    if (state?.authError) {
      setInlineError(state.authError);
    }
  }, [location.state]);

  useEffect(() => {
    if (!user) return;
    finishAuthRedirect();
  }, [finishAuthRedirect, user]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setInlineError(null);
    setAwaitingEmailConfirm(false);
    setBusy(true);
    try {
      if (mode === "login") {
        await signInWithPassword(email.trim(), password);
        toast.success(isFr ? "T'es connecté — let's cook 🔥" : "You're in — let's cook 🔥");
        finishAuthRedirect();
      } else {
        trackClientEvent("signup_started", { method: "email", ...getAttributionProps() });
        const postAuthPath = getPostAuthRedirect();
        const { needsEmailConfirm } = await signUp(email.trim(), password, postAuthPath);
        trackClientEvent("signup_completed", { method: "email", needs_email_confirm: needsEmailConfirm, ...getAttributionProps() });
        if (needsEmailConfirm) {
          setAwaitingEmailConfirm(true);
        } else {
          try {
            window.localStorage.setItem("producerhit_dashboard_welcome_v1", "1");
          } catch {
            void 0;
          }
          finishAuthRedirect();
        }
      }
    } catch (err) {
      const message = mapAuthError(err, locale, mode === "login" ? "login" : "signup");
      setInlineError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setInlineError(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        trackClientEvent("signup_started", { method: "google", ...getAttributionProps() });
      }
      await signInWithGoogle(email.trim() || undefined, getPostAuthRedirect());
    } catch (err) {
      const message = mapAuthError(err, locale, "google");
      setInlineError(message);
      toast.error(message);
      setBusy(false);
    }
  }

  async function onForgot() {
    if (!email.trim()) {
      toast.error(isFr ? "Entre ton email d'abord" : "Enter your email first");
      return;
    }
    setBusy(true);
    try {
      await resetPassword(email.trim());
      toast.success(
        isFr
          ? "Email envoyé — crée ou réinitialise ton mot de passe (comptes Google inclus)."
          : "Email sent — create or reset your password (Google accounts too).",
      );
    } catch (err) {
      const message = mapAuthError(err, locale, "password");
      setInlineError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  if (awaitingEmailConfirm) {
    return (
      <MarketingPageShell className="min-h-[100dvh] text-pk-text">
        <Navbar variant="auth" />
        <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-md flex-col justify-center px-6 py-10">
          <div className="pk-auth-panel rounded-2xl border border-pk-border bg-pk-panel/70 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl text-center">
            <div className="text-2xl" aria-hidden>
              ✉️
            </div>
            <h1 className="mt-3 text-lg font-semibold">{isFr ? "Confirme ton email" : "Confirm your email"}</h1>
            <p className="mt-2 text-sm leading-relaxed text-pk-muted">
              {isFr
                ? `On t'a envoyé un lien à ${email.trim()}. Ouvre-le pour activer ton compte et accéder au studio.`
                : `We sent a link to ${email.trim()}. Open it to activate your account and enter the studio.`}
            </p>
            <p className="mt-3 text-[11px] leading-relaxed text-pk-muted/80">
              {isFr
                ? "Rien reçu ? Vérifie les spams ou connecte-toi avec Google — même email, même compte."
                : "Nothing in inbox? Check spam or continue with Google — same email, same account."}
            </p>
            <button
              type="button"
              onClick={() => {
                setAwaitingEmailConfirm(false);
                setMode("login");
              }}
              className="pk-prism-btn mt-6 inline-flex w-full items-center justify-center rounded-full px-4 py-3 text-sm font-semibold"
            >
              {isFr ? "J'ai confirmé — me connecter" : "I confirmed — sign in"}
            </button>
          </div>
        </div>
      </MarketingPageShell>
    );
  }

  return (
    <MarketingPageShell className="min-h-[100dvh] text-pk-text">
      <Navbar variant="auth" />
      <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-md flex-col justify-center px-6 py-10">
        <div className="pk-auth-panel rounded-2xl border border-pk-border bg-pk-panel/70 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <div className="text-center">
            <div className="flex flex-col items-center gap-2">
              <ThemeBrandMark className="h-7 w-7" />
              <div className="text-2xl font-semibold tracking-tight">
                <span className="lowercase text-pk-text/90">producer</span>
                <span className="pk-prism-holo-text lowercase">hit</span>
              </div>
            </div>
            <p className="mt-2 text-sm text-pk-muted">
              {mode === "login"
                ? isFr
                  ? "Connecte-toi — email ou Google, même compte."
                  : "Sign in — email or Google, same account."
                : isFr
                  ? "Crée ton compte gratuit — prêt en quelques secondes."
                  : "Create your free account — ready in seconds."}
            </p>
          </div>

          <div className="pk-auth-tabs mt-6 flex gap-1 rounded-full border border-pk-border bg-white/5 p-1 text-xs">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={
                mode === "login"
                  ? "pk-auth-tab-active flex-1 rounded-full bg-[#7c3aed] px-3 py-2 font-semibold text-white"
                  : "flex-1 rounded-full px-3 py-2 font-semibold text-pk-muted hover:text-pk-text"
              }
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={
                mode === "signup"
                  ? "pk-auth-tab-active flex-1 rounded-full bg-[#7c3aed] px-3 py-2 font-semibold text-white"
                  : "flex-1 rounded-full px-3 py-2 font-semibold text-pk-muted hover:text-pk-text"
              }
            >
              Signup
            </button>
          </div>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div>
              <label htmlFor="auth-email" className="text-xs font-medium text-pk-muted">Email</label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-pk border border-pk-border bg-pk-input px-3 py-2 text-sm text-pk-text outline-none ring-0 placeholder:text-pk-muted focus:border-pk-accent"
                placeholder="you@studio.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label htmlFor="auth-password" className="text-xs font-medium text-pk-muted">Password</label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-pk border border-pk-border bg-pk-input px-3 py-2 text-sm text-pk-text outline-none ring-0 placeholder:text-pk-muted focus:border-pk-accent"
                placeholder="••••••••"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                minLength={6}
              />
            </div>

            {inlineError ? (
              <div className="rounded-pk border border-pk-danger/40 bg-pk-danger/10 p-3 text-sm text-pk-text">{inlineError}</div>
            ) : null}

            <p className="text-[11px] leading-relaxed text-pk-muted">
              {isFr
                ? "Même email = même compte Studio. Inscrit par email puis Google (ou l'inverse) : on fusionne automatiquement."
                : "Same email = same Studio account. Email then Google (or reverse): we merge automatically."}
            </p>

            <button
              type="submit"
              disabled={busy}
              className="pk-prism-btn inline-flex w-full items-center justify-center rounded-full px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy
                ? isFr
                  ? "Chargement…"
                  : "Loading…"
                : mode === "login"
                  ? "Login"
                  : isFr
                    ? "Créer mon compte gratuit"
                    : "Create free account"}
            </button>

            <button
              type="button"
              onClick={onGoogle}
              disabled={busy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-pk-border bg-white/5 px-4 py-3 text-sm font-semibold text-pk-text transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {googleIcon}
              {isFr ? "Continuer avec Google" : "Continue with Google"}
            </button>

            <button
              type="button"
              onClick={onForgot}
              disabled={busy}
              className="w-full text-center text-xs font-medium text-pk-muted hover:text-pk-text"
            >
              {isFr ? "Mot de passe oublié / créer un mot de passe" : "Forgot password / set a password"}
            </button>
          </form>
        </div>
      </div>
    </MarketingPageShell>
  );
}
