import { useCallback } from "react";

import { StyleSheet, View } from "react-native";

import { Tabs } from "expo-router";

import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

import { Ionicons } from "@expo/vector-icons";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StudioTabBar } from "@/components/StudioTabBar";

import { AudioPlaybackHost } from "@/components/AudioPlaybackHost";

import { PendingPlayDeepLink } from "@/components/PendingPlayDeepLink";

import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";

import { FullPlayerSheet } from "@/components/FullPlayerSheet";

import { MiniPlayer } from "@/components/MiniPlayer";

import { AtmosphereLayer } from "@/components/ThemeBackdrop";

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
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBottom = Math.max(insets.bottom, 8);
  const floatingTabHeight = 64 + tabBottom;

  const renderTabBar = useCallback((props: BottomTabBarProps) => <StudioTabBar {...props} />, []);

  const screenOptions = useCallback(
    ({ route }: { route: { name: string } }) => ({
      headerStyle: { backgroundColor: "transparent" },
      headerTintColor: colors.text,
      headerShadowVisible: false,
      headerTransparent: true,
      tabBarActiveTintColor: colors.tabActive,
      tabBarInactiveTintColor: colors.tabInactive,
      tabBarShowLabel: false,
      tabBarIcon: ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
        <Ionicons name={tabIcon(route.name, focused)} size={size - 1} color={color} />
      ),
      tabBarStyle: {
        position: "absolute" as const,
        backgroundColor: "transparent",
        borderTopWidth: 0,
        elevation: 0,
        height: floatingTabHeight,
      },
      sceneStyle: { backgroundColor: "transparent" },
      lazy: true,
      freezeOnBlur: false,
      animation: "none" as const,
      detachInactiveScreens: false,
    }),
    [colors.tabActive, colors.tabInactive, colors.text, floatingTabHeight],
  );



  return (

    <View style={styles.shell}>

      <AtmosphereLayer />

      <SectionErrorBoundary
        label="playback"
        fallbackTitle={t("sectionErrorPlaybackTitle")}
        fallbackBody={t("sectionErrorPlaybackBody")}
        retryLabel={t("retry")}
      >
        <AudioPlaybackHost />
        <PendingPlayDeepLink />
        <MiniPlayer tabBarOffset={floatingTabHeight + 12} />
        <FullPlayerSheet />
      </SectionErrorBoundary>

      <Tabs tabBar={renderTabBar} screenOptions={screenOptions}>
        <Tabs.Screen name="create" options={{ title: t("tabCreate"), headerShown: false, lazy: false }} />

        <Tabs.Screen name="library" options={{ title: t("tabLibrary"), headerShown: false, lazy: false }} />

        <Tabs.Screen name="community" options={{ title: t("tabExplore"), headerShown: false }} />

        <Tabs.Screen name="account" options={{ title: t("tabAccount"), headerShown: false }} />

      </Tabs>

    </View>

  );

}



const styles = StyleSheet.create({

  shell: { flex: 1, backgroundColor: "transparent" },

});

