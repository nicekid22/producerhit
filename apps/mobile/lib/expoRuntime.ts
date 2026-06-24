import Constants from "expo-constants";
import { Platform } from "react-native";

/** True when running inside Expo Go (no dev client). */
export function isExpoGo(): boolean {
  return Constants.appOwnership === "expo";
}

/** Skia/gradient fallback — web only (pas de expo-gl fiable). */
export function preferLightweightOrb(): boolean {
  return Platform.OS === "web";
}
