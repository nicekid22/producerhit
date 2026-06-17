import type { AppLocale } from "@/i18n/config";
import { getLaunchOfferCopy, getLaunchOfferMicro, isLaunchOfferActive } from "@/lib/launchOffer";
import { cn } from "@/lib/utils";

type Props = {
  locale: AppLocale;
  className?: string;
  /** Masque le bonus et l'ancrage futur — utile dans les espaces étroits */
  compact?: boolean;
};

/** Note discrète sous le prix Pro — style Apple, une ligne. */
export function LaunchOfferChips({ locale, className, compact = false }: Props) {
  if (!isLaunchOfferActive()) return null;
  const copy = getLaunchOfferCopy(locale);
  const micro = getLaunchOfferMicro(locale);
  const isFr = locale === "fr";

  if (compact) {
    return (
      <p className={cn("pk-launch-note pk-launch-note--compact", className)}>
        {isFr ? "Prix fondateur" : "Founder rate locked"}
        <span className="pk-launch-note__sep" aria-hidden>
          {" "}
          ·{" "}
        </span>
        {micro.bonus}
        <span className="pk-launch-note__sep" aria-hidden>
          {" "}
          ·{" "}
        </span>
        <span className="pk-launch-note__muted">{micro.future}</span>
      </p>
    );
  }

  return (
    <p className={cn("pk-launch-note", className)}>
      <span>{copy.founderLock}</span>
      <span className="pk-launch-note__sep" aria-hidden>
        {" "}
        ·{" "}
      </span>
      <span>{copy.bonusLine}</span>
      <span className="pk-launch-note__sep" aria-hidden>
        {" "}
        ·{" "}
      </span>
      <span className="pk-launch-note__muted">{copy.subline}</span>
    </p>
  );
}
