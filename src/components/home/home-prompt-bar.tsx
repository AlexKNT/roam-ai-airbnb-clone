import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { homeCopy } from '@/constants/copy';
import { color, iconSize, layout, opacity, radius, spacing } from '@/theme';

export function HomePromptBar({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={homeCopy.promptLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.bar, pressed && styles.pressed]}>
      <Icon name="sparkles-outline" size={iconSize.sm} color={color.darkInk} />
      <AppText variant="caption" color="darkInk" numberOfLines={1} style={styles.text}>
        {homeCopy.prompt}
      </AppText>
      <View style={styles.action}>
        <Icon name="arrow-top-right" size={iconSize.md} color={color.darkInk} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: layout.promptBarHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingLeft: spacing[4],
    paddingRight: spacing[1],
    borderRadius: radius.pill,
    backgroundColor: color.lavender,
  },
  pressed: {
    opacity: opacity.pressed,
  },
  text: {
    flex: 1,
  },
  action: {
    width: layout.activePill,
    height: layout.activePill,
    borderRadius: radius.pill,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
