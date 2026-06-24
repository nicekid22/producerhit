import { StyleSheet, View } from "react-native";

/** Espace réservé transparent — en attente du contexte WebGL Three.js. */
export function OrbPlaceholder({ size }: { size: number }) {
  return <View style={[styles.root, { width: size, height: size, borderRadius: size / 2 }]} />;
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: "transparent",
  },
});
