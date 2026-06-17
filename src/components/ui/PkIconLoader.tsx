import type { ElementKind } from "@/components/icons/ElementIcons";
import { loaderElementFromIcon, loaderNavIconFromIcon, type PkLoaderIcon } from "@/lib/loaderIcons";
import { cn } from "@/lib/utils";

type Size = "xs" | "sm" | "md" | "lg";

const ICON_SIZE: Record<Size, string> = {
  xs: "h-3.5 w-3.5",
  sm: "h-5 w-5",
  md: "h-8 w-8",
  lg: "h-11 w-11",
};

type Props = {
  icon?: PkLoaderIcon;
  element?: ElementKind;
  size?: Size;
  label?: string;
  sublabel?: string;
  className?: string;
  inline?: boolean;
};

export function PkIconLoader({
  icon = "default",
  element,
  size = "md",
  label,
  sublabel,
  className,
  inline = false,
}: Props) {
  const resolvedElement = element ?? loaderElementFromIcon(icon);
  const NavIcon = loaderNavIconFromIcon(icon);

  return (
    <div
      className={cn(
        inline ? "inline-flex items-center gap-2" : "flex flex-col items-center text-center",
        "pk-icon-loader",
        `pk-icon-loader--${size}`,
        `pk-icon-loader--element-${resolvedElement}`,
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={label ?? "Loading"}
      data-pk-element={resolvedElement}
    >
      <span className="pk-icon-loader__stage" aria-hidden>
        {size === "md" || size === "lg" ? <span className="pk-icon-loader__plate" aria-hidden /> : null}
        <span className="pk-icon-loader__ring" />
        <NavIcon className={cn("pk-icon-loader__icon", ICON_SIZE[size])} strokeWidth={1.85} />
      </span>
      {label ? <p className="pk-icon-loader__label">{label}</p> : null}
      {sublabel ? <p className="pk-icon-loader__sublabel">{sublabel}</p> : null}
    </div>
  );
}

export type { PkLoaderIcon } from "@/lib/loaderIcons";
