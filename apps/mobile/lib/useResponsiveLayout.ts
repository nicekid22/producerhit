import { Platform, useWindowDimensions } from "react-native";

const TABLET_MIN_WIDTH = 768;

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const isTablet = (Platform.OS === "ios" && Platform.isPad) || width >= TABLET_MIN_WIDTH;
  const columns = isTablet ? (width >= 1024 ? 3 : 2) : 1;
  const contentMaxWidth = isTablet ? Math.min(width - 48, 960) : width;
  const gutter = isTablet ? 24 : 16;

  return {
    width,
    height,
    isTablet,
    columns,
    contentMaxWidth,
    gutter,
    gridItemWidth: columns > 1 ? (contentMaxWidth - gutter * (columns - 1)) / columns : contentMaxWidth,
  };
}
