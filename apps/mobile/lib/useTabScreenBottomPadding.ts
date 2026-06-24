import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePlayerStore } from "@/stores/playerStore";
import { spacing } from "@/theme/tokens";

/** Aligné `app/(tabs)/_layout.tsx` — hauteur barre d’onglets flottante. */
const TAB_BAR_CORE_HEIGHT = 64;
const MINI_PLAYER_SHELL_HEIGHT = 72;
const MINI_PLAYER_ABOVE_TAB = 12;

export function floatingTabBarHeight(bottomInset: number): number {
  return TAB_BAR_CORE_HEIGHT + Math.max(bottomInset, 8);
}

/** Espace bas pour ScrollView / listes — tab bar + mini-player si actif. */
export function useTabScreenBottomPadding(extra?: number): number {
  const margin = extra ?? spacing.md;
  const insets = useSafeAreaInsets();
  const hasMiniPlayer = usePlayerStore((s) => s.current != null);
  const tabHeight = floatingTabBarHeight(insets.bottom);

  if (!hasMiniPlayer) {
    return tabHeight + margin;
  }

  return tabHeight + MINI_PLAYER_ABOVE_TAB + MINI_PLAYER_SHELL_HEIGHT + margin;
}
