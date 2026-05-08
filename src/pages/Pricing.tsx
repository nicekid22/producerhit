import { Link, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/stores/authStore";

export default function Pricing() {
  const user = useAuthStore((s) => s.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const faqs = useMemo(
    () => [
      {
        q: "Is Stripe active?",
        a: "Oui. Tu peux upgrader via Stripe (checkout + portail de gestion).",
      },
      {
        q: "Do you generate real audio?",
        a: "Oui. Tu génères de l’audio (songs et beats) directement depuis l’app.",
      },
      {
        q: "Can I export stems?",
        a: "Pas encore. L’export stems est prévu plus tard.",
      },
      {
        q: "Is the library unlimited?",
        a: "Tu peux sauvegarder tes générations dans ta bibliothèque et les rejouer quand tu veux.",
      },
      {
        q: "Is there an API?",
        a: "Plus tard. L’objectif est de proposer une API pour les utilisateurs avancés.",
      },
    ],
    [],
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
    <div className="min-h-screen bg-[#f8f7ff] text-[#1a1a2e]">
      <Navbar variant="marketing" />

      <main className="mx-auto max-w-6xl px-4 py-14">
        <div className="rounded-[12px] border border-[#e5e7eb] bg-white p-8">
          <h1 className="text-3xl font-bold tracking-tight">Pricing</h1>
          <p className="mt-2 text-sm text-[#6b7280]">Start free. Upgrade anytime.</p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[12px] border border-[#e5e7eb] bg-white p-6">
            <div className="text-sm font-semibold">Free</div>
            <div className="mt-3 text-3xl font-semibold">$0</div>
            <ul className="mt-5 space-y-2 text-sm text-[#6b7280]">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#6d28d9]" /> 3 generations / month
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#6d28d9]" /> Song + beat modes
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#6d28d9]" /> Library + player
              </li>
            </ul>
            <Link
              to="/auth"
              className="mt-6 inline-flex w-full justify-center rounded-[12px] border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-semibold hover:bg-[#f8f7ff]"
            >
              Get Started
            </Link>
          </div>

          <div className="rounded-[12px] border-2 border-[#6d28d9] bg-white p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Pro</div>
              <div className="rounded-full bg-[#6d28d9]/10 px-2 py-1 text-xs font-semibold text-[#6d28d9]">Most Popular</div>
            </div>
            <div className="mt-3 text-3xl font-semibold">$10</div>
            <ul className="mt-5 space-y-2 text-sm text-[#6b7280]">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#6d28d9]" /> 75 generations / month
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#6d28d9]" /> AI writes or manual lyrics
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#6d28d9]" /> Vocal styles
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#6d28d9]" /> Variations
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#6d28d9]" /> Built for iteration
              </li>
            </ul>
            <button
              type="button"
              onClick={() => void handleUpgrade("pro")}
              disabled={loading !== null}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#6d28d9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5b21b6] disabled:opacity-70"
            >
              {loading === "pro" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Upgrade to Pro
            </button>
          </div>

          <div className="rounded-[12px] border border-[#e5e7eb] bg-white p-6">
            <div className="text-sm font-semibold">Studio</div>
            <div className="mt-3 text-3xl font-semibold">$30</div>
            <ul className="mt-5 space-y-2 text-sm text-[#6b7280]">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#6d28d9]" /> 250 generations / month
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#6d28d9]" /> Everything in Pro
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#6d28d9]" /> Built for power users
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#6d28d9]" /> More room for iteration
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#6d28d9]" /> Higher monthly limits
              </li>
            </ul>
            <button
              type="button"
              onClick={() => void handleUpgrade("studio")}
              disabled={loading !== null}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-[12px] border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-semibold hover:bg-[#f8f7ff] disabled:opacity-70"
            >
              {loading === "studio" ? <Loader2 className="h-4 w-4 animate-spin text-[#6d28d9]" /> : null}
              Upgrade to Studio
            </button>
          </div>
        </div>

        <section className="mt-14">
          <h2 className="text-xl font-semibold">FAQ</h2>
          <div className="mt-5 grid gap-3">
            {faqs.map((f, i) => {
              const isOpen = open === i;
              return (
                <div key={f.q} className="rounded-[12px] border border-[#e5e7eb] bg-white">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    onClick={() => setOpen((v) => (v === i ? null : i))}
                  >
                    <div className="text-sm font-semibold">{f.q}</div>
                    <div className="text-[#6d28d9]">{isOpen ? "–" : "+"}</div>
                  </button>
                  {isOpen ? <div className="px-5 pb-5 text-sm text-[#6b7280]">{f.a}</div> : null}
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
