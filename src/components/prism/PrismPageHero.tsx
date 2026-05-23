import type { ReactNode } from "react";

export function PrismPageHero({
  eyebrow,
  title,
  description,
  children,
  actions,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="pk-prism-page-hero">
      <div className="pk-prism-hero-orb pk-prism-hero-orb--a" aria-hidden />
      <div className="pk-prism-hero-orb pk-prism-hero-orb--b" aria-hidden />
      <div className="relative z-[1] flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          {eyebrow ? <div className="pk-prism-eyebrow">{eyebrow}</div> : null}
          <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
          {description ? <p className="mt-2 max-w-xl text-sm text-pk-muted md:text-base">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children ? <div className="relative z-[1] mt-5">{children}</div> : null}
    </div>
  );
}
