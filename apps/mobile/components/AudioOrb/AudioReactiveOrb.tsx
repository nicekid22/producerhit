import { memo } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import type { AIOrbState } from "@/components/AIOrb/types";
import { OrbPlaceholder } from "@/components/AudioOrb/OrbPlaceholder";
import { preferLightweightOrb } from "@/lib/expoRuntime";
import type { GlSlotPriority } from "@/lib/orb/glSlotManager";
import { useGlSlot } from "@/lib/orb/glSlotManager";
import { ThreeAudioOrb } from "@/components/AudioOrb/ThreeAudioOrb";

export type AudioReactiveOrbProps = {
  size: number;
  energy?: AIOrbState | "playing";
  playing?: boolean;
  bpm?: number;
  positionMs?: number;
  enabled?: boolean;
  /** Stop animation when false (off-screen or paused). */
  active?: boolean;
  /** WebGL slot priority — generation / player = critical, cartes = high. */
  glPriority?: GlSlotPriority;
  style?: ViewStyle;
  children?: React.ReactNode;
};

function shouldAnimate(input: {
  active: boolean;
  enabled: boolean;
  playing: boolean;
  energy: AIOrbState | "playing";
}): boolean {
  if (!input.active || !input.enabled) return false;
  if (input.playing) return true;
  return input.energy === "active" || input.energy === "playing";
}

function wantsGlSlot(input: {
  lightweight: boolean;
  active: boolean;
  enabled: boolean;
  glPriority: GlSlotPriority;
}): boolean {
  if (input.lightweight || !input.active) return false;
  if (input.glPriority === "critical") return true;
  return input.enabled;
}

/** Orbe audio-réactif Three.js — slot GL limité pour stabilité Expo Go. */
export const AudioReactiveOrb = memo(function AudioReactiveOrb({
  size,
  energy = "idle",
  playing = false,
  bpm,
  positionMs = 0,
  enabled = true,
  active = true,
  glPriority = "normal",
  style,
  children,
}: AudioReactiveOrbProps) {
  const lightweight = preferLightweightOrb();
  const animating = shouldAnimate({ active, enabled, playing, energy });
  const paused = !animating;
  const wantsSlot = wantsGlSlot({ lightweight, active, enabled, glPriority });
  const hasSlot = useGlSlot(glPriority, wantsSlot);
  const useThree = wantsSlot && hasSlot;

  const wrapStyle = [
    styles.wrap,
    { width: size, height: size },
    size <= 56 ? styles.wrapClip : styles.wrapFloat,
    style,
  ];

  return (
    <View style={wrapStyle}>
      {useThree ? (
        <ThreeAudioOrb
          size={size}
          energy={energy}
          playing={playing}
          bpm={bpm}
          positionMs={positionMs}
          enabled={enabled}
          paused={paused}
        />
      ) : (
        <OrbPlaceholder size={size} />
      )}
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  wrapClip: {
    overflow: "hidden",
    borderRadius: 999,
  },
  wrapFloat: {
    overflow: "visible",
  },
});
