import { cn } from "@/lib/utils";

type Props = {
  percent: number;
  className?: string;
  /** Texte accessibilité — progression estimée */
  label?: string;
};

export function GenerationProgressBar({ percent, className, label }: Props) {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div className={cn("w-full", className)}>
      <div
        className="pk-generation-progress-track h-1.5 w-full overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuenow={p}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="pk-generation-progress-fill h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-cyan-400 transition-[width] duration-500 ease-out"
          style={{ width: `${p}%` }}
        />
      </div>
    </div>
  );
}
