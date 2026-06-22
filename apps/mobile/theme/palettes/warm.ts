import { Platform } from "react-native";
import { motionTokens } from "../motion";
import type { ThemeTokens } from "../types";

const warmSerif = Platform.select({ ios: "Georgia", android: "serif", default: "serif" });

/** Warm — editorial vinyl on warm paper. Serif display, tinted shadows. */
export const warmTheme: ThemeTokens = {
  theme: "warm",
  material: "paper",
  colors: {
    bg: "#f7f2ea",
    bgElevated: "#fffdf8",
    bgGlass: "rgba(255, 253, 248, 0.94)",
    surface: "#fffdf8",
    surfaceBorder: "rgba(28, 25, 23, 0.1)",
    text: "#1c1917",
    textMuted: "#57534e",
    textSubtle: "#78716c",
    accent: "#c45c26",
    accentSolid: "#b8521f",
    accentGradient: ["#d47038", "#c45c26"],
    pillActiveBg: "rgba(196, 92, 38, 0.14)",
    pillActiveText: "#7c2d12",
    success: "#15803d",
    warning: "#b45309",
    danger: "#dc2626",
    tabInactive: "#a8a29e",
    tabBarBg: "#fffdf8",
    tabBarBorder: "rgba(28, 25, 23, 0.08)",
    overlay: "rgba(28, 25, 23, 0.45)",
    shadow: "rgba(120, 70, 40, 0.12)",
    logoBase: "#292524",
    logoAccent: "#c45c26",
    statusBar: "dark",
    seekTrack: "rgba(28, 25, 23, 0.1)",
    seekFill: "#c45c26",
  },
  typography: {
    display: {
      fontSize: 34,
      fontWeight: "400",
      letterSpacing: -0.5,
      lineHeight: 40,
      fontFamily: warmSerif,
    },
    title: { fontSize: 22, fontWeight: "600", letterSpacing: -0.2, fontFamily: warmSerif },
    subtitle: { fontSize: 17, fontWeight: "600" },
    body: { fontSize: 16, fontWeight: "400", lineHeight: 24 },
    caption: { fontSize: 13, fontWeight: "500", lineHeight: 19 },
    micro: { fontSize: 11, fontWeight: "600", letterSpacing: 0.4 },
    mono: { fontSize: 13, fontWeight: "500", fontVariant: ["tabular-nums"] },
    displayFontFamily: warmSerif,
  },
  radius: { sm: 6, md: 10, lg: 14, xl: 18, cover: 8, pill: 999 },
  elevation: {
    card: {
      shadowColor: "#8b5a2b",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 3,
    },
  },
  motion: {
    pressScale: motionTokens.pressScale,
    pressDuration: motionTokens.pressDuration,
    modalDuration: motionTokens.modalDuration,
  },
  glass: null,
};
