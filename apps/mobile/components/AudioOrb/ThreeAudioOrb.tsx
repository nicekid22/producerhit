import { memo, useCallback, useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { GLView, type ExpoWebGLRenderingContext } from "expo-gl";
import type { AIOrbState } from "@/components/AIOrb/types";
import { sampleAudioLevels } from "@/lib/orb/audioLevels";
import { createAudioOrbScene, type AudioOrbScene } from "@/lib/orb/threeScene";

type Props = {
  size: number;
  energy?: AIOrbState | "playing";
  playing?: boolean;
  bpm?: number;
  positionMs?: number;
  enabled?: boolean;
  paused?: boolean;
};

type LoopProps = {
  enabled: boolean;
  playing: boolean;
  bpm?: number;
  positionMs: number;
  energy: AIOrbState | "playing";
  paused: boolean;
};

/** Orbe 3D premium — icosa + displacement + particules + anneau (expo-gl + Three.js). */
export const ThreeAudioOrb = memo(function ThreeAudioOrb({
  size,
  energy = "idle",
  playing = false,
  bpm,
  positionMs = 0,
  enabled = true,
  paused = false,
}: Props) {
  const sceneRef = useRef<AudioOrbScene | null>(null);
  const frameRef = useRef(0);
  const demoTRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const glRef = useRef<ExpoWebGLRenderingContext | null>(null);
  const propsRef = useRef<LoopProps>({
    enabled,
    playing,
    bpm,
    positionMs,
    energy,
    paused,
  });

  propsRef.current = { enabled, playing, bpm, positionMs, energy, paused };

  const stopLoop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const disposeScene = useCallback(() => {
    stopLoop();
    sceneRef.current?.dispose();
    sceneRef.current = null;
    glRef.current = null;
  }, [stopLoop]);

  const onContextCreate = useCallback(
    (gl: ExpoWebGLRenderingContext) => {
      disposeScene();
      glRef.current = gl;
      sceneRef.current = createAudioOrbScene(gl, size, size, size);

      const tick = () => {
        const scene = sceneRef.current;
        if (!scene) return;

        const p = propsRef.current;
        if (p.paused) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }

        demoTRef.current += 0.018;
        frameRef.current += 1;

        const skiaEnergy: "idle" | "active" | "playing" =
          p.energy === "playing" || p.playing ? "playing" : p.energy === "active" ? "active" : "idle";

        const levels = sampleAudioLevels({
          enabled: p.enabled && !p.paused,
          playing: p.playing && !p.paused,
          bpm: p.bpm,
          positionMs: p.positionMs,
          demoT: demoTRef.current,
          energy: skiaEnergy,
        });
        scene.render(levels, frameRef.current);

        rafRef.current = requestAnimationFrame(tick);
      };

      tick();
    },
    [disposeScene, size],
  );

  useEffect(() => {
    return () => disposeScene();
  }, [disposeScene]);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <GLView
        key={`orb-gl-${size}`}
        style={[styles.gl, { width: size, height: size }]}
        onContextCreate={onContextCreate}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    overflow: "visible",
    backgroundColor: "transparent",
  },
  gl: {
    borderRadius: 999,
    overflow: "hidden",
  },
});
