import { StyleProp, Text, TextStyle } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

type Variant = "display" | "title" | "subtitle" | "body" | "caption" | "micro";

type Props = {
  children: React.ReactNode;
  variant?: Variant;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
};

export function PhDisplay({ children, variant = "display", style, numberOfLines }: Props) {
  const { typography, colors } = useTheme();
  return (
    <Text
      style={[typography[variant], { color: colors.text }, style]}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
}

type LabelProps = {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
};

export function PhLabel({ children, style }: LabelProps) {
  const { typography, colors } = useTheme();
  return (
    <Text style={[typography.caption, { color: colors.textMuted }, style]}>{children}</Text>
  );
}
