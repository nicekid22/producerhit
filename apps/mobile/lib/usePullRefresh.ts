import { useCallback, useState } from "react";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme/ThemeProvider";

type Options = {
  onRefresh: () => Promise<void>;
  haptics?: boolean;
};

export function usePullRefresh({ onRefresh, haptics = true }: Options) {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    if (haptics) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [haptics, onRefresh]);

  return {
    refreshing,
    refresh,
    tintColor: colors.accentPrimary,
    onRefresh: () => void refresh(),
  };
}
