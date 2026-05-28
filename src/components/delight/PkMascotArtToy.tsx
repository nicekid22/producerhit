import { useId } from "react";
import { cn } from "@/lib/utils";

type Props = {
  size?: number;
  animate?: boolean;
  className?: string;
};

export function PkMascotArtToy({ size = 56, animate = true, className }: Props) {
  const uid = useId().replace(/:/g, "");
  const headGrad = `pk-mascot-head-${uid}`;
  const hoodGrad = `pk-mascot-hood-${uid}`;
  const shoeGrad = `pk-mascot-shoe-${uid}`;

  return (
    <svg
      viewBox="0 0 100 120"
      width={size}
      height={Math.round(size * 1.2)}
      className={cn("pk-mascot-art", animate ? "pk-mascot-art--animate" : "", className)}
      aria-hidden
    >
      <defs>
        <radialGradient id={headGrad} cx="38%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#ddd6fe" />
          <stop offset="42%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#6d28d9" />
        </radialGradient>
        <linearGradient id={hoodGrad} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9d7cff" />
          <stop offset="55%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#5b21b6" />
        </linearGradient>
        <linearGradient id={shoeGrad} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f5f3ff" />
          <stop offset="100%" stopColor="#c4b5fd" />
        </linearGradient>
      </defs>

      <ellipse className="pk-mascot-art__shadow" cx="50" cy="116" rx="24" ry="4.5" fill="rgba(124,58,237,0.28)" />

      <g className="pk-mascot-art__bounce">
        <g className="pk-mascot-art__fit">
          <path
            d="M18 98c2-8 8-12 14-12h36c6 0 12 4 14 12l2 8H16l2-8z"
            fill="#3b0764"
            opacity="0.95"
          />
          <path
            d="M22 94c1-5 6-8 11-8h34c5 0 10 3 11 8"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1.2"
          />

          <path
            d="M16 108h18l-1.5 7c-.4 1.8-2 3-3.8 3H18c-2 0-3.6-1.5-3.8-3.4L16 108z"
            fill={`url(#${shoeGrad})`}
          />
          <path d="M16 108h18v3H16z" fill="#67c3ff" opacity="0.85" />
          <path
            d="M66 108h18l1.5 7c.4 1.8 2 3 3.8 3h11.2c2 0 3.6-1.5 3.8-3.4L84 108z"
            fill={`url(#${shoeGrad})`}
          />
          <path d="M66 108h18v3H66z" fill="#67c3ff" opacity="0.85" />

          <path
            d="M12 78c0-6 4-10 10-11 3-.5 25-.5 28 0 6 1 10 5 10 11v18c0 4-3 7-7 7H19c-4 0-7-3-7-7V78z"
            fill={`url(#${hoodGrad})`}
          />
          <path
            d="M8 82c-3 2-5 6-4 10 1 5 6 8 11 7 3-.5 4-2 4-5v-9c-2 1-5 1-7 0-3-1-3-1-4-3z"
            fill="#8b5cf6"
          />
          <path
            d="M92 82c3 2 5 6 4 10-1 5-6 8-11 7-3-.5-4-2-4-5v-9c2 1 5 1 7 0 3-1 3-1 4-3z"
            fill="#8b5cf6"
          />

          <path
            className="pk-mascot-art__hood"
            d="M28 34c-2-10 8-18 22-18s24 8 22 18c-8-2-14-3-22-3s-14 1-22 3z"
            fill="#6d28d9"
            opacity="0.92"
          />

          <ellipse cx="50" cy="38" rx="27" ry="28" fill={`url(#${headGrad})`} />
          <ellipse cx="40" cy="27" rx="9" ry="5.5" fill="rgba(255,255,255,0.34)" />
          <ellipse cx="58" cy="30" rx="4" ry="2.5" fill="rgba(255,255,255,0.16)" />

          <g className="pk-mascot-art__eyes">
            <ellipse cx="39" cy="40" rx="7.2" ry="8" fill="#fff" />
            <ellipse cx="61" cy="40" rx="7.2" ry="8" fill="#fff" />
            <circle cx="40.5" cy="41.5" r="3.8" fill="#1e1033" />
            <circle cx="62.5" cy="41.5" r="3.8" fill="#1e1033" />
            <circle cx="42" cy="39.5" r="1.4" fill="#67c3ff" />
            <circle cx="64" cy="39.5" r="1.4" fill="#67c3ff" />
          </g>

          <ellipse cx="34" cy="47" rx="3" ry="1.8" fill="#ff4fd8" opacity="0.35" />
          <ellipse cx="66" cy="47" rx="3" ry="1.8" fill="#ff4fd8" opacity="0.35" />

          <path
            d="M44 49c2 2 10 2 12 0"
            fill="none"
            stroke="#2e1065"
            strokeWidth="1.6"
            strokeLinecap="round"
          />

          <rect x="36" y="66" width="28" height="12" rx="6" fill="rgba(255,255,255,0.08)" />
          <path d="M43 72h14" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" strokeLinecap="round" />

          <g className="pk-mascot-art__strings">
            <path d="M46 52v12" stroke="#ddd6fe" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M54 52v12" stroke="#ddd6fe" strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="46" cy="65" r="1.6" fill="#67c3ff" />
            <circle cx="54" cy="65" r="1.6" fill="#ff4fd8" />
          </g>

          <path
            d="M44 74h12l-1.5 4.5h-9L44 74z"
            fill="rgba(255,255,255,0.12)"
          />
        </g>
      </g>
    </svg>
  );
}
