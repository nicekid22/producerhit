import { MOBILE_DASHBOARD_V2 } from "@/lib/featureFlags";
import { useIsDesktop } from "@/hooks/useMediaQuery";

/** Mobile UI v2 (Dashboard tabs, cartes compactes, sheets). Actif si flag + viewport < md. */
export function useMobileUiV2(): boolean {
  const isDesktop = useIsDesktop();
  return MOBILE_DASHBOARD_V2 && !isDesktop;
}
