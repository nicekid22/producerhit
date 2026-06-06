/** Voile cozy — uniquement sur les calques fond (mesh), jamais en overlay plein écran UI. */
import { SITE_TEXTURE_VEIL } from "@/lib/featureFlags";
import { cn } from "@/lib/utils";

type Variant = "dashboard" | "landing" | "marketing";

export function BackdropTextureVeil({ variant = "dashboard" }: { variant?: Variant }) {
  if (!SITE_TEXTURE_VEIL) return null;
  return (
    <div
      className={cn("pk-backdrop-texture-veil", variant !== "dashboard" && `pk-backdrop-texture-veil--${variant}`)}
      aria-hidden
    />
  );
}
