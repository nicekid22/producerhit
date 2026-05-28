import {
  AudioWaveform,
  BarChart3,
  CreditCard,
  Grid3X3,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type PkLoaderIcon = "generator" | "library" | "community" | "settings" | "growth" | "pricing" | "default";

type Size = "xs" | "sm" | "md" | "lg";

const ICONS: Record<PkLoaderIcon, LucideIcon> = {
  generator: AudioWaveform,
  library: Grid3X3,
  community: Users,
  settings: Settings,
  growth: BarChart3,
  pricing: CreditCard,
  default: AudioWaveform,
};

const ICON_SIZE: Record<Size, string> = {
  xs: "h-3.5 w-3.5",
  sm: "h-5 w-5",
  md: "h-8 w-8",
  lg: "h-11 w-11",
};

type Props = {
  icon?: PkLoaderIcon;
  size?: Size;
  label?: string;
  sublabel?: string;
  className?: string;
  inline?: boolean;
};

export function PkIconLoader({
  icon = "default",
  size = "md",
  label,
  sublabel,
  className,
  inline = false,
}: Props) {
  const Icon = ICONS[icon];

  return (
    <div
      className={cn(
        inline ? "inline-flex items-center gap-2" : "flex flex-col items-center text-center",
        "pk-icon-loader",
        `pk-icon-loader--${size}`,
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={label ?? "Loading"}
    >
      <span className="pk-icon-loader__stage" aria-hidden>
        <span className="pk-icon-loader__ring" />
        <Icon className={cn("pk-icon-loader__icon", ICON_SIZE[size])} strokeWidth={2.1} />
      </span>
      {label ? <p className="pk-icon-loader__label">{label}</p> : null}
      {sublabel ? <p className="pk-icon-loader__sublabel">{sublabel}</p> : null}
    </div>
  );
}
