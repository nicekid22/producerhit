import { Info } from "lucide-react";
import { loopAudioRetentionHint } from "@/lib/loopAudioRetention";

type Props = {
  locale: "fr" | "en";
  className?: string;
  compact?: boolean;
};

export function LoopAudioRetentionNotice({ locale, className = "", compact = false }: Props) {
  return (
    <p
      className={`flex items-start gap-2 rounded-pk border border-pk-border/70 bg-pk-bg/50 px-3 py-2 text-xs leading-relaxed text-pk-muted ${className}`}
      role="note"
    >
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pk-accent/80" aria-hidden />
      <span>{compact ? (locale === "fr" ? "Audio hébergé 7 jours puis supprimé automatiquement." : "Audio hosted 7 days, then removed automatically.") : loopAudioRetentionHint(locale)}</span>
    </p>
  );
}
