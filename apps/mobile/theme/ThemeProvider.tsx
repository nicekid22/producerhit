import { createContext, useContext, useMemo, type ReactNode } from "react";
import { getThemeTokens } from "./index";
import type { ThemeTokens } from "./types";
import { useVisualThemeStore } from "@/stores/visualThemeStore";

const ThemeContext = createContext<ThemeTokens>(getThemeTokens("prism"));

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useVisualThemeStore((s) => s.theme);
  const tokens = useMemo(() => getThemeTokens(theme), [theme]);
  return <ThemeContext.Provider value={tokens}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeTokens {
  return useContext(ThemeContext);
}
