import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon, type AppIconName } from '@/components/ui/icon';
import { color, iconSize, layout, opacity, spacing } from '@/theme';

export type ProfileRowProps = {
  icon: AppIconName;
  label: string;
  onPress?: () => void;
  /** The last row drops its trailing separator. */
  last?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ProfileRow({ icon, label, onPress, last = false, style }: ProfileRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !last && styles.separator,
        pressed && styles.pressed,
        style,
      ]}>
      <Icon name={icon} size={iconSize.sm} color={color.textPrimary} />
      <AppText variant="body" style={styles.label}>
        {label}
      </AppText>
      <Icon name="chevron-forward" size={iconSize.sm} color={color.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: layout.controlHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  label: {
    flex: 1,
  },
  pressed: {
    opacity: opacity.pressed,
  },
});
