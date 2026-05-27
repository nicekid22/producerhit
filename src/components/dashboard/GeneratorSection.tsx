import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function GeneratorSection({
  title,
  collapsible = false,
  defaultOpen = true,
  className,
  children,
}: {
  title: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (!collapsible) {
    return (
      <div className={cn("border-b border-pk-border p-4", className)}>
        <div className="text-sm font-semibold">{title}</div>
        <div className="mt-4">{children}</div>
      </div>
    );
  }

  return (
    <div className={cn("border-b border-pk-border", className)}>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 p-4 md:pointer-events-none md:cursor-default"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-left">{title}</span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-pk-muted transition-transform md:hidden", open && "rotate-180")}
          aria-hidden
        />
      </button>
      <div className={cn("px-4 pb-4", !open && "hidden md:block")}>
        <div className="mt-0 md:mt-4">{children}</div>
      </div>
    </div>
  );
}
