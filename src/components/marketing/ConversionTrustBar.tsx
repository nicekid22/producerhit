import { CreditCard, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { croTrustBarItems } from "@/lib/croTrustCopy";
import type { AppLocale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const ICONS = {
  "no-card": CreditCard,
  free: Sparkles,
  stripe: ShieldCheck,
  cancel: RefreshCw,
} as const;

type Props = {
  locale: AppLocale;
  compact?: boolean;
  className?: string;
};

export function ConversionTrustBar({ locale, compact = false, className }: Props) {
  const items = croTrustBarItems(locale);

  return (
    <div
      className={cn(
        "pk-cro-trust",
        compact && "pk-cro-trust--compact",
        className,
      )}
      role="list"
      aria-label={locale === "fr" ? "Garanties ProducerHit" : "ProducerHit guarantees"}
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
