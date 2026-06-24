import type { ColorValue } from "react-native";
import type { ThemeIris } from "./types";

/** LinearGradient requires at least two color stops. */
export function irisGradientColors(colors: readonly string[]): readonly [ColorValue, ColorValue, ...ColorValue[]] {
  const a = colors[0] ?? "#F4B8C8";
  const b = colors[1] ?? "#A9D4F5";
  const rest = colors.slice(2);
  return [a, b, ...rest] as readonly [ColorValue, ColorValue, ...ColorValue[]];
}

/** Prism mesh CTA — palette studio complète */
export function meshGradientColors(iris: ThemeIris): readonly [ColorValue, ColorValue, ...ColorValue[]] {
  if (iris.mesh) {
    const m = iris.mesh;
    return [
      m.cream ?? m.gold,
      m.rose ?? iris.rose,
      m.sky ?? iris.sky,
      m.lavender ?? iris.lavender,
      m.gold,
      m.violet,
      m.base,
    ] as const;
  }
  return irisGradientColors(iris.gradient);
}

export function gradientPair(colors: readonly string[]): readonly [ColorValue, ColorValue] {
  return [colors[0] ?? "#121214", colors[1] ?? colors[0] ?? "#121214"] as const;
}
