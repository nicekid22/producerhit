import { Link, useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Minus, Shield, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { Navbar } from "@/components/Navbar";
import { useAuthStore } from "@/stores/authStore";
import { useLocaleStore } from "@/stores/localeStore";
import { getPlanBaseLimit } from "@/lib/planLimits";
import {
  isRecommendedPlan,
  normalizePlan,
  pricingCtaMeta,
  runCheckoutWithAuth,
  type PaidPlan,
  type PlanTier,
} from "@/lib/billing";
import { PricingPlanButton } from "@/components/pricing/PricingPlanButton";
import { discordCommunityUrl } from "@/lib/discordConfig";
import { trackClientEvent } from "@/lib/supabaseClient";
import { readCheckoutAbandoned, clearCheckoutAbandoned } from "@/lib/checkoutRecovery";
import { EmailCaptureSection } from "@/components/growth/EmailCaptureSection";
import { PLAN_BILLING_CURRENCY } from "@/lib/planPricing";
import {
  getPricingCompareRows,
  getPricingFaqs,
  getPricingPlans,
  type PricingCompareCell,
} from "@/lib/pricingContent";
import { croPricingHero } from "@/lib/croTrustCopy";
import { cn } from "@/lib/utils";

function CompareCell({ value }: { value: PricingCompareCell }) {
  if (value === true) {
    return (
      <span className="pk-pricing-compare__yes inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/10">
        <Check className="h-3.5 w-3.5 text-emerald-300" aria-hidden />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="pk-pricing-compare__no inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.04]">
        <Minus className="h-3.5 w-3.5 text-white/25" aria-hidden />
      </span>
    );
  }
  return <span className="text-xs font-semibold tabular-nums text-white/72">{value}</span>;
}

export default function Pricing() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const locale = useLocaleStore((s) => s.locale);
  const isFr = locale === "fr";
  const currentPlan = normalizePlan(profile?.plan);
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState<number | null>(0);
  const [loading, setLoading] = useState<PaidPlan | null>(null);
  const [autoStarted, setAutoStarted] = useState(false);
  const didRefreshProfileRef = useRef(false);
  const userId = user?.id;

  const plans = useMemo(() => getPricingPlans(locale), [locale]);
  const compareRows = useMemo(() => getPricingCompareRows(locale), [locale]);
  const faqs = useMemo(() => getPricingFaqs(locale), [locale]);

  const handlePlanAction = useCallback(
    async (tier: PlanTier) => {
      const meta = pricingCtaMeta(tier, currentPlan, locale, { isLoggedIn: !!user });
      if (meta.disabled || meta.kind !== "upgrade") {
        if (meta.kind === "start_free") {
          window.location.href = user ? "/dashboard" : "/auth";
        }
        return;
      }

      trackClientEvent("pricing_cta_click", { tier, kind: meta.kind, current_plan: currentPlan });

      const paid = tier as PaidPlan;
      setLoading(paid);
      try {
        await runCheckoutWithAuth({ plan: paid, location: "pricing", locale });
      } finally {
        setLoading(null);
      }
    },
    [currentPlan, locale, user],
  );

  useEffect(() => {
    trackClientEvent("pricing_page_view", {
      plan_hint: searchParams.get("plan") ?? null,
      logged_in: !!user,
    });
  }, [searchParams, user]);

  useEffect(() => {
    if (autoStarted) return;
    if (!user) return;
    if (loading !== null) return;

    const plan = searchParams.get("plan");
    const auto = searchParams.get("checkout");
    const shouldAuto = auto === "1" && (plan === "pro" || plan === "studio" || plan === "plus");
    if (!shouldAuto) return;

    setAutoStarted(true);
    setSearchParams({}, { replace: true });
    void handlePlanAction(plan);
  }, [autoStarted, handlePlanAction, loading, searchParams, setSearchParams, userId]);

  useEffect(() => {
    if (didRefreshProfileRef.current || !userId) return;
    didRefreshProfileRef.current = true;
    if (!profile) void refreshProfile();
  }, [profile, refreshProfile, userId]);

  const trustPoints = isFr
    ? ["Paiement Stripe sécurisé", "Facturation USD", "Annulation à tout moment", "Activation instantanée"]
    : ["Secure Stripe checkout", "USD billing", "Cancel anytime", "Instant activation"];
  const pricingHero = useMemo(() => croPricingHero(locale), [locale]);
  const abandonedCheckout = useMemo(() => readCheckoutAbandoned(), []);

  useEffect(() => {
    if (searchParams.get("checkout") !== "cancelled") return;
    const planHint = searchParams.get("plan");
    if (planHint === "pro" || planHint === "studio" || planHint === "plus") {
      trackClientEvent("checkout_abandoned", { plan: planHint, source: "stripe_cancel_url" });
    }
  }, [searchParams]);

  const resumeAbandonedCheckout = useCallback(async () => {
    const abandoned = readCheckoutAbandoned();
    const tier = (abandoned?.plan ?? searchParams.get("plan")) as PaidPlan | null;
    if (tier !== "pro" && tier !== "studio" && tier !== "plus") return;
    trackClientEvent("checkout_resume_click", { plan: tier });
    setLoading(tier);
    try {
      await runCheckoutWithAuth({ plan: tier, location: "checkout_recovery", locale });
    } finally {
      setLoading(null);
    }
  }, [locale, searchParams]);

  return (
    <MarketingPageShell contentClassName="pk-pricing-page">
      <Navbar variant="marketing" />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pt-14">
        {/* Hero */}
        <header className="pk-pricing-hero pk-prism-card relative overflow-hidden px-6 py-8 sm:px-10 sm:py-10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_12%_0%,rgba(157,124,255,0.14),transparent_52%),radial-gradient(ellipse_at_88%_100%,rgba(103,195,255,0.1),transparent_48%)]"
          />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="pk-pricing-hero__eyebrow text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--prism-cyan)]">
                {pricingHero.eyebrow}
              </p>
              <h1 className="mt-3 text-balance text-[clamp(1.85rem,4.2vw,2.65rem)] font-bold leading-[1.08] tracking-tight">
                <span className="pk-prism-holo-text">{pricingHero.title}</span>
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/58 sm:text-[15px]">
                {pricingHero.lead}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {trustPoints.map((t) => (
                  <span key={t} className="pk-pricing-trust-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold">
                    <Shield className="h-3.5 w-3.5 shrink-0 text-[var(--prism-cyan)]" aria-hidden />
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {user && profile ? (
              <div className="pk-pricing-current shrink-0 rounded-2xl border px-5 py-4 text-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
                  {isFr ? "Ton plan" : "Your plan"}
                </div>
                <div className="mt-1 text-lg font-bold text-white">{currentPlan.toUpperCase()}</div>
                <div className="mt-1 tabular-nums text-white/55">
                  {profile.loops_used_this_month ?? 0} / {getPlanBaseLimit(currentPlan)}{" "}
                  {isFr ? "gen ce mois" : "gen this month"}
                </div>
              </div>
            ) : null}
          </div>
        </header>

        {abandonedCheckout &&
        (abandonedCheckout.plan === "pro" ||
          abandonedCheckout.plan === "studio" ||
          abandonedCheckout.plan === "plus") ? (
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-violet-400/30 bg-violet-500/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-white">
                {isFr ? "Tu étais à un clic du plan" : "You were one click away"}{" "}
                {abandonedCheckout.plan.charAt(0).toUpperCase() + abandonedCheckout.plan.slice(1)}
              </p>
              <p className="mt-1 text-xs text-white/60">
                {isFr ? "Reprends le paiement Stripe — activation instantanée." : "Resume Stripe checkout — instant activation."}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void resumeAbandonedCheckout()}
                className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
              >
                {isFr ? "Reprendre" : "Resume"}
              </button>
              <button
                type="button"
                onClick={() => clearCheckoutAbandoned()}
                className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/70 hover:bg-white/5"
              >
                {isFr ? "Fermer" : "Dismiss"}
              </button>
            </div>
          </div>
        ) : null}

        {/* Plan cards */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:items-stretch">
          {plans.map((p) => {
            const isCurrent = p.tier === currentPlan;
            const recommended = isRecommendedPlan(p.tier, currentPlan);
            const cta = pricingCtaMeta(p.tier, currentPlan, locale, { isLoggedIn: !!user });
            const busy = loading === p.tier;

            return (
              <article
                key={p.tier}
                className={cn(
                  "pk-pricing-card pk-pricing-tier relative flex h-full flex-col rounded-[1.35rem] border p-6 sm:p-7",
                  recommended && "pk-pricing-card--popular pk-pricing-tier--featured",
                  isCurrent && "pk-pricing-tier--current",
                )}
              >
                <div className="pk-pricing-tier__ribbon relative mb-1 min-h-[1.625rem] shrink-0 w-full">
                  {recommended ? (
                    <div className="pk-pricing-tier__badge absolute left-1/2 top-0 flex -translate-x-1/2 items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em]">
                      <Sparkles className="h-3 w-3" aria-hidden />
                      {isFr ? "Recommandé" : "Recommended"}
                    </div>
                  ) : null}
                  {isCurrent ? (
                    <div className="pk-pricing-tier__active absolute right-0 top-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                      {isFr ? "Actif" : "Active"}
                    </div>
                  ) : null}
                </div>

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold tracking-tight text-white">{p.name}</h2>
                    <p className="mt-1 text-xs leading-snug text-white/48">{p.tagline}</p>
                  </div>
                </div>

                <div className="mt-5 flex items-end gap-1.5">
                  <span className="pk-pricing-tier__price text-[2rem] font-bold leading-none tracking-tight text-white sm:text-[2.15rem]">
                    {p.price}
                  </span>
                  {p.tier !== "free" ? (
                    <span className="pb-1 text-xs font-medium text-white/40">
                      /{isFr ? "mois" : "mo"} · {PLAN_BILLING_CURRENCY}
                    </span>
                  ) : null}
                </div>

                <ul className="mt-6 flex-1 space-y-3 border-t border-white/[0.07] pt-5">
                  {p.highlights.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-[13px] leading-snug text-white/62">
                      <Check className="pk-pricing-tier__check mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 pt-1">
                  <PricingPlanButton
                    tier={p.tier}
                    cta={cta}
                    busy={busy}
                    disabled={loading !== null}
                    onClick={() => void handlePlanAction(p.tier)}
                  />
                </div>
              </article>
            );
          })}
        </div>

        {currentPlan !== "free" ? (
          <p className="mt-8 text-center text-sm text-white/45">
            {isFr ? "Abonnement actif — " : "Active subscription — "}
            <Link to="/settings" className="font-semibold text-[var(--prism-cyan)] hover:text-white">
              {isFr ? "gérer dans Paramètres" : "manage in Settings"}
            </Link>
          </p>
        ) : null}

        {/* Comparison table */}
        <section className="pk-pricing-compare pk-prism-card mt-14 overflow-hidden">
          <div className="border-b border-white/[0.08] px-6 py-5 sm:px-8">
            <h2 className="text-lg font-bold tracking-tight text-white">
              {isFr ? "Comparatif détaillé" : "Full comparison"}
            </h2>
            <p className="mt-1 text-sm text-white/48">
              {isFr ? "Tout ce qui différencie chaque plan, en un coup d'œil." : "Everything that sets each plan apart, at a glance."}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="pk-pricing-compare__table w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/[0.07] text-[11px] font-semibold uppercase tracking-[0.14em] text-white/42">
                  <th className="px-6 py-4 sm:px-8">{isFr ? "Fonctionnalité" : "Feature"}</th>
                  <th className="px-3 py-4 text-center">Free</th>
                  <th className="px-3 py-4 text-center">Pro</th>
                  <th className="px-3 py-4 text-center">Studio</th>
                  <th className="px-3 py-4 text-center sm:pr-8">Plus</th>
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row) => (
                  <tr key={row.label} className="border-b border-white/[0.05] last:border-0">
                    <th scope="row" className="px-6 py-3.5 text-sm font-medium text-white/78 sm:px-8">
                      {row.label}
                    </th>
                    {(["free", "pro", "studio", "plus"] as const).map((tier) => (
                      <td key={tier} className="px-3 py-3.5 text-center sm:pr-8">
                        <CompareCell value={row[tier]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-14">
          <h2 className="text-lg font-bold tracking-tight text-white">FAQ</h2>
          <div className="mt-5 grid gap-2.5">
            {faqs.map((f, i) => {
              const isOpen = open === i;
              return (
                <div key={f.q} className="pk-pricing-faq pk-prism-card overflow-hidden">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
                    aria-expanded={isOpen}
                    onClick={() => setOpen((v) => (v === i ? null : i))}
                  >
                    <span className="text-sm font-semibold text-white">{f.q}</span>
                    <span className="pk-pricing-faq__toggle text-lg leading-none text-[var(--prism-cyan)]" aria-hidden>
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                  {isOpen ? (
                    <div className="border-t border-white/[0.06] px-5 pb-5 pt-4 text-sm leading-relaxed text-white/55 sm:px-6">
                      {f.a}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-12">
          <EmailCaptureSection locale={locale} source="pricing_page" compact />
        </section>

        <footer className="mt-14 border-t border-white/10 pt-8 text-sm text-white/45">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link to="/legal#privacy" className="transition-colors hover:text-white">
              {isFr ? "Confidentialité" : "Privacy"}
            </Link>
            <Link to="/legal#cookies" className="transition-colors hover:text-white">
              Cookies
            </Link>
            <Link to="/legal#terms" className="transition-colors hover:text-white">
              {isFr ? "Conditions" : "Terms"}
            </Link>
            <Link to="/legal#commercial-license" className="transition-colors hover:text-white">
              {isFr ? "Licence commerciale" : "Commercial license"}
            </Link>
            <a
              href={discordCommunityUrl("pricing_footer")}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-white"
            >
              Discord
            </a>
            <Link to="/legal#refunds" className="transition-colors hover:text-white">
              {isFr ? "Paiements & remboursements" : "Payments & Refunds"}
            </Link>
            <Link to="/legal#contact" className="transition-colors hover:text-white">
              Support
            </Link>
            <a className="transition-colors hover:text-white" href="mailto:info.producermarket@gmail.com">
              info.producermarket@gmail.com
            </a>
          </div>
          <div className="mt-4 text-white/35">© 2026 ProducerHit</div>
        </footer>
      </main>
    </MarketingPageShell>
  );
}
