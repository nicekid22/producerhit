import { useId } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** Désactive l’animation shimmer (ex. reduced motion). */
  static?: boolean;
};

/** Marque ProducerHit — squircle verre + courbe « hit » (aligné accents Cloud / holo Prism). */
export function ThemeBrandMark({ className, static: staticMark = false }: Props) {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const uid = useId().replace(/:/g, "");
  const gradId = `ph-mark-grad-${uid}`;
  const borderId = `ph-mark-border-${uid}`;
  const bgId = `ph-mark-bg-${uid}`;
  const animate = !staticMark && !reducedMotion;

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("pk-brand-mark shrink-0", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={bgId} x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--ph-mark-bg-0, rgba(255, 255, 255, 0.72))" />
          <stop offset="100%" stopColor="var(--ph-mark-bg-1, rgba(255, 255, 255, 0.08))" />
        </linearGradient>
        <linearGradient id={borderId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--ph-mark-border-0, rgba(255, 255, 255, 0.72))" />
          <stop offset="50%" stopColor="var(--ph-mark-border-1, rgba(200, 184, 255, 0.45))" />
          <stop offset="100%" stopColor="var(--ph-mark-border-2, rgba(255, 255, 255, 0.28))" />
        </linearGradient>
        <linearGradient id={gradId} x1="6" y1="10" x2="26" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--ph-mark-0, #e2e8f0)" />
          <stop offset="24%" stopColor="var(--ph-mark-1, #67c3ff)" />
          <stop offset="58%" stopColor="var(--ph-mark-2, #9d7cff)" />
          <stop offset="100%" stopColor="var(--ph-mark-3, #a8d4ff)" />
          {!animate ? null : (
            <>
              <animate attributeName="x1" values="6;10;6" dur="14s" repeatCount="indefinite" />
              <animate attributeName="x2" values="22;28;22" dur="14s" repeatCount="indefinite" />
            </>
          )}
        </linearGradient>
      </defs>
      <rect
        x="1"
        y="1"
        width="30"
        height="30"
        rx="9.5"
        fill={`url(#${bgId})`}
        stroke={`url(#${borderId})`}
        strokeWidth="1"
      />
      <path
        d="M8.25 19.75C10.2 14.4 12.1 16.8 14.65 15.35C17.2 13.9 19.4 11.2 24.1 13.15"
        stroke={`url(#${gradId})`}
        strokeWidth="2.35"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="24.1" cy="13.15" r="2.35" fill={`url(#${gradId})`} />
    </svg>
  );
}
