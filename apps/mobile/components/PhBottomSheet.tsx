import { ReactNode, useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { GlassSurface } from "@/components/GlassSurface";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

const DISMISS_DRAG = 88;
const DISMISS_VELOCITY = 0.45;

type Props = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  maxHeight?: `${number}%`;
  /** When false, children manage their own scroll (e.g. SectionList). */
  scrollable?: boolean;
};

function parseHeightPercent(maxHeight: string, windowH: number): number {
  const match = /^(\d+(?:\.\d+)?)%$/.exec(maxHeight);
  if (match) return Math.round(windowH * (Number(match[1]) / 100));
  return Math.round(windowH * 0.88);
}

export function PhBottomSheet({ visible, onClose, children, maxHeight = "88%", scrollable = true }: Props) {
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors, radius, glass } = useTheme();
  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  const useGlass = glass != null;

  const sheetHeight = useMemo(() => parseHeightPercent(maxHeight, windowHeight), [maxHeight, windowHeight]);

  const dragY = useRef(new Animated.Value(0)).current;
  const closingRef = useRef(false);

  useEffect(() => {
    if (!visible) return;
    closingRef.current = false;
    if (reduced) {
      dragY.setValue(0);
      return;
    }
    dragY.setValue(sheetHeight * 0.35);
    Animated.spring(dragY, {
      toValue: 0,
      useNativeDriver: true,
      damping: 22,
      stiffness: 220,
    }).start();
  }, [visible, dragY, reduced, sheetHeight]);

  const dismissSheet = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (reduced) {
      onClose();
      return;
    }
    Animated.timing(dragY, {
      toValue: sheetHeight,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      onClose();
      dragY.setValue(0);
      closingRef.current = false;
    });
  };

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        !reducedRef.current && g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) dragY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > DISMISS_DRAG || g.vy > DISMISS_VELOCITY) {
          dismissSheet();
          return;
        }
        Animated.spring(dragY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
        }).start();
      },
    }),
  ).current;

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]} onPress={onClose} />
        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              paddingBottom: insets.bottom + spacing.md,
              backgroundColor: useGlass ? "transparent" : colors.bgElevated,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              borderColor: colors.surfaceBorder,
              transform: [{ translateY: dragY }],
            },
          ]}
        >
          {useGlass ? (
            <GlassSurface
              intensity={glass!.blur}
              tint="dark"
              fallbackColor={colors.bgGlass}
              highlight={glass!.highlight}
            />
          ) : null}

          <View style={styles.dragZone} {...pan.panHandlers}>
            <View style={[styles.handle, { backgroundColor: colors.textSubtle }]} />
          </View>

          {scrollable ? (
            <ScrollView
              style={styles.scrollBody}
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
          ) : (
            <View style={styles.contentFlex}>{children}</View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    width: "100%",
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
    overflow: "hidden",
  },
  dragZone: {
    alignItems: "center",
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  scrollBody: {
    flex: 1,
    minHeight: 0,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  contentFlex: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
});
