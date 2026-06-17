import { ElementIcon } from "@/components/icons/ElementIcons";
import type { LandingCloudMoodCard } from "@/lib/landingContent";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Burst = {
  key: number;
  mood: LandingCloudMoodCard;
  isFr: boolean;
};

const WOW_MS = 3200;

let pushBurst: ((mood: LandingCloudMoodCard, isFr: boolean) => void) | null = null;

/** Notification wow landing — dégradé + brillance par élément. */
export function showLandingMoodWow(mood: LandingCloudMoodCard, isFr: boolean) {
  pushBurst?.(mood, isFr);
}

export function LandingMoodWowHost() {
  const [burst, setBurst] = useState<Burst | null>(null);

  useEffect(() => {
    pushBurst = (mood, isFr) => {
      const key = Date.now();
      setBurst({ key, mood, isFr });
      window.setTimeout(() => {
        setBurst((current) => (current?.key === key ? null : current));
      }, WOW_MS);
    };
    return () => {
      pushBurst = null;
    };
  }, []);

  if (!burst || typeof document === "undefined") return null;

  const tag = burst.isFr ? "Mood activé" : "Mood set";

  return createPortal(
    <div
      key={burst.key}
      className="pk-landing-mood-wow"
      data-pk-element={burst.mood.element}
      role="status"
      aria-live="polite"
    >
      <div className="pk-landing-mood-wow__backdrop" aria-hidden />
      <div className="pk-landing-mood-wow__panel">
        <span className="pk-landing-mood-wow__shine" aria-hidden />
        <span className="pk-landing-mood-wow__ring" aria-hidden />
        <span className="pk-landing-mood-wow__icon-wrap">
          <ElementIcon kind={burst.mood.element} className="pk-landing-mood-wow__icon" strokeWidth={2} />
        </span>
        <p className="pk-landing-mood-wow__label">{burst.mood.label}</p>
        <p className="pk-landing-mood-wow__tag">{tag}</p>
        <p className="pk-landing-mood-wow__moment">{burst.mood.toast}</p>
      </div>
    </div>,
    document.body,
  );
}
