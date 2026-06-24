import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BottomTabBar } from "@react-navigation/bottom-tabs";
import { useEffect, useRef, useState } from "react";
import { Animated, LayoutChangeEvent, StyleSheet, View } from "react-native";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useTheme } from "@/theme/ThemeProvider";

export function PhTabBar(props: BottomTabBarProps) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const slide = useRef(new Animated.Value(props.state.index)).current;
  const [barWidth, setBarWidth] = useState(0);

  const tabCount = props.state.routes.length;

  useEffect(() => {
    if (reduced) {
      slide.setValue(props.state.index);
      return;
    }
    Animated.spring(slide, {
      toValue: props.state.index,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, [props.state.index, reduced, slide]);

  const segment = barWidth > 0 ? barWidth / tabCount : 0;
  const indicatorWidth = segment * 0.5;
  const indicatorOffset = segment * 0.25;

  const translateX = slide.interpolate({
    inputRange: props.state.routes.map((_, i) => i),
    outputRange: props.state.routes.map((_, i) => i * segment + indicatorOffset),
  });

  const onLayout = (e: LayoutChangeEvent) => {
    setBarWidth(e.nativeEvent.layout.width);
  };

  return (
    <View onLayout={onLayout}>
      <BottomTabBar {...props} />
      {segment > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicator,
            {
              width: indicatorWidth,
              backgroundColor: colors.accent,
              transform: [{ translateX }],
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  indicator: {
    position: "absolute",
    top: 0,
    height: 2,
    borderRadius: 1,
  },
});
