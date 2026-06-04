import { Gem } from "lucide-react";
import { cn } from "@/lib/utils";

/** Icône crédit génération (diamant) — usage inline dans l’UI. */
export function GenerationCreditIcon({ className }: { className?: string }) {
  return (
    <Gem
      className={cn("inline-block shrink-0 text-amber-300/90 drop-shadow-[0_0_6px_rgba(251,191,36,0.35)]", className ?? "h-3 w-3")}
      aria-hidden
    />
  );
}

/** Montant + icône, ex. « 35 », « +1 », « +28 ». */
export function GenerationCreditAmount({
  amount,
  showPlus = false,
  className,
  iconClassName,
}: {
  amount: number | string;
  showPlus?: boolean;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-0.5 align-middle tabular-nums", className)}>
      {showPlus ? <span className="font-medium opacity-85">+</span> : null}
      <span>{amount}</span>
      <GenerationCreditIcon className={iconClassName} />
    </span>
  );
}
