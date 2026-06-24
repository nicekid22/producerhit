import { AudioReactiveOrb } from "@/components/AudioOrb";
import type { AIOrbProps } from "./types";

export type { AIOrbProps, AIOrbState } from "./types";

/** Orbe signature — Three.js (expo-gl), placeholder transparent en attente du slot GL. */
export function AIOrb({ size, state = "idle", paused = false }: AIOrbProps) {
  const energy = state === "active" ? "active" : "idle";
  return (
    <AudioReactiveOrb
      size={size}
      energy={energy}
      enabled
      active={!paused}
      glPriority="normal"
    />
  );
}
