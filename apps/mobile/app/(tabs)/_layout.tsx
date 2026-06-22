import { Platform, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AudioPlaybackHost } from "@/components/AudioPlaybackHost";
import { FullPlayerSheet } from "@/components/FullPlayerSheet";
import { MiniPlayer } from "@/components/MiniPlayer";
import { useI18n } from "@/stores/localeStore";
import { useTheme } from "@/theme/ThemeProvider";

type TabIcon = keyof typeof Ionicons.glyphMap;

function tabIcon(name: string, focused: boolean): TabIcon {
  const map: Record<string, TabIcon> = {
    create: focused ? "musical-notes" : "musical-notes-outline",
    library: focused ? "albums" : "albums-outline",
    community: focused ? "globe" : "globe-outline",
    account: focused ? "person-circle" : "person-circle-outline",
  };
  return map[name] ?? "ellipse";
}

export default function TabsLayout() {
  const { t } = useI18n();
  const { colors, material } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBottom = Math.max(insets.bottom, 4);
  const isFlat = material === "flat";
  const tabHeight = isFlat ? 50 : 56;

  return (
    <>
      <AudioPlaybackHost />
      <Tabs
        screenOptions={({ route }) => ({
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.tabInactive,
          tabBarShowLabel: true,
          tabBarLabelStyle: { fontSize: 11, fontWeight: "500", marginBottom: Platform.OS === "ios" ? 0 : 4 },
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={tabIcon(route.name, focused)} size={size - 1} color={color} />
          ),
          tabBarStyle: {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: tabHeight + tabBottom,
            paddingBottom: tabBottom,
            paddingTop: 6,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.tabBarBorder,
            backgroundColor: colors.tabBarBg,
            elevation: 0,
          },
          animation: "none",
        })}
      >
        <Tabs.Screen name="create" options={{ title: t("tabCreate"), tabBarLabel: t("tabCreate"), headerShown: false }} />
        <Tabs.Screen name="library" options={{ title: t("tabLibrary"), tabBarLabel: t("tabLibrary"), headerShown: false }} />
        <Tabs.Screen name="community" options={{ title: t("tabExplore"), tabBarLabel: t("tabExplore"), headerShown: false }} />
        <Tabs.Screen name="account" options={{ title: t("tabAccount"), tabBarLabel: t("tabAccount"), headerShown: false }} />
      </Tabs>
      <MiniPlayer tabBarOffset={tabHeight + tabBottom + 8} />
      <FullPlayerSheet />
    </>
  );
}
