import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { profileCopy } from '@/constants/copy';
import { color, iconSize, opacity, radius, spacing } from '@/theme';

export function CancellationBanner({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${profileCopy.cancellationTitle}. ${profileCopy.cancellationDescription}`}
      accessibilityHint={profileCopy.policiesLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.banner, pressed && styles.pressed]}>
      <Icon name="document-text-outline" size={iconSize.md} color={color.lavender} />

      <View style={styles.copy}>
        <AppText variant="button">{profileCopy.cancellationTitle}</AppText>
        <AppText variant="caption" color="textSecondary">
          {profileCopy.cancellationDescription}
        </AppText>
      </View>

      <Icon name="chevron-forward" size={iconSize.sm} color={color.lavender} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radius.xl,
    backgroundColor: color.badgeLavender,
  },
  copy: {
    flex: 1,
    gap: spacing[1],
  },
  pressed: {
    opacity: opacity.pressed,
  },
});
