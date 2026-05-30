import { AudioWaveform } from "lucide-react";
import { cn } from "@/lib/utils";
import { GenElectricMark } from "@/components/dashboard/GenElectricMark";

type Props = {
  generating: boolean;
  disabled?: boolean;
  idleLabel: string;
  generatingLabel: string;
  onClick: () => void | Promise<void>;
  className?: string;
};

/** CTA principal du dashboard — liquid glass prism + état électrique en génération. */
export function DashboardGenerateButton({
  generating,
  disabled,
  idleLabel,
  generatingLabel,
  onClick,
  className,
}: Props) {
  return (
    <div className={cn("pk-landing-gen__cta-shell pk-dashboard-gen__cta-shell relative w-full", className)}>
      <span className="pk-landing-gen__cta-field" aria-hidden />
      <button
        type="button"
        disabled={disabled}
        aria-busy={generating}
        onClick={() => void onClick()}
        className={cn(
          "pk-landing-gen__cta pk-dashboard-gen__cta group inline-flex h-12 w-full items-center justify-center rounded-full px-6",
          generating && "is-generating pk-gen-btn-electric is-active",
        )}
      >
        <span className="pk-landing-gen__cta-rim" aria-hidden />
        <span className="pk-landing-gen__cta-spark" aria-hidden />
        <span className="pk-landing-gen__cta-spark pk-landing-gen__cta-spark--alt" aria-hidden />
        <span className="pk-landing-gen__cta-glass" aria-hidden>
          <span className="pk-landing-gen__cta-liquid" aria-hidden />
          <span className="pk-landing-gen__cta-shine" aria-hidden />
        </span>
        {generating ? (
          <>
            <span className="pk-gen-btn-electric__sheen" aria-hidden />
            <span className="pk-gen-btn-electric__arc pk-gen-btn-electric__arc--left" aria-hidden />
            <span className="pk-gen-btn-electric__arc pk-gen-btn-electric__arc--right" aria-hidden />
          </>
        ) : null}
        <span className="pk-landing-gen__cta-inner inline-flex items-center justify-center gap-2 text-sm font-bold">
          {generating ? <GenElectricMark /> : <AudioWaveform className="h-4 w-4" aria-hidden />}
          {generating ? generatingLabel : idleLabel}
        </span>
      </button>
    </div>
  );
}
