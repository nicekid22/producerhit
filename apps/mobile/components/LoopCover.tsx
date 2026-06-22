import { Image, StyleSheet, View } from "react-native";
import type { Loop } from "@producerhit/shared";
import { resolveLoopCoverUrl } from "@/lib/loopDisplay";
import { useTheme } from "@/theme/ThemeProvider";
import { radius } from "@/theme/tokens";

type Props = {
  loop: Loop;
  size?: number;
  rounded?: number;
  playing?: boolean;
};

export function LoopCover({ loop, size = 56, rounded = radius.md, playing }: Props) {
  const { colors } = useTheme();
  const uri = resolveLoopCoverUrl(loop);

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: rounded, backgroundColor: colors.surface }}
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        {
          width: size,
          height: size,
          borderRadius: rounded,
          backgroundColor: colors.pillActiveBg,
          borderColor: colors.surfaceBorder,
        },
        playing && { borderColor: colors.accent },
      ]}
    >
      <View style={[styles.innerMark, { backgroundColor: colors.accent, opacity: 0.35 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  innerMark: {
    width: "36%",
    height: "36%",
    borderRadius: 999,
  },
});
