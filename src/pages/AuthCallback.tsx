import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { isFreshOAuthSignup, resolvePostAuthRedirect } from "@/lib/authRoutes";
import { resolveAuthCallbackSession } from "@/lib/authSession";
import { getAttributionProps } from "@/lib/attribution";
import { supabase, trackClientEvent } from "@/lib/supabaseClient";
import { mapAuthError } from "@/lib/authProviders";
import { useAuthStore } from "@/stores/authStore";
import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { PkIconLoader } from "@/components/ui/PkIconLoader";
import { useLocaleStore } from "@/stores/localeStore";
import { markJustAuthenticated, sanitizePostAuthPath } from "@/lib/postAuthRedirect";
import toast from "react-hot-toast";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const locale = useLocaleStore((s) => s.locale);
  const isFr = locale === "fr";
  const [error, setError] = useState<string | null>(null);

  const callbackSearch = params.toString();
  const handledRef = useRef(false);

  const nextPath = useMemo(() => {
    const next = params.get("next");
    const explicit = next && next.startsWith("/") ? sanitizePostAuthPath(next) : "/dashboard";
    return resolvePostAuthRedirect(explicit);
  }, [params]);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    let mounted = true;

    void (async () => {
      const oauthErr =
        params.get("error_description") || params.get("error") || null;
      if (oauthErr) {
        if (!mounted) return;
        const message = mapAuthError(new Error(decodeURIComponent(oauthErr.replace(/\+/g, " "))), locale, "google");
        setError(message);
        toast.error(message, { id: "auth-callback-error" });
        window.setTimeout(() => navigate("/auth?mode=login", { replace: true, state: { authError: message } }), 1800);
        return;
      }

      try {
        const session = await resolveAuthCallbackSession(params);
        if (!mounted) return;
        if (isFreshOAuthSignup(session.user)) {
          trackClientEvent("signup_completed", { method: "google", ...getAttributionProps() });
          try {
            window.localStorage.setItem("producerhit_dashboard_welcome_v1", "1");
          } catch {
            void 0;
          }
        }
        markJustAuthenticated();
        navigate(nextPath, { replace: true });
        void useAuthStore.getState().completeAuthCallbackSession(session);
      } catch (err) {
        if (!mounted) return;
        const { data: recoveredSession } = await supabase.auth.getSession();
        if (recoveredSession.session?.user) {
          if (isFreshOAuthSignup(recoveredSession.session.user)) {
            trackClientEvent("signup_completed", { method: "google", ...getAttributionProps() });
          }
          markJustAuthenticated();
          navigate(nextPath, { replace: true });
          void useAuthStore.getState().completeAuthCallbackSession(recoveredSession.session);
          return;
        }
        const message = mapAuthError(err, locale, "google");
        setError(message);
        toast.error(message, { id: "auth-callback-error" });
        window.setTimeout(() => navigate("/auth?mode=login", { replace: true, state: { authError: message } }), 1800);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [callbackSearch, locale, navigate, nextPath, params]);

  return (
    <MarketingPageShell className="grid min-h-[100dvh] place-items-center px-6">
      <PkIconLoader
        icon="generator"
        size="md"
        label={error ?? (isFr ? "Connexion en cours…" : "Signing you in…")}
        sublabel={error ? (isFr ? "Redirection…" : "Redirecting…") : isFr ? "Redirection vers le studio" : "Redirecting to your studio"}
      />
    </MarketingPageShell>
  );
}
