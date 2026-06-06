import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PrismPageHero({
  eyebrow,
  title,
  description,
  children,
  actions,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("pk-prism-page-hero", className)}>
      <div className="pk-prism-hero-orb pk-prism-hero-orb--a" aria-hidden />
      <div className="pk-prism-hero-orb pk-prism-hero-orb--b" aria-hidden />
      <div className="relative z-[1] flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          {eyebrow ? <div className="pk-prism-eyebrow">{eyebrow}</div> : null}
          <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
          {description ? <p className="mt-2 max-w-xl text-sm text-pk-muted md:text-base">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children ? <div className="relative z-[1] mt-4">{children}</div> : null}
    </div>
  );
}
