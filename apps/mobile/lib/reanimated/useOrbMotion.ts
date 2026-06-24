import { useEffect } from "react";
import { Easing, useSharedValue, withRepeat, withTiming, cancelAnimation } from "react-native-reanimated";
import { useReducedMotion } from "@/lib/useReducedMotion";

export type OrbState = "idle" | "active";

const IDLE_ROTATION_MS = 25000;
const ACTIVE_ROTATION_MS = 14000;
const PULSE_MS = 3500;

export function useOrbMotion(state: OrbState, paused = false) {
  const reduced = useReducedMotion();
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(0);
  const morph = useSharedValue(0);
  /** Continuous phase for noise / turbulence (0–1 loop). */
  const time = useSharedValue(0);
  const tilt = useSharedValue(0);

  useEffect(() => {
    if (reduced || paused) {
      cancelAnimation(rotation);
      cancelAnimation(pulse);
      cancelAnimation(morph);
      cancelAnimation(time);
      cancelAnimation(tilt);
      rotation.value = 0;
      pulse.value = 0.5;
      morph.value = 0.5;
      time.value = 0.35;
      tilt.value = 0.5;
      return;
    }

    const rotDuration = state === "active" ? ACTIVE_ROTATION_MS : IDLE_ROTATION_MS;
    const timeDuration = state === "active" ? 9000 : 16000;
    rotation.value = 0;
    rotation.value = withRepeat(
      withTiming(1, { duration: rotDuration, easing: Easing.linear }),
      -1,
      false,
    );

    time.value = withRepeat(
      withTiming(1, { duration: timeDuration, easing: Easing.linear }),
      -1,
      false,
    );

    tilt.value = withRepeat(
      withTiming(1, { duration: state === "active" ? 5200 : 11000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );

    pulse.value = withRepeat(
      withTiming(1, { duration: PULSE_MS, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );

    morph.value = withRepeat(
      withTiming(1, {
        duration: state === "active" ? 1800 : 3800,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true,
    );

    return () => {
      cancelAnimation(rotation);
      cancelAnimation(pulse);
      cancelAnimation(morph);
      cancelAnimation(time);
      cancelAnimation(tilt);
    };
  }, [morph, paused, pulse, reduced, rotation, state, time, tilt]);

  return { rotation, pulse, morph, time, tilt, reduced };
}
