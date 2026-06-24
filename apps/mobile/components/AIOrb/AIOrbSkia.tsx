import { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import {
  Blur,
  Canvas,
  Circle,
  Group,
  RadialGradient,
  vec,
} from "@shopify/react-native-skia";
import { useDerivedValue, type DerivedValue, type SharedValue } from "react-native-reanimated";
import {
  buildOrbMesh,
  computeOrbParticleFrame,
  orbMeshDensity,
  PRISM_MESH,
  type OrbMeshPoint,
  type OrbParticleFrame,
} from "@/lib/orb/mesh";
import { useOrbMotion } from "@/lib/reanimated/useOrbMotion";
import { DUSTY } from "@/theme/dustyCloud";
import { useTheme } from "@/theme/ThemeProvider";
import type { AIOrbProps } from "./types";

const VOID_RGBA = "26,18,32";

function OrbParticleDot({
  index,
  frame,
}: {
  index: number;
  frame: DerivedValue<OrbParticleFrame[]>;
}) {
  const c = useDerivedValue(() => {
    const p = frame.value[index];
    return vec(p?.x ?? -999, p?.y ?? -999);
  });
  const r = useDerivedValue(() => frame.value[index]?.r ?? 0);
  const opacity = useDerivedValue(() => frame.value[index]?.opacity ?? 0);
  const color = useDerivedValue(() => frame.value[index]?.color ?? "#fff");

  return <Circle c={c} r={r} color={color} opacity={opacity} />;
}

const OrbParticleField = memo(function OrbParticleField({
  count,
  frame,
  blur,
}: {
  count: number;
  frame: DerivedValue<OrbParticleFrame[]>;
  blur: number;
}) {
  const indices = useMemo(() => Array.from({ length: count }, (_, i) => i), [count]);
  return (
    <Blur blur={blur}>
      <Group>
        {indices.map((i) => (
          <OrbParticleDot key={i} index={i} frame={frame} />
        ))}
      </Group>
    </Blur>
  );
});

function useOrbFrame(
  mesh: readonly OrbMeshPoint[],
  size: number,
  rotation: SharedValue<number>,
  tilt: SharedValue<number>,
  pulse: SharedValue<number>,
  morph: SharedValue<number>,
  time: SharedValue<number>,
  reduced: boolean,
) {
  return useDerivedValue(() =>
    computeOrbParticleFrame(mesh, size, rotation.value, tilt.value, pulse.value, morph.value, time.value, reduced),
  );
}

export function AIOrbSkia({ size, state = "idle", paused = false }: AIOrbProps) {
  const { iris } = useTheme();
  const { rotation, pulse, morph, time, tilt, reduced } = useOrbMotion(state, paused);
  const r = size / 2;
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
  const { rings, segments } = orbMeshDensity(size, state);
  const mesh = useMemo(() => buildOrbMesh(rings, segments, palette), [rings, segments, palette]);
  const frame = useOrbFrame(mesh, size, rotation, tilt, pulse, morph, time, reduced);

  const particleBlur = state === "active" ? 2.6 : 2;
  const coreBlur = state === "active" ? 12 : 9;

  const coreColors = [
    palette.cream,
    palette.rose,
    palette.sky,
    palette.lavender,
    palette.mid,
    palette.violet,
    `rgba(${VOID_RGBA},0)`,
    "transparent",
  ] as const;

  const voidColors = [`rgba(${VOID_RGBA},0.18)`, `rgba(${VOID_RGBA},0.04)`, "transparent"] as const;

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: r,
        },
      ]}
    >
      <Canvas style={{ width: size, height: size }}>
        <Blur blur={coreBlur}>
          <Circle c={vec(r, r * 0.42)} r={r * 0.78} opacity={state === "active" ? 0.62 : 0.48}>
            <RadialGradient c={vec(r, r * 0.36)} r={r * 0.9} colors={[...coreColors]} />
          </Circle>
        </Blur>

        <Circle c={vec(r, r)} r={r * 0.38} opacity={0.5}>
          <RadialGradient c={vec(r, r)} r={r * 0.48} colors={[...voidColors]} />
        </Circle>

        <OrbParticleField count={mesh.length} frame={frame} blur={particleBlur} />

        {!reduced ? (
          <Blur blur={1.1}>
            <Group blendMode="screen" opacity={0.32}>
              {mesh
                .filter((_, i) => i % 9 === 0)
                .map((p, i) => (
                  <Hotspot key={`h-${i}-${p.color}`} index={i * 9} frame={frame} size={size} />
                ))}
            </Group>
          </Blur>
        ) : null}

        <Circle c={vec(r * 0.36, r * 0.28)} r={Math.max(1.2, r * 0.08)} color="rgba(245,238,248,0.12)" />
      </Canvas>
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: r,
            borderColor: `rgba(${VOID_RGBA},0)`,
          },
        ]}
        pointerEvents="none"
      />
    </View>
  );
}

function Hotspot({ index, frame, size }: { index: number; frame: DerivedValue<OrbParticleFrame[]>; size: number }) {
  const c = useDerivedValue(() => {
    const p = frame.value[index];
    return vec(p?.x ?? -999, p?.y ?? -999);
  });
  const opacity = useDerivedValue(() => {
    const p = frame.value[index];
    if (!p) return 0;
    return Math.min(0.85, p.opacity * 1.25);
  });
  return <Circle c={c} r={Math.max(1.1, size * 0.016)} color={DUSTY.text} opacity={opacity} />;
}

const styles = StyleSheet.create({
  wrap: {
    overflow: "visible",
    backgroundColor: "transparent",
  },
  ring: {
    position: "absolute",
    top: 0,
    left: 0,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
