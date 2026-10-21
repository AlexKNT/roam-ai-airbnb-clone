import { Ionicons } from '@expo/vector-icons';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import { tabItems } from '@/constants/copy';
import { color, elevation, iconSize, layout, opacity, radius, spacing } from '@/theme';

const KEYBOARD_ANIMATION_MS = 220;

export function TabBar({ state, insets, emitter, navigateToTab }: BottomTabBarProps) {
  const { height: windowHeight } = useWindowDimensions();
  const translateY = useSharedValue(0);

  const [glassAvailable] = useState(() => Platform.OS === 'ios' && isLiquidGlassAvailable());
  const [reduceTransparency, setReduceTransparency] = useState(false);

  useEffect(() => {
    if (!glassAvailable) return;
    if (typeof AccessibilityInfo.isReduceTransparencyEnabled !== 'function') return;

    let active = true;

    AccessibilityInfo.isReduceTransparencyEnabled()
      .then((enabled) => {
        if (active) setReduceTransparency(enabled);
      })
      .catch(() => {});

    const subscription = AccessibilityInfo.addEventListener('reduceTransparencyChanged', (enabled) => {
      setReduceTransparency(enabled);
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, [glassAvailable]);

  const barBottom = insets.bottom + layout.tabBarFloat;
  const hideDistance = layout.tabBarHeight + barBottom + spacing[2];

  useEffect(() => {
    if (Platform.OS === 'web') return;

    // The navigator's `tabBarHideOnKeyboard` never reaches a custom bar, so the
    // bar listens to the keyboard itself.
    if (Platform.OS === 'ios') {
      const subscription = Keyboard.addListener('keyboardWillChangeFrame', (event) => {
        const covered = windowHeight - event.endCoordinates.screenY;
        translateY.value = withTiming(covered > 0 ? hideDistance : 0, {
          duration: KEYBOARD_ANIMATION_MS,
        });
      });

      return () => subscription.remove();
    }

    const show = Keyboard.addListener('keyboardDidShow', () => {
      translateY.value = withTiming(hideDistance, { duration: KEYBOARD_ANIMATION_MS });
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      translateY.value = withTiming(0, { duration: KEYBOARD_ANIMATION_MS });
    });

    return () => {
      show.remove();
      hide.remove();
    };
  }, [hideDistance, translateY, windowHeight]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const useGlass = glassAvailable && !reduceTransparency;

  const tabs = state.routes.map((route, index) => {
    const item = tabItems.find((tab) => tab.route === route.name) ?? tabItems[index];
    const focused = state.index === index;
    const iconName = focused ? item.activeIcon : item.icon;

    const onPress = () => {
      const event = emitter.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!focused && !event.defaultPrevented) navigateToTab(route.key);
    };

    const onLongPress = () => {
      emitter.emit({ type: 'tabLongPress', target: route.key });
    };

    return (
      <Pressable
        key={route.key}
        accessibilityRole="tab"
        accessibilityLabel={item.label}
        accessibilityState={{ selected: focused }}
        aria-selected={focused}
        onPress={onPress}
        onLongPress={onLongPress}
        style={({ pressed }) => [styles.tab, pressed && styles.pressed]}>
        <View style={[styles.iconCircle, focused && styles.iconCircleActive]}>
          <Ionicons
            name={iconName}
            size={iconSize.md}
            color={focused ? color.darkInk : color.textSecondary}
          />
        </View>
        <AppText variant="label" color={focused ? 'textPrimary' : 'textSecondary'}>
          {item.label}
        </AppText>
      </Pressable>
    );
  });

  return (
    <View
      style={[styles.root, { paddingBottom: barBottom }]}
      pointerEvents="box-none">
      <Animated.View
        style={[styles.wrapper, elevation.floating, !useGlass && styles.wrapperSolid, animatedStyle]}>
        {useGlass ? (
          <GlassView glassEffectStyle="regular" colorScheme="light" style={styles.bar}>
            <View style={styles.row} role="tablist">
              {tabs}
            </View>
          </GlassView>
        ) : (
          <View style={styles.bar}>
            <View style={styles.glassTint} pointerEvents="none" />
            <View style={styles.row} role="tablist">
              {tabs}
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: layout.screenGutter,
  },
  wrapper: {
    height: layout.tabBarHeight,
    borderRadius: radius.pill,
  },
  wrapperSolid: {
    backgroundColor: color.surface,
  },
  bar: {
    flex: 1,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  glassTint: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: color.glass,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: spacing[2],
  },
  tab: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    minHeight: layout.touchTarget,
  },
  pressed: {
    opacity: opacity.pressed,
  },
  iconCircle: {
    width: layout.activePill,
    height: layout.activePill,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleActive: {
    backgroundColor: color.primary,
  },
});
