import { ReactNode } from "react";
import { StyleProp, ViewStyle } from "react-native";
import { GlassCard } from "@/components/GlassCard";

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
  /** Force glass blur (modals/sheets/tab chrome) */
  glass?: boolean;
  variant?: "default" | "elevated" | "active";
};

export function PhSurface({ children, style, elevated = false, glass = false, variant }: Props) {
  const resolvedVariant = variant ?? (elevated ? "elevated" : "default");
  return (
    <GlassCard style={style} variant={resolvedVariant} forceGlass={glass}>
      {children}
    </GlassCard>
  );
}

/** @deprecated Use PhSurface */
export const GlassSurface = PhSurface;
