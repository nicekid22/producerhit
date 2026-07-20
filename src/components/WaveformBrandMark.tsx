import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

/**
 * ProducerHit waveform brand mark — vertical bars matching the favicon design.
 * Theme-aware via CSS custom properties (falls back to Prism purple-pink gradient).
 */
export function WaveformBrandMark({ className }: Props) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("pk-waveform-mark shrink-0", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="ph-wave-grad" x1="6" y1="8" x2="26" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--ph-wave-0, #d946ef)" />
          <stop offset="0.45" stopColor="var(--ph-wave-1, #a855f7)" />
          <stop offset="1" stopColor="var(--ph-wave-2, #818cf8)" />
        </linearGradient>
      </defs>
      <g stroke="url(#ph-wave-grad)" strokeWidth="2.1" strokeLinecap="round" transform="translate(4 5.5)">
        <path d="M2 10v3" />
        <path d="M6 6v11" />
        <path d="M10 3v18" />
        <path d="M14 8v7" />
        <path d="M18 5v13" />
        <path d="M22 10v3" />
      </g>
    </svg>
  );
}
