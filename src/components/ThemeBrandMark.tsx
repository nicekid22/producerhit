import { useId } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** Désactive l’animation shimmer (ex. reduced motion). */
  static?: boolean;
};

/** Marque ProducerHit — waveform aligné sur le dégradé holo de « hit ». */
export function ThemeBrandMark({ className, static: staticMark = false }: Props) {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const uid = useId().replace(/:/g, "");
  const gradId = `ph-mark-${uid}`;
  const animate = !staticMark && !reducedMotion;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("pk-brand-mark shrink-0", className)}
      aria-hidden
    >
      <defs>
        <linearGradient
          id={gradId}
          gradientUnits="userSpaceOnUse"
          x1="-8"
          y1="4"
          x2="32"
          y2="20"
        >
          <stop offset="0%" stopColor="var(--ph-mark-0, #e2e8f0)" />
          <stop offset="28%" stopColor="var(--ph-mark-1, #67c3ff)" />
          <stop offset="58%" stopColor="var(--ph-mark-2, #9d7cff)" />
          <stop offset="100%" stopColor="var(--ph-mark-3, #cbd5e1)" />
          {!animate ? null : (
            <>
              <animate attributeName="x1" values="-8;6;-8" dur="12s" repeatCount="indefinite" />
              <animate attributeName="x2" values="18;32;18" dur="12s" repeatCount="indefinite" />
            </>
          )}
        </linearGradient>
      </defs>
      <g stroke={`url(#${gradId})`} strokeWidth="2.1" strokeLinecap="round">
        <path d="M5 12v2" />
        <path d="M9 8v8" />
        <path d="M13 5v14" />
        <path d="M17 9v6" />
        <path d="M21 12v2" />
      </g>
    </svg>
  );
}
