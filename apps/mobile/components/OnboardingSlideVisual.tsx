import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AIOrb } from "@/components/AIOrb/AIOrb";
import { OnboardingPreviewCard } from "@/components/OnboardingPreviewCard";
import { ThreeAudioBanner } from "@/components/AudioOrb/ThreeAudioBanner";
import { OnboardingPersonalizePanel } from "@/components/OnboardingPersonalizePanel";
import type { StudioMode } from "@/components/StudioModeToggle";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useI18n } from "@/stores/localeStore";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

export type OnboardingSlideId = "welcome" | "beats" | "sync" | "personalize";

type Props = {
  slideId: OnboardingSlideId;
  personalizeMode?: StudioMode;
  personalizeGenre?: string;
  onPersonalizeMode?: (mode: StudioMode) => void;
  onPersonalizeGenre?: (genre: string) => void;
  /** Pause onboarding audio preview when off welcome slide. */
  previewActive?: boolean;
};

const HERO_HEIGHT = 168;

export function OnboardingSlideVisual({
  slideId,
  personalizeMode = "song",
  personalizeGenre = "Melodic Trap",
  onPersonalizeMode,
  onPersonalizeGenre,
  previewActive = false,
}: Props) {
  const { t } = useI18n();
  const { colors, typography, radius } = useTheme();
  const reduced = useReducedMotion();
  const fade = useRef(new Animated.Value(1)).current;
  const rise = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) {
      fade.setValue(1);
      rise.setValue(0);
      return;
    }
    fade.setValue(0);
    rise.setValue(14);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 340, useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start();
  }, [fade, reduced, rise, slideId]);

  const panelStyle = {
    opacity: fade,
    transform: [{ translateY: rise }],
  };

  if (slideId === "welcome") {
    return (
      <Animated.View style={[styles.heroShell, panelStyle]}>
        <View style={[styles.heroFrame, { borderRadius: radius.xl, borderColor: colors.surfaceBorder }]}>
          <ThreeAudioBanner height={HERO_HEIGHT} energy="active" enabled />
          <View style={styles.heroOrb}>
            <AIOrb size={72} state="active" />
          </View>
        </View>
        <Text style={[typography.micro, styles.tagline, { color: colors.pillActiveText }]}>
          {t("onb1Tagline")}
        </Text>
        <OnboardingPreviewCard active={previewActive} />
      </Animated.View>
    );
  }

  if (slideId === "beats") {
    return (
      <Animated.View style={[styles.heroShell, panelStyle]}>
        <View style={[styles.demoCard, { borderRadius: radius.xl, borderColor: colors.surfaceBorder, backgroundColor: colors.bgElevated }]}>
          <View style={[styles.modeRow, { backgroundColor: colors.bgGlass, borderRadius: radius.lg }]}>
            <View style={[styles.modeChip, { borderRadius: radius.md }]}>
              <Ionicons name="mic-outline" size={16} color={colors.textMuted} />
              <Text style={[typography.caption, { color: colors.textMuted }]}>{t("song")}</Text>
            </View>
            <View style={[styles.modeChip, styles.modeChipActive, { borderRadius: radius.md, backgroundColor: colors.accentPrimary }]}>
              <Ionicons name="musical-notes-outline" size={16} color={colors.accentOnPrimary} />
              <Text style={[typography.caption, { color: colors.accentOnPrimary, fontWeight: "700" }]}>{t("typeBeat")}</Text>
            </View>
          </View>
          <View style={styles.bpmRow}>
            {["140", "150", "160"].map((bpm, i) => (
              <View
                key={bpm}
                style={[
                  styles.bpmPill,
                  {
                    borderColor: i === 1 ? colors.pillActiveText : colors.surfaceBorder,
                    borderRadius: radius.pill,
                    backgroundColor: i === 1 ? colors.pillActiveBg : "transparent",
                  },
                ]}
              >
                <Text style={[typography.mono, { color: i === 1 ? colors.pillActiveText : colors.textMuted, fontSize: 12 }]}>
                  {bpm}
                </Text>
              </View>
            ))}
          </View>
          <Text style={[typography.micro, { color: colors.textSubtle, textAlign: "center" }]}>BPM · Key · Mood</Text>
        </View>
      </Animated.View>
    );
  }

  if (slideId === "sync") {
    const tiles = [
      { icon: "phone-portrait-outline" as const, label: "iOS" },
      { icon: "globe-outline" as const, label: "Web" },
      { icon: "albums-outline" as const, label: t("library") },
    ];
    return (
      <Animated.View style={[styles.heroShell, panelStyle]}>
        <View style={[styles.syncCard, { borderRadius: radius.xl, borderColor: colors.surfaceBorder, backgroundColor: colors.bgElevated }]}>
          {tiles.map((item, index) => (
            <View key={item.label} style={styles.syncTileWrap}>
              <View style={[styles.syncTile, { borderColor: colors.surfaceBorder, borderRadius: radius.lg, backgroundColor: colors.bgGlass }]}>
                <Ionicons name={item.icon} size={24} color={colors.pillActiveText} />
                <Text style={[typography.caption, { color: colors.textMuted, marginTop: 8, fontWeight: "600" }]}>
                  {item.label}
                </Text>
              </View>
              {index < tiles.length - 1 ? (
                <View style={[styles.syncConnector, { backgroundColor: colors.pillActiveText }]} />
              ) : null}
            </View>
          ))}
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={panelStyle}>
      <OnboardingPersonalizePanel
        mode={personalizeMode}
        genre={personalizeGenre}
        onModeChange={onPersonalizeMode ?? (() => undefined)}
        onGenreChange={onPersonalizeGenre ?? (() => undefined)}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  heroShell: { gap: spacing.md, alignItems: "center" },
  heroFrame: {
    width: "100%",
    height: HERO_HEIGHT,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
  },
  heroOrb: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  },
  tagline: { letterSpacing: 1.4, fontWeight: "600" },
  demoCard: {
    width: "100%",
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  modeRow: { flexDirection: "row", padding: 4, gap: 4 },
  modeChip: { flex: 1, paddingVertical: 14, alignItems: "center", gap: 6, flexDirection: "row", justifyContent: "center" },
  modeChipActive: {},
  bpmRow: { flexDirection: "row", justifyContent: "center", gap: 10 },
  bpmPill: { paddingHorizontal: 16, paddingVertical: 8, borderWidth: StyleSheet.hairlineWidth, minWidth: 64, alignItems: "center" },
  syncCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  syncTileWrap: { flex: 1, flexDirection: "row", alignItems: "center" },
  syncTile: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  syncConnector: {
    width: 12,
    height: 2,
    opacity: 0.45,
    marginHorizontal: -2,
  },
});
