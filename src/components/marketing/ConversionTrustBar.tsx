import { CreditCard, Download, Music2, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { croLandingTrustBarItems, croTrustBarItems } from "@/lib/croTrustCopy";
import type { AppLocale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const ICONS = {
  "no-card": CreditCard,
  free: Sparkles,
  stripe: ShieldCheck,
  cancel: RefreshCw,
  studio: Music2,
  mp3: Download,
} as const;

type Props = {
  locale: AppLocale;
  compact?: boolean;
  /** Landing hero : bénéfices free (sans Stripe / annulation). */
  variant?: "default" | "landing";
  /** @deprecated Préférer variant="landing" */
  omitFreeCount?: boolean;
  className?: string;
};

export function ConversionTrustBar({
  locale,
  compact = false,
  variant = "default",
  omitFreeCount = false,
  className,
}: Props) {
  const items =
    variant === "landing"
      ? croLandingTrustBarItems(locale)
      : croTrustBarItems(locale).filter((item) => !(omitFreeCount && item.id === "free"));

  return (
    <div
      className={cn(
        "pk-cro-trust",
        compact && "pk-cro-trust--compact",
        className,
      )}
      role="list"
      aria-label={locale === "fr" ? "Avantages ProducerHit" : "ProducerHit highlights"}
    >
      {items.map((item) => {
        const Icon = ICONS[item.id as keyof typeof ICONS] ?? ShieldCheck;
        return (
          <span key={item.id} className="pk-cro-trust__pill" role="listitem">
            <Icon className="pk-cro-trust__icon h-3.5 w-3.5 shrink-0" aria-hidden />
            {item.label}
          </span>
        );
      })}
    </div>
  );
}
