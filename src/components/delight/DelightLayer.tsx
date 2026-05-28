import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useDelightStore } from "@/stores/delightStore";

export function DelightLayer() {
  const banner = useDelightStore((s) => s.banner);
  const clearBanner = useDelightStore((s) => s.clearBanner);

  useEffect(() => {
    if (!banner) return;
    const t = window.setTimeout(clearBanner, 2600);
    return () => window.clearTimeout(t);
  }, [banner, clearBanner]);

  if (!banner || typeof document === "undefined") return null;

  return createPortal(
    <div className="pk-wow-layer pointer-events-none fixed inset-0 z-[250]" aria-live="polite" aria-atomic="true">
      <div className={`pk-wow-banner pk-wow-banner--${banner.variant}`}>
        <div className="pk-wow-banner__emoji" aria-hidden>
          {banner.emoji}
        </div>
        <div className="pk-wow-banner__title">{banner.title}</div>
        {banner.subtitle ? <div className="pk-wow-banner__subtitle">{banner.subtitle}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
