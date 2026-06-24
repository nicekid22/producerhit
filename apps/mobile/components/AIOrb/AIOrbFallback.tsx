import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { buildOrbMesh, orbMeshDensity, PRISM_MESH } from "@/lib/orb/mesh";
import { useOrbMotion } from "@/lib/reanimated/useOrbMotion";
import { DUSTY } from "@/theme/dustyCloud";
import { useTheme } from "@/theme/ThemeProvider";
import type { AIOrbProps } from "./types";

/** Expo Go / web — mesh particules, fond transparent (Dusty Cloud). */
export function AIOrbFallback({ size, state = "idle", paused = false }: AIOrbProps) {
  const { iris } = useTheme();
  const palette = useMemo(
    () => ({
      ...PRISM_MESH,
      ...(iris.mesh ?? {}),
      rose: iris.mesh?.rose ?? iris.rose ?? PRISM_MESH.rose,
      sky: iris.mesh?.sky ?? iris.sky ?? PRISM_MESH.sky,
      lavender: iris.mesh?.lavender ?? iris.lavender ?? PRISM_MESH.lavender,
      cream: iris.mesh?.cream ?? iris.cream ?? PRISM_MESH.cream,
    }),
    [iris],
  );
  const { rotation, pulse, morph, reduced } = useOrbMotion(state, paused);
  const r = size / 2;

  const mesh = useMemo(() => {
    const d = orbMeshDensity(Math.min(size, 72), state);
    return buildOrbMesh(d.rings, d.segments, palette);
  }, [palette, size, state]);

  const shellStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.04 }],
  }));

  const cloudStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 500 },
      { rotate: `${rotation.value * 360}deg` },
      { rotateX: `${14 + morph.value * 12}deg` },
      { scale: 0.9 + morph.value * 0.08 },
    ],
  }));

  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: r }]}>
      <Animated.View style={[styles.clip, { width: size, height: size, borderRadius: r }, shellStyle]}>
        <LinearGradient
          colors={["transparent", `${palette.rose}33`, `${palette.lavender}22`, "transparent"]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.2, y: 0.1 }}
          end={{ x: 0.85, y: 0.95 }}
        />

        <Animated.View style={[styles.cloud, cloudStyle]}>
          {mesh.map((p, i) => {
            const px = r + p.bx * r * 0.82;
            const py = r + p.by * r * 0.82;
            const dot = Math.max(1.2, size * 0.012 * (0.7 + p.sparkle * 0.5));
            const alpha = reduced ? 0.42 : 0.28 + p.sparkle * 0.48;
            return (
              <View
                key={`${i}-${p.color}`}
                style={[
                  styles.dot,
                  {
                    left: px - dot,
                    top: py - dot,
                    width: dot * 2,
                    height: dot * 2,
                    borderRadius: dot,
                    backgroundColor: p.color,
                    opacity: alpha,
                  },
                ]}
              />
            );
          })}
        </Animated.View>

        <View
          style={[
            styles.coreGlow,
            {
              width: r * 0.7,
              height: r * 0.7,
              borderRadius: r,
              left: r * 0.15,
              top: r * 0.15,
              backgroundColor: `${palette.mid}18`,
            },
          ]}
        />
        <View style={[styles.sheen, { borderRadius: r }]} pointerEvents="none" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", backgroundColor: "transparent" },
  clip: { overflow: "visible", backgroundColor: "transparent" },
  cloud: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: { position: "absolute" },
  coreGlow: { position: "absolute" },
  sheen: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(245,238,248,0.06)",
  },
});
