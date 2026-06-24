import { memo, useCallback, useEffect, useRef, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GLView, type ExpoWebGLRenderingContext } from "expo-gl";
import type { AIOrbState } from "@/components/AIOrb/types";
import { preferLightweightOrb } from "@/lib/expoRuntime";
import { useGlSlot } from "@/lib/orb/glSlotManager";
import { sampleAudioLevels } from "@/lib/orb/audioLevels";
import { createAudioBannerScene, type AudioBannerScene } from "@/lib/orb/threeBannerScene";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  height?: number;
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
  width: number;
  height: number;
};

const DEFAULT_HEIGHT = 76;

/** Bannière Three.js pleine largeur — flux IA / réaction audio. */
export const ThreeAudioBanner = memo(function ThreeAudioBanner({
  height = DEFAULT_HEIGHT,
  energy = "idle",
  playing = false,
  bpm,
  positionMs = 0,
  enabled = true,
  paused = false,
}: Props) {
  const { iris } = useTheme();
  const lightweight = preferLightweightOrb();
  const wantsSlot = !lightweight && enabled && !paused;
  const hasSlot = useGlSlot("low", wantsSlot);
  const [width, setWidth] = useState(0);
  const sceneRef = useRef<AudioBannerScene | null>(null);
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
    width: 0,
    height,
  });

  propsRef.current = { enabled, playing, bpm, positionMs, energy, paused, width, height };

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const w = Math.floor(e.nativeEvent.layout.width);
    if (w > 0 && w !== width) setWidth(w);
  }, [width]);

  const stopLoop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const bootScene = useCallback(
    (gl: ExpoWebGLRenderingContext, w: number, h: number) => {
      sceneRef.current?.dispose();
      sceneRef.current = createAudioBannerScene(gl, w, h);
      glRef.current = gl;
    },
    [],
  );

  useEffect(() => {
    if (!glRef.current || width <= 0) return;
    bootScene(glRef.current, width, height);
    sceneRef.current?.setSize(width, height);
  }, [width, height, bootScene]);

  const onContextCreate = useCallback(
    (gl: ExpoWebGLRenderingContext) => {
      stopLoop();
      glRef.current = gl;
      const p = propsRef.current;
      if (p.width > 0) bootScene(gl, p.width, p.height);

      const tick = () => {
        const scene = sceneRef.current;
        if (!scene) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }

        const cur = propsRef.current;
        if (cur.paused) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }

        demoTRef.current += 0.018;
        frameRef.current += 1;

        const skiaEnergy: "idle" | "active" | "playing" =
          cur.energy === "playing" || cur.playing ? "playing" : cur.energy === "active" ? "active" : "idle";

        const levels = sampleAudioLevels({
          enabled: cur.enabled && !cur.paused,
          playing: cur.playing && !cur.paused,
          bpm: cur.bpm,
          positionMs: cur.positionMs,
          demoT: demoTRef.current,
          energy: skiaEnergy,
        });
        scene.render(levels, frameRef.current);
        rafRef.current = requestAnimationFrame(tick);
      };

      tick();
    },
    [bootScene, stopLoop],
  );

  useEffect(() => {
    return () => {
      stopLoop();
      sceneRef.current?.dispose();
      sceneRef.current = null;
      glRef.current = null;
    };
  }, [stopLoop]);

  if (lightweight || !hasSlot) {
    return (
      <View style={[styles.wrap, { height }]} onLayout={onLayout}>
        <LinearGradient
          colors={[
            `${iris.rose}44`,
            `${iris.lavender}33`,
            `${iris.sky}22`,
            "transparent",
          ]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { height }]} onLayout={onLayout}>
      {width > 0 ? (
        <GLView style={[styles.gl, { width, height }]} onContextCreate={onContextCreate} />
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    overflow: "hidden",
  },
  gl: {
    flex: 1,
  },
});
