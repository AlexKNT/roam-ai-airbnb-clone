import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, layout, spacing } from '@/theme';

export type ScreenProps = {
  children: ReactNode;
  /** The bar is dismissed with the keyboard, but the content still scrolls. */
  scroll?: boolean;
  /** `tabBar` keeps content clear of the floating bar. Pass `none` when the bar is absent. */
  bottomInset?: 'tabBar' | 'none';
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export function useScreenBottomPadding(bottomInset: ScreenProps['bottomInset'] = 'tabBar') {
  const insets = useSafeAreaInsets();

  if (bottomInset === 'none') return insets.bottom;

  return insets.bottom + layout.tabBarHeight + layout.tabBarFloat;
}

export function Screen({
  children,
  scroll = true,
  bottomInset = 'tabBar',
  style,
  contentContainerStyle,
}: ScreenProps) {
  const bottomPadding = useScreenBottomPadding(bottomInset);
  const contentStyle = [
    styles.content,
    { paddingBottom: bottomPadding },
    contentContainerStyle,
  ];

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.root, style]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={contentStyle}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={contentStyle}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: color.surfaceGray,
  },
  content: {
    flexGrow: 1,
    paddingTop: spacing[6],
    paddingHorizontal: layout.screenGutter,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
  },
});
