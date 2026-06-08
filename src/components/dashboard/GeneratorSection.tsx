import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { DiscreetInfoTip } from "@/components/dashboard/DiscreetInfoTip";

/** Padding horizontal du contenu générateur (Style & Vibe, L'idée…) — pas le header ni le footer */
export const generatorSectionPad = "px-5 py-4 md:px-6 md:py-4";

function GeneratorSectionHeading({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span>{title}</span>
      {hint ? <DiscreetInfoTip text={hint} /> : null}
    </div>
  );
}

export function GeneratorSection({
  title,
  hint,
  collapsible = false,
  defaultOpen = true,
  className,
  children,
}: {
  title: string;
  hint?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (!collapsible) {
    return (
      <div className={cn("pk-studio-section min-w-0 max-w-full border-b border-pk-border", generatorSectionPad, className)}>
        <div className="text-sm font-semibold pk-studio-section__title md:text-inherit">
          <GeneratorSectionHeading title={title} hint={hint} />
        </div>
        <div className="mt-4 min-w-0 md:mt-5">{children}</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "pk-studio-section mx-3 mb-3 min-w-0 max-w-[calc(100%-1.5rem)] overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.025]",
        "md:mx-0 md:mb-0 md:max-w-none md:overflow-visible md:rounded-none md:border-0 md:border-b md:border-pk-border md:bg-transparent",
        "md:px-6 md:py-4",
        className,
      )}
    >
      <button
        type="button"
        className="flex w-full min-w-0 items-center justify-between gap-3 px-3.5 py-3.5 md:pointer-events-none md:cursor-default md:border-0 md:bg-transparent md:p-0"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="pk-studio-section__title min-w-0 text-[13px] font-semibold text-left tracking-tight md:text-inherit">
          <GeneratorSectionHeading title={title} hint={hint} />
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-white/40 transition-transform md:hidden", open && "rotate-180")}
          aria-hidden
        />
      </button>
      <div className={cn("min-w-0 px-3.5 pb-3.5 md:px-0 md:pb-0", !open && "hidden md:block")}>
        <div className="min-w-0 md:mt-5">{children}</div>
      </div>
    </div>
  );
}
