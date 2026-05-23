import { Link, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { supabase, trackClientEvent } from "@/lib/supabaseClient";
import { useAuthStore } from "@/stores/authStore";
import { useLocaleStore } from "@/stores/localeStore";
import { PLAN_LIMITS } from "@/lib/planLimits";

export default function Pricing() {
  const user = useAuthStore((s) => s.user);
  const locale = useLocaleStore((s) => s.locale);
  const isFr = locale === "fr";
  const [searchParams, setSearchParams] = useSearchParams();
  const faqs = useMemo(
    () => [
      {
        q: isFr ? "Stripe est actif ?" : "Is Stripe active?",
        a: isFr ? "Oui. Tu peux upgrader via Stripe (checkout + portail de gestion)." : "Yes. You can upgrade via Stripe (checkout + customer portal).",
      },
      {
        q: isFr ? "Tu génères du vrai audio ?" : "Do you generate real audio?",
        a: isFr ? "Oui. Tu génères de l’audio (songs et beats) directement depuis l’app." : "Yes. You generate audio (songs and beats) directly from the app.",
      },
      {
        q: isFr ? "Je peux exporter les stems ?" : "Can I export stems?",
        a: isFr
          ? "Oui quand disponible sur le track. Pro/Studio permettent de télécharger les stems (archive) quand l’engine les fournit."
          : "Yes when available per track. Pro/Studio can download stems (archive) when the engine provides them.",
      },
      {
        q: isFr ? "La bibliothèque est illimitée ?" : "Is the library unlimited?",
        a: isFr ? "Tu peux sauvegarder tes générations dans ta bibliothèque et les rejouer quand tu veux." : "You can save generations in your library and replay them anytime.",
      },
      {
        q: isFr ? "Il y aura une API ?" : "Is there an API?",
        a: isFr ? "Plus tard. L’objectif est de proposer une API pour les utilisateurs avancés." : "Later. The goal is to offer an API for advanced users.",
      },
    ],
    [isFr],
  );
  const [open, setOpen] = useState<number | null>(0);
  const [loading, setLoading] = useState<"pro" | "studio" | null>(null);
  const [autoStarted, setAutoStarted] = useState(false);

  const extractInvokeError = useCallback((err: unknown): { status?: number; message: string } => {
    const e = err as
      | (Error & { context?: { status?: unknown; body?: unknown } })
      | { message?: unknown; context?: { status?: unknown; body?: unknown }; status?: unknown }
      | null;

    const status =
      (typeof e === "object" && e && typeof (e as { status?: unknown }).status === "number" ? (e as { status: number }).status : undefined) ??
      (typeof e === "object" && e && typeof e.context?.status === "number" ? e.context.status : undefined);

    let message =
      err instanceof Error
        ? err.message
        : typeof (e as { message?: unknown } | null)?.message === "string"
          ? String((e as { message?: unknown }).message)
          : "Could not start checkout — try again";

    const body = typeof e === "object" && e ? e.context?.body : undefined;
    if (typeof body === "string") {
      try {
        const parsed = JSON.parse(body) as { error?: unknown };
        if (typeof parsed?.error === "string") message = parsed.error;
      } catch {
        if (body.trim()) message = body;
      }
    } else if (body && typeof body === "object") {
      const parsed = body as { error?: unknown };
      if (typeof parsed?.error === "string") message = parsed.error;
    }

    return { status, message };
  }, []);

  const handleUpgrade = useCallback(
    async (plan: "pro" | "studio") => {
    setLoading(plan);
    try {
      trackClientEvent("checkout_start", { plan, location: "pricing" });
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          plan,
          successUrl: window.location.origin + "/dashboard?upgraded=true",
          cancelUrl: window.location.origin + "/pricing",
        },
      });
      if (error) throw error;
      const payload = data as { url?: string; mock?: boolean; message?: string } | null;
      if (payload?.mock) {
        toast(payload.message || "Stripe arrive bientôt");
        return;
      }
      const url = payload?.url;
      if (url) window.location.href = url;
      else throw new Error("Missing checkout URL");
    } catch (err) {
      const { status, message } = extractInvokeError(err);
      const lower = message.toLowerCase();
      if (status === 401 || lower.includes("not authenticated") || lower.includes("jwt") || lower.includes("auth")) {
        toast("Connecte-toi pour upgrader");
        window.location.href = "/auth";
        return;
      }
      toast.error(message || "Could not start checkout — try again");
    } finally {
      setLoading(null);
    }
    },
    [extractInvokeError],
  );

  useEffect(() => {
    if (autoStarted) return;
    if (!user) return;
    if (loading !== null) return;

    const plan = searchParams.get("plan");
    const auto = searchParams.get("checkout");
    const shouldAuto = auto === "1" && (plan === "pro" || plan === "studio");
    if (!shouldAuto) return;

    setAutoStarted(true);
    setSearchParams({}, { replace: true });
    void handleUpgrade(plan);
  }, [autoStarted, handleUpgrade, loading, searchParams, setSearchParams, user]);

  return (
    <div className="min-h-screen bg-pk-bg text-pk-text">
      <Navbar variant="marketing" />

      <main className="mx-auto max-w-6xl px-4 py-14">
        <div className="rounded-2xl border border-pk-border bg-pk-panel/70 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <h1 className="text-3xl font-bold tracking-tight">{isFr ? "Tarifs" : "Pricing"}</h1>
          <p className="mt-2 text-sm text-pk-muted">{isFr ? "Commence gratuit. Upgrade quand tu veux." : "Start free. Upgrade anytime."}</p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-pk-border bg-pk-panel/65 p-6 backdrop-blur-xl">
            <div className="text-sm font-semibold">Free</div>
            <div className="mt-3 text-3xl font-semibold">$0</div>
            <ul className="mt-5 space-y-2 text-sm text-pk-muted">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-pk-accent" />{" "}
                {isFr ? `${PLAN_LIMITS.free} générations / mois` : `${PLAN_LIMITS.free} generations / month`}
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-pk-accent" /> {isFr ? "Song + Beat modes" : "Song + beat modes"}
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-pk-accent" /> {isFr ? "Bibliothèque + player" : "Library + player"}
              </li>
            </ul>
            <Link
              to="/auth"
              className="mt-6 inline-flex w-full justify-center rounded-full border border-pk-border bg-white/5 px-4 py-2 text-sm font-semibold text-pk-text hover:bg-white/10"
            >
              {isFr ? "Commencer" : "Get Started"}
            </Link>
          </div>

          <div className="relative rounded-2xl border border-[#7c3aed]/50 bg-pk-panel/75 p-6 shadow-[0_0_90px_rgba(124,58,237,0.18)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Pro</div>
              <div className="rounded-full border border-[#7c3aed]/30 bg-[#7c3aed]/10 px-2 py-1 text-xs font-semibold text-[#a78bfa]">Most Popular</div>
            </div>
            <div className="mt-3 text-3xl font-semibold">$10</div>
            <ul className="mt-5 space-y-2 text-sm text-pk-muted">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-pk-accent" /> {isFr ? "75 générations / mois" : "75 generations / month"}
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-pk-accent" /> {isFr ? "Lyrics IA ou manuel" : "AI writes or manual lyrics"}
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-pk-accent" /> {isFr ? "Styles vocaux" : "Vocal styles"}
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-pk-accent" /> {isFr ? "Variations" : "Variations"}
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-pk-accent" /> {isFr ? "Conçu pour itérer" : "Built for iteration"}
              </li>
            </ul>
            <button
              type="button"
              onClick={() => void handleUpgrade("pro")}
              disabled={loading !== null}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#7c3aed] to-[#22d3ee] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_80px_rgba(124,58,237,0.18)] transition-all hover:brightness-110 disabled:opacity-70"
            >
              {loading === "pro" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isFr ? "Passer Pro" : "Upgrade to Pro"}
            </button>
          </div>

          <div className="rounded-2xl border border-pk-border bg-pk-panel/65 p-6 backdrop-blur-xl">
            <div className="text-sm font-semibold">Studio</div>
            <div className="mt-3 text-3xl font-semibold">$30</div>
            <ul className="mt-5 space-y-2 text-sm text-pk-muted">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-pk-accent" /> {isFr ? "250 générations / mois" : "250 generations / month"}
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-pk-accent" /> {isFr ? "Tout Pro inclus" : "Everything in Pro"}
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-pk-accent" /> {isFr ? "Conçu pour power users" : "Built for power users"}
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-pk-accent" /> {isFr ? "Plus de marge pour itérer" : "More room for iteration"}
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-pk-accent" /> {isFr ? "Limites mensuelles plus hautes" : "Higher monthly limits"}
              </li>
            </ul>
            <button
              type="button"
              onClick={() => void handleUpgrade("studio")}
              disabled={loading !== null}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full border border-pk-border bg-white/5 px-4 py-2 text-sm font-semibold text-pk-text hover:bg-white/10 disabled:opacity-70"
            >
              {loading === "studio" ? <Loader2 className="h-4 w-4 animate-spin text-pk-accent" /> : null}
              {isFr ? "Passer Studio" : "Upgrade to Studio"}
            </button>
          </div>
        </div>

        <section className="mt-14">
          <h2 className="text-xl font-semibold">{isFr ? "FAQ" : "FAQ"}</h2>
          <div className="mt-5 grid gap-3">
            {faqs.map((f, i) => {
              const isOpen = open === i;
              return (
                <div key={f.q} className="rounded-2xl border border-pk-border bg-pk-panel/60 backdrop-blur-xl">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    onClick={() => setOpen((v) => (v === i ? null : i))}
                  >
                    <div className="text-sm font-semibold">{f.q}</div>
                    <div className="text-pk-accent">{isOpen ? "–" : "+"}</div>
                  </button>
                  {isOpen ? <div className="px-5 pb-5 text-sm text-pk-muted">{f.a}</div> : null}
                </div>
              );
            })}
          </div>
        </section>

        <footer className="mt-14 border-t border-pk-border pt-8 text-sm text-pk-muted">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link to="/legal#privacy" className="hover:text-pk-text">
              {isFr ? "Confidentialité" : "Privacy"}
            </Link>
            <Link to="/legal#cookies" className="hover:text-pk-text">
              {isFr ? "Cookies" : "Cookies"}
            </Link>
            <Link to="/legal#terms" className="hover:text-pk-text">
              {isFr ? "Conditions" : "Terms"}
            </Link>
            <Link to="/legal#refunds" className="hover:text-pk-text">
              {isFr ? "Paiements & remboursements" : "Payments & Refunds"}
            </Link>
            <Link to="/legal#contact" className="hover:text-pk-text">
              {isFr ? "Support" : "Support"}
            </Link>
            <a className="hover:text-pk-text" href="mailto:info.producermarket@gmail.com">
              info.producermarket@gmail.com
            </a>
          </div>
          <div className="mt-4">© 2026 ProducerHit</div>
        </footer>
      </main>
    </div>
  );
}
