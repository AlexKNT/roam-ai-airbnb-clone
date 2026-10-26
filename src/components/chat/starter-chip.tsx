import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { color, iconSize, layout, opacity, radius, spacing } from '@/theme';

export type StarterChipProps = {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export function StarterChip({ label, onPress, style }: StarterChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, pressed && styles.pressed, style]}>
      <Icon name="chatbubble-ellipses-outline" size={iconSize.sm} color={color.textSecondary} />
      <AppText variant="caption">{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: layout.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: color.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.border,
  },
  pressed: {
    opacity: opacity.pressed,
  },
});
