import { useEffect, useState } from "react";
import { HeroCtaButton } from "@/components/landing/HeroCtaButton";
import { buildAuthUrl } from "@/lib/authRoutes";
import { runCheckoutWithAuth } from "@/lib/billing";
import { croStickyCta } from "@/lib/croTrustCopy";
import { getLaunchOfferStickyCta, isLaunchOfferActive } from "@/lib/launchOffer";
import { trackClientEvent } from "@/lib/supabaseClient";

import type { AppLocale } from "@/i18n/config";
type Props = {
  locale: AppLocale;
  visible: boolean;
  user: boolean;
  /** When set to "free", show Pro upgrade sticky instead of hiding. */
  currentPlan?: string;
};

export function LandingStickyCta({ locale, visible, user, currentPlan }: Props) {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const sticky = croStickyCta(locale);
  const isFreeUser = user && currentPlan === "free";
  const launchProSticky = isFreeUser && isLaunchOfferActive();
  const proSticky = launchProSticky ? getLaunchOfferStickyCta(locale) : null;

  useEffect(() => {
    if (!visible) {
      setShow(false);
      return;
    }
    if (user && !isFreeUser) {
      setShow(false);
      return;
    }

    const onScroll = () => {
      setShow(window.scrollY > 420);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isFreeUser, user, visible]);

  const handleProUpgrade = async () => {
    trackClientEvent("pricing_cta_click", {
      tier: "pro",
      kind: "upgrade",
      current_plan: currentPlan ?? "free",
      location: "landing_sticky_cta",
    });
    setLoading(true);
    try {
      await runCheckoutWithAuth({ plan: "pro", location: "landing_sticky_cta", locale });
    } finally {
      setLoading(false);
    }
  };

  if (!show || (user && !isFreeUser)) return null;

  const title = proSticky?.title ?? sticky.title;
  const sub = proSticky?.sub ?? sticky.sub;

  return (
    <div className="pk-landing-sticky-cta fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden">
      <div className="pk-landing-sticky-cta__inner mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-white/12 bg-[rgba(8,7,14,0.88)] p-3 shadow-[0_-8px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-white">{title}</p>
          <p className="truncate text-[10px] text-white/45">{sub}</p>
        </div>
        {isFreeUser ? (
          <button
            type="button"
            disabled={loading}
            onClick={() => void handleProUpgrade()}
            className="shrink-0 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {loading ? "…" : (proSticky?.button ?? sticky.button)}
          </button>
        ) : (
          <HeroCtaButton to={buildAuthUrl()} variant="spark" size="nav" className="shrink-0">
            {sticky.button}
          </HeroCtaButton>
        )}
      </div>
    </div>
  );
}
