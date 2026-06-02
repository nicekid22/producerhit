import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resolveAuthCallbackSession } from "@/lib/authSession";
import { mapAuthError } from "@/lib/authProviders";
import { useAuthStore } from "@/stores/authStore";
import { PkIconLoader } from "@/components/ui/PkIconLoader";
import { useLocaleStore } from "@/stores/localeStore";
import toast from "react-hot-toast";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const locale = useLocaleStore((s) => s.locale);
  const isFr = locale === "fr";
  const [error, setError] = useState<string | null>(null);

  const nextPath = useMemo(() => {
    const next = params.get("next");
    if (next && next.startsWith("/")) return next;
    const pending = window.localStorage.getItem("producerhit_pending_prompt");
    if (pending && pending.trim()) {
      window.localStorage.removeItem("producerhit_pending_prompt");
      return `/dashboard?prompt=${encodeURIComponent(pending.trim())}`;
    }
    return "/dashboard";
  }, [params]);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        const session = await resolveAuthCallbackSession(params);
        if (!mounted) return;
        await useAuthStore.getState().completeAuthCallbackSession(session);
        if (!mounted) return;
        navigate(nextPath, { replace: true });
      } catch (err) {
        if (!mounted) return;
        const message = mapAuthError(err, locale, "google");
        setError(message);
        toast.error(message, { id: "auth-callback-error" });
        window.setTimeout(() => navigate("/auth", { replace: true, state: { authError: message } }), 1800);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [locale, navigate, nextPath, params]);

  return (
    <div className="grid min-h-[100dvh] place-items-center bg-pk-bg px-6">
      <PkIconLoader
        icon="generator"
        size="md"
        label={error ?? (isFr ? "Connexion en cours…" : "Signing you in…")}
        sublabel={error ? (isFr ? "Redirection…" : "Redirecting…") : isFr ? "Redirection vers le studio" : "Redirecting to your studio"}
      />
    </div>
  );
}
