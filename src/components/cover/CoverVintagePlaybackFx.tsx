import { cn } from "@/lib/utils";

/** Overlay VHS — grain, scanlines, chroma, tracking (sans lignes qui traversent). */
export function CoverVintagePlaybackFx({ active, className }: { active: boolean; className?: string }) {
  return (
    <div className={cn("pk-cover-vintage-fx pk-cover-vhs-fx", active && "is-active", className)} aria-hidden>
      <div className="pk-cover-vhs-fx__chroma" />
      <div className="pk-cover-vhs-fx__bleed" />
      <div className="pk-cover-vintage-fx__grain" />
      <div className="pk-cover-vintage-fx__scanlines" />
      <div className="pk-cover-vhs-fx__tracking" />
      <div className="pk-cover-vhs-fx__static" />
      <div className="pk-cover-vintage-fx__vignette" />
    </div>
  );
}
