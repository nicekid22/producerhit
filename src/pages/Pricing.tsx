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
  runCreditPackCheckout,
  type PaidPlan,
  type PlanTier,
} from "@/lib/billing";
import type { CreditPackId } from "@/lib/creditPacks";
import { PricingPlanButton } from "@/components/pricing/PricingPlanButton";
import { discordCommunityUrl } from "@/lib/discordConfig";
import { trackClientEvent } from "@/lib/supabaseClient";
import { markCheckoutAbandoned, syncCheckoutAbandonNurture } from "@/lib/checkoutRecovery";
import { CheckoutRecoveryBanner } from "@/components/billing/CheckoutRecoveryBanner";
import { FreeUpgradeStrip } from "@/components/billing/FreeUpgradeStrip";
import { EmailCaptureSection } from "@/components/growth/EmailCaptureSection";
import { PLAN_BILLING_CURRENCY } from "@/lib/planPricing";
import {
  getPricingCompareRows,
  getPricingFaqs,
  getPricingPlans,
  type PricingCompareCell,
} from "@/lib/pricingContent";
import { croPricingHero } from "@/lib/croTrustCopy";
import { buildPricingPageSection, pricingTrustPoints } from "@/i18n/pricingCatalog";
import { LaunchOfferBanner } from "@/components/marketing/LaunchOfferBanner";
import { CreditPackSection } from "@/components/pricing/CreditPackSection";
import { BillingIntervalToggle } from "@/components/pricing/BillingIntervalToggle";
import { LaunchPriceDisplay } from "@/components/marketing/LaunchPriceDisplay";
import {
  annualMonthlyEquivalentUsd,
  billingIntervalCopy,
  planDisplayPrice,
  type BillingInterval,
} from "@/lib/billingInterval";
import { MusicMoneyPlaybookSection } from "@/components/marketing/MusicMoneyPlaybookSection";
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
  const px = useMemo(() => buildPricingPageSection(locale), [locale]);
  const currentPlan = normalizePlan(profile?.plan);
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState<number | null>(0);
  const [loading, setLoading] = useState<PaidPlan | null>(null);
  const [autoStarted, setAutoStarted] = useState(false);
  const [packAutoStarted, setPackAutoStarted] = useState(false);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("month");
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
        await runCheckoutWithAuth({ plan: paid, location: "pricing", locale, billingInterval });
      } finally {
        setLoading(null);
      }
    },
    [billingInterval, currentPlan, locale, user],
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
    if (packAutoStarted) return;
    if (!user) return;
    if (loading !== null) return;
    const pack = searchParams.get("pack");
    if (pack !== "credit_pack_50") return;
    setPackAutoStarted(true);
    setSearchParams({}, { replace: true });
    void runCreditPackCheckout({ product: pack as CreditPackId, location: "pricing_auto_pack", locale });
  }, [locale, packAutoStarted, searchParams, setSearchParams, user, userId]);

  useEffect(() => {
    if (didRefreshProfileRef.current || !userId) return;
    didRefreshProfileRef.current = true;
    if (!profile) void refreshProfile();
  }, [profile, refreshProfile, userId]);

  const trustPoints = useMemo(() => pricingTrustPoints(locale), [locale]);
  const pricingHero = useMemo(() => croPricingHero(locale), [locale]);
  const intervalCopy = useMemo(() => billingIntervalCopy(locale), [locale]);

  useEffect(() => {
    if (searchParams.get("checkout") !== "cancelled") return;
    const planHint = searchParams.get("plan");
    if (planHint === "pro" || planHint === "studio" || planHint === "plus") {
      markCheckoutAbandoned(planHint, "stripe_cancel_url");
      syncCheckoutAbandonNurture(planHint, locale, "stripe_cancel_url");
      trackClientEvent("checkout_abandoned", { plan: planHint, source: "stripe_cancel_url" });
    }
    const productHint = searchParams.get("product");
    if (productHint === "credit_pack_50") {
      markCheckoutAbandoned(productHint, "stripe_cancel_url");
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
                  {px.yourPlan}
                </div>
                <div className="mt-1 text-lg font-bold text-white">{currentPlan.toUpperCase()}</div>
                <div className="mt-1 tabular-nums text-white/55">
                  {profile.loops_used_this_month ?? 0} / {getPlanBaseLimit(currentPlan)}{" "}
                  {px.genThisMonth}
                </div>
              </div>
            ) : null}
          </div>
        </header>

        <LaunchOfferBanner locale={locale} className="mt-6" />

        <BillingIntervalToggle
          locale={locale}
          value={billingInterval}
          onChange={setBillingInterval}
          className="mt-6"
        />

        <CheckoutRecoveryBanner
          locale={locale}
          location="pricing_abandoned"
          currentPlan={currentPlan}
          className="mt-6"
        />

        {user && currentPlan === "free" ? (
          <FreeUpgradeStrip locale={locale} location="pricing_strip" plan={currentPlan} className="mt-4" />
        ) : null}

        {/* Plan cards */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:items-stretch">
          {plans.map((p) => {
            const isPro = p.tier === "pro";
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
                      {px.recommended}
                    </div>
                  ) : null}
                  {isCurrent ? (
                    <div className="pk-pricing-tier__active absolute right-0 top-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                      {px.active}
                    </div>
                  ) : null}
                </div>

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold tracking-tight text-white">{p.name}</h2>
                    <p className="mt-1 text-xs leading-snug text-white/48">{p.tagline}</p>
                  </div>
                </div>

                <div className="mt-5">
                  {isPro && billingInterval === "month" ? (
                    <LaunchPriceDisplay tier="pro" locale={locale} size="lg" variant="card" />
                  ) : p.tier !== "free" ? (
                    <div>
                      <div className="flex items-end gap-1.5">
                        <span className="pk-pricing-tier__price text-[2rem] font-bold leading-none tracking-tight text-white sm:text-[2.15rem]">
                          {planDisplayPrice(p.tier, billingInterval)}
                        </span>
                        <span className="pb-1 text-xs font-medium text-white/40">
                          /{billingInterval === "year" ? intervalCopy.perYear : intervalCopy.perMonth} · {PLAN_BILLING_CURRENCY}
                        </span>
                      </div>
                      {billingInterval === "year" ? (
                        <p className="mt-1.5 text-[11px] text-white/45">
                          ≈ {annualMonthlyEquivalentUsd(p.tier)}/{intervalCopy.perMonth} · {intervalCopy.billedAnnually}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex items-end gap-1.5">
                      <span className="pk-pricing-tier__price text-[2rem] font-bold leading-none tracking-tight text-white sm:text-[2.15rem]">
                        {p.price}
                      </span>
                    </div>
                  )}
                </div>

                <ul className="pk-pricing-tier__features mt-6 flex-1 space-y-3 border-t border-white/[0.07] pt-5">
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

        <section className="mt-14">
          <MusicMoneyPlaybookSection locale={locale} />
        </section>

        {currentPlan !== "free" ? (
          <p className="mt-8 text-center text-sm text-white/45">
            {px.activeSub}
            <Link to="/settings" className="font-semibold text-[var(--prism-cyan)] hover:text-white">
              {px.manageSettings}
            </Link>
          </p>
        ) : null}

        {/* Comparison table */}
        <section className="pk-pricing-compare pk-prism-card mt-14 overflow-hidden">
          <div className="border-b border-white/[0.08] px-6 py-5 sm:px-8">
            <h2 className="text-lg font-bold tracking-tight text-white">
              {px.compareTitle}
            </h2>
            <p className="mt-1 text-sm text-white/48">
              {px.compareLead}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="pk-pricing-compare__table w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/[0.07] text-[11px] font-semibold uppercase tracking-[0.14em] text-white/42">
                  <th className="px-6 py-4 sm:px-8">{px.featureCol}</th>
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
          <CreditPackSection locale={locale} location="pricing_page" />
        </section>

        <section className="mt-12">
          <EmailCaptureSection locale={locale} source="pricing_page" compact />
        </section>

        <footer className="mt-14 border-t border-white/10 pt-8 text-sm text-white/45">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link to="/legal#privacy" className="transition-colors hover:text-white">
              {px.privacy}
            </Link>
            <Link to="/legal#cookies" className="transition-colors hover:text-white">
              Cookies
            </Link>
            <Link to="/legal#terms" className="transition-colors hover:text-white">
              {px.terms}
            </Link>
            <Link to="/commercial-license" className="transition-colors hover:text-white">
              {px.licensePdf}
            </Link>
            <Link to="/legal#commercial-license" className="transition-colors hover:text-white">
              {px.commercialLicense}
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
              {px.paymentsRefunds}
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
