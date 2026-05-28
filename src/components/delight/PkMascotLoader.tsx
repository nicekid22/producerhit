import { cn } from "@/lib/utils";
import { PkMascotArtToy } from "@/components/delight/PkMascotArtToy";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_PX: Record<Size, number> = {
  xs: 18,
  sm: 30,
  md: 56,
  lg: 84,
  xl: 108,
};

type Props = {
  size?: Size;
  label?: string;
  sublabel?: string;
  className?: string;
  animate?: boolean;
  showGlow?: boolean;
  inline?: boolean;
};

export function PkMascotLoader({
  size = "md",
  label,
  sublabel,
  className,
  animate = true,
  showGlow = true,
  inline = false,
}: Props) {
  const px = SIZE_PX[size];

  return (
    <div
      className={cn(
        inline ? "inline-flex items-center gap-2" : "flex flex-col items-center text-center",
        "pk-mascot-loader",
        `pk-mascot-loader--${size}`,
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={label ?? "Loading"}
    >
      <div className="pk-mascot-wrap pk-mascot-loader__stage">
        {showGlow ? <div className="pk-mascot-glow pk-mascot-loader__glow" aria-hidden /> : null}
        <PkMascotArtToy size={px} animate={animate} className="pk-mascot pk-mascot-loader__figure" />
      </div>
      {label ? <p className="pk-mascot-loader__label">{label}</p> : null}
      {sublabel ? <p className="pk-mascot-loader__sublabel">{sublabel}</p> : null}
    </div>
  );
}
