import { StyleSheet, Text, TextStyle } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  children: string;
  style?: TextStyle;
};

/** Use sparingly — max 1 per 3 sections (design anti-slop). */
export function PhEyebrow({ children, style }: Props) {
  const { colors, typography } = useTheme();
  return (
    <Text
      style={[
        typography.micro,
        { color: colors.textMuted, letterSpacing: 1.2, textTransform: "uppercase" },
        style,
      ]}
    >
      {children}
    </Text>
  );
}