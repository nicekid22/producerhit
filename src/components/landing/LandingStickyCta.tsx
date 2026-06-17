import { useEffect, useState } from "react";
import { HeroCtaButton } from "@/components/landing/HeroCtaButton";
import { buildAuthUrl } from "@/lib/authRoutes";
import { croStickyCta } from "@/lib/croTrustCopy";

import type { AppLocale } from "@/i18n/config";
type Props = {
  locale: AppLocale;
  visible: boolean;
  user: boolean;
};

export function LandingStickyCta({ locale, visible, user }: Props) {
  const [show, setShow] = useState(false);
  const sticky = croStickyCta(locale);

  useEffect(() => {
    if (!visible || user) {
      setShow(false);
      return;
    }

    const onScroll = () => {
      setShow(window.scrollY > 420);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [user, visible]);

  if (!show || user) return null;

  return (
    <div className="pk-landing-sticky-cta fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden">
      <div className="pk-landing-sticky-cta__inner mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-white/12 bg-[rgba(8,7,14,0.88)] p-3 shadow-[0_-8px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-white">{sticky.title}</p>
          <p className="truncate text-[10px] text-white/45">{sticky.sub}</p>
        </div>
        <HeroCtaButton to={buildAuthUrl()} variant="spark" size="nav" className="shrink-0">
          {sticky.button}
        </HeroCtaButton>
      </div>
    </div>
  );
}
