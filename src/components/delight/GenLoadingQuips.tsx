import { useEffect, useState } from "react";
import { pickGenLoadingQuip } from "@/lib/delight/copy";
import { PkIconLoader } from "@/components/ui/PkIconLoader";
import { cn } from "@/lib/utils";

type Props = {
  active: boolean;
  locale: "en" | "fr";
  className?: string;
};

export function GenLoadingQuips({ active, locale, className }: Props) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 2800);
    return () => window.clearInterval(id);
  }, [active]);

  if (!active) return null;

  return (
    <div className={cn("pk-gen-loading-scene flex flex-col items-center gap-2", className)}>
      <PkIconLoader icon="generator" size="sm" />
      <div className="text-[11px] text-violet-200/70 pk-gen-quip" key={tick}>
        {pickGenLoadingQuip(locale, tick)}
      </div>
    </div>
  );
}
