import { memo, useCallback } from "react";

import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

import { Pressable, StyleSheet, View } from "react-native";

import * as Haptics from "expo-haptics";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/theme/ThemeProvider";



const TAB_ORDER = ["create", "library", "community", "account"] as const;



type TabButtonProps = {
  routeKey: string;
  focused: boolean;
  color: string;
  onPress: () => void;
  icon: BottomTabBarProps["descriptors"][string]["options"]["tabBarIcon"];
};



const TabButton = memo(function TabButton({ focused, color, onPress, icon }: TabButtonProps) {
  const handlePress = useCallback(() => {
    onPress();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [onPress]);

  return (
    <Pressable
      onPress={handlePress}
      style={styles.tab}
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
    >
      {icon?.({ focused, color, size: 24 })}
    </Pressable>
  );
});



export const StudioTabBar = memo(function StudioTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, glass } = useTheme();
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 8);

  const routes = TAB_ORDER.map((name) => state.routes.find((r) => r.name === name)).filter(Boolean) as typeof state.routes;
  const activeRouteName = state.routes[state.index]?.name;



  return (
    <View style={[styles.outer, { paddingBottom: bottom }]} pointerEvents="box-none">
      <View style={[styles.bar, { borderColor: glass?.border ?? colors.tabBarBorder, backgroundColor: colors.tabBarBg }]}>
        {routes.map((route) => {
          const focused = activeRouteName === route.name;
          const { options } = descriptors[route.key];
          const color = focused ? colors.tabActive : colors.tabInactive;

          const onPress = () => {
            if (focused) return;
            const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (event.defaultPrevented) return;
            navigation.navigate(route.name);
          };

          return (
            <TabButton
              key={route.key}
              routeKey={route.key}
              focused={focused}
              color={color}
              onPress={onPress}
              icon={options.tabBarIcon}
            />
          );
        })}
      </View>
    </View>
  );
});



const styles = StyleSheet.create({
  outer: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 0,
    paddingBottom: 0,
    zIndex: 100,
    elevation: 100,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    paddingVertical: 10,
    paddingHorizontal: 8,
    minHeight: 56,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },
});
