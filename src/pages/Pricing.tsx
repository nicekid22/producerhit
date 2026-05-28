import { Link, useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, CreditCard, Crown, Loader2, Shield, Sparkles, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { Navbar } from "@/components/Navbar";
import { useAuthStore } from "@/stores/authStore";
import { useLocaleStore } from "@/stores/localeStore";
import { PLAN_LIMITS, getPlanBaseLimit } from "@/lib/planLimits";
import {
  isRecommendedPlan,
  normalizePlan,
  openBillingPortal,
  pricingCtaMeta,
  runCheckoutWithAuth,
  type PaidPlan,
  type PlanTier,
  type PricingCtaMeta,
} from "@/lib/billing";

type PlanCard = {
  tier: PlanTier;
  name: string;
  price: string;
  meta: string;
  bullets: string[];
};

function PricingPlanCtaIcon({ tier, kind }: { tier: PlanTier; kind: PricingCtaMeta["kind"] }) {
  if (kind !== "upgrade" && kind !== "downgrade") return null;
  if (kind === "downgrade") return <CreditCard className="h-4 w-4 shrink-0 opacity-90" aria-hidden />;
  if (tier === "plus") return <Crown className="h-4 w-4 shrink-0 opacity-95" aria-hidden />;
  if (tier === "studio") return <Sparkles className="h-4 w-4 shrink-0 opacity-95" aria-hidden />;
  return <Zap className="h-4 w-4 shrink-0 opacity-95" aria-hidden />;
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
  const [loading, setLoading] = useState<PaidPlan | "portal" | null>(null);
  const [autoStarted, setAutoStarted] = useState(false);
  const didRefreshProfileRef = useRef(false);
  const userId = user?.id;

  const plans = useMemo((): PlanCard[] => {
    if (isFr) {
      return [
        {
          tier: "free",
          name: "Free",
          price: "0€",
          meta: `${PLAN_LIMITS.free} générations / mois`,
          bullets: [
            `${PLAN_LIMITS.free} générations Song + Beat`,
            "Export MP3 royalty-free",
            "Bibliothèque cloud + player",
            "Preview mastering (après 4 gen)",
          ],
        },
        {
          tier: "pro",
          name: "Pro",
          price: "10€",
          meta: "75 générations / mois",
          bullets: [
            "75 générations / mois",
            "Export WAV + MP3 Spotify Ready",
            "Mastering complet",
            "Usage commercial royalty-free",
          ],
        },
        {
          tier: "studio",
          name: "Studio",
          price: "30€",
          meta: "250 générations / mois",
          bullets: [
            "250 générations / mois",
            "Tout Pro inclus",
            "Remix/Cover + seed",
            "Marge max pour releases & clients",
          ],
        },
        {
          tier: "plus",
          name: "Plus",
          price: "89€",
          meta: `${PLAN_LIMITS.plus} générations / mois`,
          bullets: [
            `${PLAN_LIMITS.plus} générations / mois`,
            "Génération prioritaire (file rapide)",
            "Export stems séparés ZIP",
            "Tout Studio + sans watermark share",
          ],
        },
      ];
    }
    return [
      {
        tier: "free",
        name: "Free",
        price: "$0",
        meta: `${PLAN_LIMITS.free} generations / month`,
        bullets: [
          `${PLAN_LIMITS.free} Song + Beat generations`,
          "Royalty-free MP3 export",
          "Cloud library + player",
          "Mastering preview (after 4 gens)",
        ],
      },
      {
        tier: "pro",
        name: "Pro",
        price: "$10",
        meta: "75 generations / month",
        bullets: [
          "75 generations / month",
          "WAV + MP3 Spotify Ready export",
          "Full mastering",
          "Royalty-free commercial use",
        ],
      },
      {
        tier: "studio",
        name: "Studio",
        price: "$30",
        meta: "250 generations / month",
        bullets: [
          "250 generations / month",
          "Everything in Pro",
          "Remix ACE + seed iterations",
          "Maximum headroom for releases",
        ],
      },
      {
        tier: "plus",
        name: "Plus",
        price: "$89",
        meta: `${PLAN_LIMITS.plus} generations / month`,
        bullets: [
          `${PLAN_LIMITS.plus} generations / month`,
          "Priority queue (faster generation)",
          "Separate stems ZIP export (ACE)",
          "Everything in Studio + no share watermark",
        ],
      },
    ];
  }, [isFr]);

  const faqs = useMemo(
    () => [
      {
        q: isFr ? "Quand mes crédits sont-ils activés ?" : "When are my credits activated?",
        a: isFr
          ? `Immédiatement après paiement Stripe. Ton plan et tes limites (75, 250 ou ${PLAN_LIMITS.plus} gen/mois) se mettent à jour en quelques secondes.`
          : `Right after Stripe payment. Your plan and limits (75, 250, or ${PLAN_LIMITS.plus} gen/month) update within seconds.`,
      },
      {
        q: isFr ? "Je peux changer de plan ?" : "Can I switch plans?",
        a: isFr
          ? "Upgrade instantané avec proration (Pro → Studio → Plus). Downgrade via le portail Stripe (Settings)."
          : "Instant upgrade with proration (Pro → Studio → Plus). Downgrade via Stripe billing portal (Settings).",
      },
      {
        q: isFr ? "Stripe est actif ?" : "Is Stripe active?",
        a: isFr
          ? "Oui. Checkout sécurisé + portail pour gérer ou annuler ton abonnement."
          : "Yes. Secure checkout + portal to manage or cancel your subscription.",
      },
      {
        q: isFr ? "Je peux exporter les stems ?" : "Can I export stems?",
        a: isFr
          ? "Oui sur le plan Plus : archive ZIP des pistes séparées (vocals, drums, etc.) quand ACE les fournit — bouton Stems sur ta bibliothèque."
          : "Yes on the Plus plan: separate stems ZIP (vocals, drums, etc.) when ACE provides them — Stems button in your library.",
      },
      {
        q: isFr ? "C’est quoi la priorité Plus ?" : "What is Plus priority?",
        a: isFr
          ? "Plus passe en tête de file côté génération (rate limits plus élevés) pour des sessions plus fluides quand tu enchaînes beaucoup de takes."
          : "Plus gets priority in the generation queue (higher rate limits) for smoother sessions when you chain many takes.",
      },
    ],
    [isFr],
  );

  const openPortal = useCallback(async () => {
    setLoading("portal");
    try {
      await openBillingPortal(`${window.location.origin}/pricing`, locale);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : isFr ? "Portail indisponible" : "Portal unavailable");
    } finally {
      setLoading(null);
    }
  }, [isFr, locale]);

  const handlePlanAction = useCallback(
    async (tier: PlanTier) => {
      const meta = pricingCtaMeta(tier, currentPlan, locale, { isLoggedIn: !!user });

      if (meta.disabled) return;

      if (meta.kind === "start_free") {
        window.location.href = user ? "/dashboard" : "/auth";
        return;
      }

      if (meta.kind === "downgrade") {
        if (!user) {
          window.location.href = "/auth";
          return;
        }
        await openPortal();
        return;
      }

      const paid = tier as PaidPlan;
      setLoading(paid);
      try {
        await runCheckoutWithAuth({ plan: paid, location: "pricing", locale });
      } finally {
        setLoading(null);
      }
    },
    [currentPlan, isFr, locale, openPortal, user],
  );

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
    ? ["Paiement Stripe sécurisé", "Annulation à tout moment", "Crédits activés instantanément"]
    : ["Secure Stripe checkout", "Cancel anytime", "Credits activated instantly"];

  return (
    <div className="min-h-screen bg-pk-bg text-pk-text">
      <Navbar variant="marketing" />

      <main className="mx-auto max-w-6xl px-4 py-14">
        <div className="rounded-2xl border border-pk-border bg-pk-panel/70 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{isFr ? "Tarifs" : "Pricing"}</h1>
              <p className="mt-2 max-w-xl text-sm text-pk-muted">
                {isFr
                  ? "Commence gratuit. Upgrade quand tu veux — crédits et exports débloqués immédiatement."
                  : "Start free. Upgrade anytime — credits and exports unlock instantly."}
              </p>
            </div>
            {user && profile ? (
              <div className="rounded-2xl border border-[#7c3aed]/30 bg-[#7c3aed]/10 px-4 py-3 text-sm">
                <div className="font-semibold text-[#a78bfa]">
                  {isFr ? "Plan actuel" : "Current plan"} · {currentPlan.toUpperCase()}
                </div>
                <div className="mt-1 text-pk-muted">
                  {profile.loops_used_this_month ?? 0} / {getPlanBaseLimit(currentPlan)}{" "}
                  {isFr ? "utilisées ce mois" : "used this month"}
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {trustPoints.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 rounded-full border border-pk-border bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-pk-muted"
              >
                <Shield className="h-3.5 w-3.5 text-pk-accent" />
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:items-stretch">
          {plans.map((p) => {
            const isCurrent = p.tier === currentPlan;
            const recommended = isRecommendedPlan(p.tier, currentPlan);
            const cta = pricingCtaMeta(p.tier, currentPlan, locale, { isLoggedIn: !!user });
            const busy = loading === p.tier || (loading === "portal" && cta.kind === "downgrade");

            return (
              <div
                key={p.tier}
                className={[
                  "relative flex h-full min-h-[420px] flex-col rounded-2xl border bg-pk-panel/65 p-6 backdrop-blur-xl",
                  recommended ? "border-[#7c3aed]/50 bg-pk-panel/75 shadow-[0_0_90px_rgba(124,58,237,0.18)]" : "border-pk-border",
                  isCurrent ? "ring-1 ring-[#7c3aed]/40" : "",
                ].join(" ")}
              >
                {isCurrent ? (
                  <div className="absolute -top-3 left-4 rounded-full bg-[#7c3aed] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    {isFr ? "Actif" : "Active"}
                  </div>
                ) : null}

                <div className="flex min-h-7 items-center justify-between gap-2">
                  <div className="text-sm font-semibold">{p.name}</div>
                  {recommended ? (
                    <div className="shrink-0 rounded-full border border-[#7c3aed]/30 bg-[#7c3aed]/10 px-2 py-1 text-[11px] font-semibold leading-none text-[#a78bfa]">
                      {isFr ? "Populaire" : "Popular"}
                    </div>
                  ) : (
                    <span className="h-6 w-6 shrink-0" aria-hidden />
                  )}
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-semibold leading-none tracking-tight">{p.price}</span>
                  <span className="text-sm text-pk-muted">/mo</span>
                </div>
                <div className="mt-2 text-sm font-medium leading-snug text-pk-muted">{p.meta}</div>

                <ul className="mt-5 flex-1 space-y-2.5 text-sm leading-snug text-pk-muted">
                  {p.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-pk-accent" />
                      <span className="min-w-0 flex-1">{b}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-5">
                  <button
                    type="button"
                    onClick={() => void handlePlanAction(p.tier)}
                    disabled={loading !== null || cta.disabled}
                    className={[
                      "flex h-11 w-full items-center justify-center rounded-full px-5 text-sm font-semibold leading-none transition-all disabled:cursor-not-allowed disabled:opacity-60",
                      cta.isPrimary
                        ? "bg-gradient-to-r from-[#7c3aed] to-[#22d3ee] text-white shadow-[0_0_80px_rgba(124,58,237,0.18)] hover:brightness-110"
                        : "border border-pk-border bg-white/5 text-pk-text hover:bg-white/10",
                    ].join(" ")}
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <span className="inline-flex max-w-full items-center justify-center gap-2">
                        <PricingPlanCtaIcon tier={p.tier} kind={cta.kind} />
                        <span className="truncate text-center">{cta.label}</span>
                      </span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {currentPlan !== "free" ? (
          <div className="mt-6 text-center">
            <button
              type="button"
              disabled={loading !== null}
              onClick={() => void openPortal()}
              className="text-sm font-semibold text-pk-accent hover:underline disabled:opacity-50"
            >
              {isFr ? "Gérer ou annuler via le portail Stripe →" : "Manage or cancel via Stripe portal →"}
            </button>
          </div>
        ) : null}

        <section className="mt-14">
          <h2 className="text-xl font-semibold">FAQ</h2>
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
              Cookies
            </Link>
            <Link to="/legal#terms" className="hover:text-pk-text">
              {isFr ? "Conditions" : "Terms"}
            </Link>
            <Link to="/legal#refunds" className="hover:text-pk-text">
              {isFr ? "Paiements & remboursements" : "Payments & Refunds"}
            </Link>
            <Link to="/legal#contact" className="hover:text-pk-text">
              Support
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
