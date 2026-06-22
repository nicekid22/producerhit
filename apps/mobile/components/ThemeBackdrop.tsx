import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  children?: React.ReactNode;
  showWaveform?: boolean;
};

function StudioBackdrop() {
  const { colors } = useTheme();
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]}>
      <View style={[styles.studioLine, { backgroundColor: colors.surfaceBorder }]} />
    </View>
  );
}

function PaperBackdrop() {
  const { colors } = useTheme();
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]}>
      <LinearGradient
        colors={["rgba(196, 92, 38, 0.05)", "transparent", "rgba(180, 140, 90, 0.03)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

function FlatBackdrop() {
  const { colors } = useTheme();
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]} />;
}

export function ThemeBackdrop({ children }: Props) {
  const { material } = useTheme();

  return (
    <View style={styles.root}>
      {material === "studio" ? <StudioBackdrop /> : null}
      {material === "paper" ? <PaperBackdrop /> : null}
      {material === "flat" ? <FlatBackdrop /> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  studioLine: {
    position: "absolute",
    left: 20,
    right: 20,
    top: "36%",
    height: StyleSheet.hairlineWidth,
  },
});
