import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  total: number;
  active: number;
};

export function OnboardingProgressDots({ total, active }: Props) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const anims = useRef(Array.from({ length: total }, () => new Animated.Value(8))).current;

  useEffect(() => {
    anims.forEach((anim, i) => {
      const target = i === active ? 28 : 8;
      if (reduced) {
        anim.setValue(target);
        return;
      }
      Animated.spring(anim, {
        toValue: target,
        friction: 8,
        tension: 120,
        useNativeDriver: false,
      }).start();
    });
  }, [active, anims, reduced]);

  return (
    <View style={styles.row}>
      {anims.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            {
              width: anim,
              backgroundColor: i === active ? colors.accentPrimary : colors.surfaceBorder,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, alignItems: "center" },
  dot: { height: 8, borderRadius: 4 },
});
