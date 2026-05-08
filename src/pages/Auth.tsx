import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthStore } from "@/stores/authStore";
import { Navbar } from "@/components/Navbar";

type Mode = "login" | "signup";

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const signInWithPassword = useAuthStore((s) => s.signInWithPassword);
  const signUp = useAuthStore((s) => s.signUp);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const user = useAuthStore((s) => s.user);

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const googleIcon = (
    <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.14 0 5.77 1.08 7.92 3.06l5.4-5.4C33.86 3.84 29.36 2 24 2 14.64 2 6.64 7.38 3.12 15.12l6.6 5.12C11.52 14.1 17.28 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46 24.5c0-1.56-.14-3.06-.4-4.5H24v8.52h12.34c-.54 2.9-2.18 5.36-4.66 7.02l7.14 5.52C43.02 37.1 46 31.32 46 24.5z"
      />
      <path
        fill="#FBBC05"
        d="M9.72 28.24A14.7 14.7 0 0 1 9 24c0-1.48.22-2.92.62-4.28l-6.6-5.12A22 22 0 0 0 2 24c0 3.56.86 6.92 2.4 9.88l7.32-5.64z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.36 0 9.86-1.78 13.14-4.84l-7.14-5.52c-1.98 1.34-4.52 2.14-6.99 2.14-6.66 0-12.36-4.48-14.4-10.56l-7.32 5.64C6.7 40.72 14.64 46 24 46z"
      />
      <path fill="none" d="M0 0h48v48H0z" />
    </svg>
  );

  const redirectTo = useMemo(() => {
    const state = location.state as { from?: string } | null;
    const next = new URLSearchParams(location.search).get("next");
    return next || state?.from || "/dashboard";
  }, [location.search, location.state]);

  const getPostAuthRedirect = useCallback(() => {
    const pending = window.localStorage.getItem("producerhit_pending_prompt");
    if (pending && pending.trim().length > 0) {
      window.localStorage.removeItem("producerhit_pending_prompt");
      return `/dashboard?prompt=${encodeURIComponent(pending.trim())}`;
    }
    return redirectTo;
  }, [redirectTo]);

  useEffect(() => {
    if (!user) return;
    navigate(getPostAuthRedirect(), { replace: true });
  }, [getPostAuthRedirect, navigate, user]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setInlineError(null);
    setBusy(true);
    try {
      if (mode === "login") {
        await signInWithPassword(email.trim(), password);
        toast.success("Signed in");
        navigate(getPostAuthRedirect(), { replace: true });
      } else {
        const { needsEmailConfirm } = await signUp(email.trim(), password);
        if (needsEmailConfirm) {
          toast.success("Account created. Check your email to confirm.");
        } else {
          toast.success("Account created");
          navigate(getPostAuthRedirect(), { replace: true });
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setInlineError(message);
      toast.error("Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setInlineError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setInlineError(message);
      toast.error("Google sign-in failed");
      setBusy(false);
    }
  }

  async function onForgot() {
    if (!email.trim()) {
      toast.error("Enter your email first");
      return;
    }
    setBusy(true);
    try {
      await resetPassword(email.trim());
      toast.success("Password reset email sent");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setInlineError(message);
      toast.error("Reset failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f7ff] text-[#1a1a2e]">
      <Navbar variant="auth" />
      <div className="mx-auto flex min-h-[calc(100vh-56px)] max-w-md flex-col justify-center px-6 py-10">
        <div className="rounded-[16px] border border-[#e5e7eb] bg-white p-8 shadow-sm">
          <div className="text-center">
            <div className="text-2xl font-semibold tracking-tight">
              <span className="lowercase">producer</span>
              <span className="lowercase text-[#6d28d9]">hit</span>
            </div>
            <p className="mt-2 text-sm text-[#6b7280]">
              {mode === "login" ? "Sign in to access the generator." : "Create your account in seconds."}
            </p>
          </div>

          <div className="mt-6 flex gap-1 rounded-full border border-[#e5e7eb] bg-[#f3f2f9] p-1 text-xs">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={
                  mode === "login"
                    ? "flex-1 rounded-full bg-[#6d28d9] px-3 py-2 font-semibold text-white"
                    : "flex-1 rounded-full px-3 py-2 font-semibold text-[#6b7280] hover:text-[#1a1a2e]"
                }
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={
                  mode === "signup"
                    ? "flex-1 rounded-full bg-[#6d28d9] px-3 py-2 font-semibold text-white"
                    : "flex-1 rounded-full px-3 py-2 font-semibold text-[#6b7280] hover:text-[#1a1a2e]"
                }
              >
                Signup
              </button>
            </div>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="text-xs font-medium text-[#6b7280]">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-[12px] border border-[#e5e7eb] bg-[#f3f2f9] px-3 py-2 text-sm text-[#1a1a2e] outline-none ring-0 placeholder:text-[#6b7280] focus:border-[#6d28d9]"
                placeholder="you@studio.com"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#6b7280]">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-[12px] border border-[#e5e7eb] bg-[#f3f2f9] px-3 py-2 text-sm text-[#1a1a2e] outline-none ring-0 placeholder:text-[#6b7280] focus:border-[#6d28d9]"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {inlineError ? (
              <div className="rounded-[12px] border border-[#ef4444]/40 bg-[#ef4444]/10 p-3 text-sm text-[#1a1a2e]">{inlineError}</div>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="inline-flex w-full items-center justify-center rounded-[12px] bg-[#6d28d9] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#5b21b6] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Loading…" : mode === "login" ? "Login" : "Create account"}
            </button>

            <button
              type="button"
              onClick={onGoogle}
              disabled={busy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-[12px] border border-[#e5e7eb] bg-white px-4 py-3 text-sm font-semibold text-[#1a1a2e] transition-colors hover:bg-[#f8f7ff] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {googleIcon}
              Continue with Google
            </button>

            <button
              type="button"
              onClick={onForgot}
              disabled={busy}
              className="w-full text-center text-xs font-medium text-[#6b7280] hover:text-[#1a1a2e]"
            >
              Forgot password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
