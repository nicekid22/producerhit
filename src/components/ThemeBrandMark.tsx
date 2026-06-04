import { useId } from "react";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** Warm Glass : dégradé jaune → orange → rose */
  warm?: boolean;
};

/** Marque ProducerHit (barres waveform du favicon) — distincte de l’icône IA (Sparkles). */
export function ThemeBrandMark({ className, warm = false }: Props) {
  const uid = useId().replace(/:/g, "");
  const gradId = warm ? `ph-mark-w-${uid}` : `ph-mark-p-${uid}`;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          {warm ? (
            <>
              <stop stopColor="#e8a830" />
              <stop offset="0.45" stopColor="#e07028" />
              <stop offset="1" stopColor="#c84858" />
            </>
          ) : (
            <>
              <stop stopColor="#67c3ff" />
              <stop offset="0.55" stopColor="#9d7cff" />
              <stop offset="1" stopColor="#ff4fd8" />
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
