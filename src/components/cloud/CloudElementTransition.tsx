import { ElementIcon, type ElementKind } from "@/components/icons/ElementIcons";
import { playElementSpiritSfx } from "@/lib/delight/elementSpiritSfx";
import { cloudAccentToElement } from "@/lib/elementTheme";
import { cn } from "@/lib/utils";
import { CLOUD_ACCENT_OPTIONS, useCloudAccentStore, type CloudAccent } from "@/stores/cloudAccentStore";
import { useLocaleStore } from "@/stores/localeStore";
import { isCloudTheme, useVisualThemeStore } from "@/stores/visualThemeStore";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";

const SPIRIT_MS = 2400;

type SpiritBurst = {
  key: number;
  element: ElementKind;
  accent: CloudAccent;
};

function accentLabel(accent: CloudAccent, isFr: boolean) {
  const opt = CLOUD_ACCENT_OPTIONS.find((o) => o.id === accent);
  if (!opt) return accent;
  return isFr ? opt.labelFr : opt.labelEn;
}

/** Popup rétro « esprit élément » (Zelda-like) — petit, tourne, jingle. */
export function CloudElementTransition() {
  const locale = useLocaleStore((s) => s.locale);
  const isFr = locale === "fr";
  const { pathname } = useLocation();
  const onMarketingLanding = pathname === "/" || pathname.startsWith("/landing");
  const visualTheme = useVisualThemeStore((s) => s.theme);
  const cloud = isCloudTheme(visualTheme);
  const accent = useCloudAccentStore((s) => s.accent);
  const prevAccent = useRef(accent);
  const skipNext = useRef(true);
  const [burst, setBurst] = useState<SpiritBurst | null>(null);

  useEffect(() => {
    if (!cloud) {
      prevAccent.current = accent;
      skipNext.current = true;
      setBurst(null);
      return;
    }

    if (skipNext.current) {
      skipNext.current = false;
      prevAccent.current = accent;
      return;
    }

    if (prevAccent.current === accent) return;
    prevAccent.current = accent;

    if (onMarketingLanding) return;

    const element = cloudAccentToElement(accent);
    const key = Date.now();
    setBurst({ key, element, accent });
    playElementSpiritSfx(element);

    const timer = window.setTimeout(() => {
      setBurst((current) => (current?.key === key ? null : current));
    }, SPIRIT_MS);

    return () => window.clearTimeout(timer);
  }, [accent, cloud, onMarketingLanding]);

  if (!cloud || !burst || typeof document === "undefined") return null;

  const label = accentLabel(burst.accent, isFr);
  const tag = isFr ? "Esprit activé" : "Spirit awakened";

  return createPortal(
    <div
      key={burst.key}
      className={cn("pk-element-spirit")}
      data-pk-element={burst.element}
      role="status"
      aria-live="polite"
      aria-label={isFr ? `${label} — mood Cloud` : `${label} — Cloud mood`}
    >
      <div className="pk-element-spirit__spark pk-element-spirit__spark--1" aria-hidden />
      <div className="pk-element-spirit__spark pk-element-spirit__spark--2" aria-hidden />
      <div className="pk-element-spirit__spark pk-element-spirit__spark--3" aria-hidden />
      <div className="pk-element-spirit__spark pk-element-spirit__spark--4" aria-hidden />

      <div className="pk-element-spirit__panel">
        <div className="pk-element-spirit__crest" aria-hidden />
        <div className="pk-element-spirit__orb-wrap">
          <div className="pk-element-spirit__orb">
            <span className="pk-element-spirit__orb-glow" aria-hidden />
            <span className="pk-element-spirit__spin">
              <ElementIcon kind={burst.element} className="pk-element-spirit__icon" strokeWidth={2} />
            </span>
          </div>
        </div>
        <p className="pk-element-spirit__label">{label}</p>
        <p className="pk-element-spirit__tag">{tag}</p>
      </div>
    </div>,
    document.body,
  );
}
