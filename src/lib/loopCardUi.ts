import { cn } from "@/lib/utils";

/** Play/Pause — états selected (track courante) et playing (lecture active). */
export function loopPlayButtonClass(active: boolean, playing: boolean, extra?: string) {
  return cn(
    "pk-loop-play-btn",
    active && "pk-loop-play-btn--selected",
    playing && "pk-loop-play-btn--playing",
    extra,
  );
}

/** Toggle persistant (Save, Public, etc.) — reste allumé tant que l'état est actif. */
export function loopToggleButtonClass(on: boolean, extra?: string) {
  return cn("pk-loop-toggle-btn", on && "pk-loop-toggle-btn--on", extra);
}

export function loopPublicButtonClass(isPublic: boolean, extra?: string) {
  return cn("pk-loop-toggle-btn", isPublic && "pk-loop-toggle-btn--public", extra);
}

export function loopCardClass(active: boolean, playing: boolean, extra?: string) {
  return cn(
    active && "pk-loop-card--active shadow-glow",
    playing && "pk-loop-card--playing",
    extra,
  );
}

export function loopCoverClass(active: boolean, playing: boolean, extra?: string) {
  return cn(
    active && "pk-loop-cover--selected",
    playing && "pk-loop-cover--playing",
    extra,
  );
}
