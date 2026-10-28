import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon, type AppIconName } from '@/components/ui/icon';
import { color, iconSize, layout, opacity, radius, spacing } from '@/theme';

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
      <View style={styles.iconBubble}>
        <Icon name={icon} size={iconSize.sm} color={color.textPrimary} />
      </View>
      <AppText variant="body" style={styles.label}>
        {label}
      </AppText>
      <Icon name="chevron-forward" size={iconSize.sm} color={color.textPrimary} />
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
  iconBubble: {
    width: layout.touchTarget,
    height: layout.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: color.surfaceGray,
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
