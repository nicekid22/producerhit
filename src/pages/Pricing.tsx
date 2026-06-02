import { Link, useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Shield } from "lucide-react";
import toast from "react-hot-toast";
import { Navbar } from "@/components/Navbar";
import { useAuthStore } from "@/stores/authStore";
import { useLocaleStore } from "@/stores/localeStore";
import { PLAN_LIMITS, getPlanBaseLimit } from "@/lib/planLimits";
import { LOOP_AUDIO_RETENTION_DAYS, plusPermanentAudioBenefit, standardAudioRetentionNote } from "@/lib/loopAudioRetention";
import {
  isRecommendedPlan,
  normalizePlan,
  openBillingPortal,
  pricingCtaMeta,
  runCheckoutWithAuth,
  type PaidPlan,
  type PlanTier,
} from "@/lib/billing";
import { PricingPlanButton } from "@/components/pricing/PricingPlanButton";

type PlanCard = {
  tier: PlanTier;
  name: string;
  price: string;
  meta: string;
  bullets: string[];
};

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
            standardAudioRetentionNote("fr"),
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
            "Export MP3",
            "Mode Song + Type Beat",
            "Mode Remix & Cover",
            
            standardAudioRetentionNote("fr"),
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
            "Mastering Studio complet",
            "Remix & Cover",
            "Export MP3 + WAV",
            "Utilisation commerciale autorisée",
          ],
        },
        {
          tier: "plus",
          name: "Plus",
          price: "89€",
          meta: `${PLAN_LIMITS.plus} générations / mois`,
          bullets: [
            `${PLAN_LIMITS.plus} générations / mois`,
            plusPermanentAudioBenefit("fr"),
            "Génération prioritaire",
            "Export fichiers séparés ZIP",
            "Libre de droits pour un usage commercial.",
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
          standardAudioRetentionNote("en"),
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
          "Song Mode + Type Beat workflows",
          "Auto cover art + watermark-free share",
          "Royalty-free commercial use",
          standardAudioRetentionNote("en"),
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
          "Full Mastering Studio (apply + export)",
          "ACE Remix / Cover + seed iterations",
          "Vertical video export + promo clips",
          "Maximum headroom for releases & clients",
        ],
      },
      {
        tier: "plus",
        name: "Plus",
        price: "$89",
        meta: `${PLAN_LIMITS.plus} generations / month`,
        bullets: [
          `${PLAN_LIMITS.plus} generations / month`,
          plusPermanentAudioBenefit("en"),
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
      {
        q: isFr ? "Les liens audio expirent-ils ?" : "Do hosted audio links expire?",
        a: isFr
          ? `Sur Free, Pro et Studio, l’audio hébergé est conservé ${LOOP_AUDIO_RETENTION_DAYS} jours. Sur Plus, tes liens restent actifs tant que tu es abonné. Si tu rétrogrades depuis Plus, tu gardes ${LOOP_AUDIO_RETENTION_DAYS} jours pour récupérer ta bibliothèque.`
          : `On Free, Pro, and Studio, hosted audio is kept for ${LOOP_AUDIO_RETENTION_DAYS} days. On Plus, your links stay active while subscribed. If you downgrade from Plus, you get a ${LOOP_AUDIO_RETENTION_DAYS}-day grace period to save your library.`,
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
    <div className="min-h-screen pk-prism-stage text-white">
      <Navbar variant="marketing" />

      <main className="mx-auto max-w-6xl px-4 py-14">
        <div className="pk-prism-card relative overflow-hidden p-8 sm:p-10">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(157,124,255,0.12),transparent_55%),radial-gradient(ellipse_at_90%_100%,rgba(103,195,255,0.08),transparent_50%)]" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-balance text-[clamp(1.75rem,4vw,2.25rem)] font-bold tracking-tight">
                <span className="pk-prism-holo-text">{isFr ? "Tarifs" : "Pricing"}</span>
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/60">
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
                <div className="mt-1 text-white/55">
                  {profile.loops_used_this_month ?? 0} / {getPlanBaseLimit(currentPlan)}{" "}
                  {isFr ? "utilisées ce mois" : "used this month"}
                </div>
              </div>
            ) : null}
          </div>

          <div className="relative mt-6 flex flex-wrap gap-3">
            {trustPoints.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/55"
              >
                <Shield className="h-3.5 w-3.5 text-[var(--prism-cyan)]" />
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
                  "pk-pricing-card relative flex h-full min-h-[420px] flex-col rounded-2xl border p-6",
                  recommended
                    ? "pk-pricing-card--popular border-[#7c3aed]/45 shadow-[0_0_70px_rgba(124,58,237,0.16)]"
                    : "border-white/10 bg-white/[0.03]",
                  isCurrent ? "ring-1 ring-[#7c3aed]/40" : "",
                ].join(" ")}
              >
                {isCurrent ? (
                  <div className="absolute -top-3 left-4 rounded-full bg-[#7c3aed] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    {isFr ? "Actif" : "Active"}
                  </div>
                ) : null}

                <div className="flex min-h-7 items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-white">{p.name}</div>
                  {recommended ? (
                    <div className="shrink-0 rounded-full border border-[#7c3aed]/30 bg-[#7c3aed]/10 px-2 py-1 text-[11px] font-semibold leading-none text-[#a78bfa]">
                      {isFr ? "Populaire" : "Popular"}
                    </div>
                  ) : (
                    <span className="h-6 w-6 shrink-0" aria-hidden />
                  )}
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-semibold leading-none tracking-tight text-white">{p.price}</span>
                  <span className="text-sm text-white/45">/mo</span>
                </div>
                <div className="mt-2 text-sm font-medium leading-snug text-white/55">{p.meta}</div>

                <ul className="mt-5 flex-1 space-y-2.5 text-sm leading-snug text-white/55">
                  {p.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--prism-cyan)]" />
                      <span className="min-w-0 flex-1">{b}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-5">
                  <PricingPlanButton
                    tier={p.tier}
                    cta={cta}
                    busy={busy}
                    disabled={loading !== null}
                    onClick={() => void handlePlanAction(p.tier)}
                  />
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
              className="pk-pricing-plan-btn pk-pricing-plan-btn--muted pk-pricing-plan-btn--inline inline-flex h-10 max-w-full items-center justify-center rounded-full px-5 text-sm font-semibold disabled:opacity-50"
            >
              {isFr ? "Gérer ou annuler via le portail Stripe →" : "Manage or cancel via Stripe portal →"}
            </button>
          </div>
        ) : null}

        <section className="mt-14">
          <h2 className="text-xl font-semibold text-white">FAQ</h2>
          <div className="mt-5 grid gap-3">
            {faqs.map((f, i) => {
              const isOpen = open === i;
              return (
                <div key={f.q} className="pk-prism-card overflow-hidden">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    onClick={() => setOpen((v) => (v === i ? null : i))}
                  >
                    <div className="text-sm font-semibold text-white">{f.q}</div>
                    <div className="text-[var(--prism-cyan)]">{isOpen ? "–" : "+"}</div>
                  </button>
                  {isOpen ? <div className="px-5 pb-5 text-sm text-white/55">{f.a}</div> : null}
                </div>
              );
            })}
          </div>
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
    </div>
  );
}
