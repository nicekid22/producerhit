import { memo } from "react";
import { StyleSheet, TextInput, TextInputProps, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PhCard } from "@/components/PhCard";
import { useTheme } from "@/theme/ThemeProvider";

type Props = TextInputProps & {
  icon?: keyof typeof Ionicons.glyphMap;
};

/** Champ recherche — surface solide Dusty (pas de blur scroll). */
export const SearchGlassField = memo(function SearchGlassField({
  icon = "search",
  style,
  ...rest
}: Props) {
  const { colors, typography, radius } = useTheme();

  return (
    <PhCard elevated={false} style={[styles.wrap, { borderRadius: radius.lg }]}>
      <View style={styles.row}>
        <Ionicons name={icon} size={18} color={colors.textSubtle} style={styles.icon} />
        <TextInput
          {...rest}
          placeholderTextColor={colors.textSubtle}
          style={[typography.body, styles.input, { color: colors.text }, style]}
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
      </View>
    </PhCard>
  );
});

const styles = StyleSheet.create({
  wrap: { padding: 0, marginTop: 4 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    minHeight: 48,
  },
  icon: { marginRight: 8 },
  input: {
    flex: 1,
    paddingVertical: 12,
  },
});
