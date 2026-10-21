import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon, type AppIconName } from '@/components/ui/icon';
import { color, layout, opacity, radius, spacing } from '@/theme';

export type ChipTone = 'primary' | 'lavender';

export type ChipProps = {
  label: string;
  selected?: boolean;
  tone?: ChipTone;
  icon?: AppIconName;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function Chip({ label, selected = false, tone = 'lavender', icon, onPress, style }: ChipProps) {
  const background = selected
    ? tone === 'primary'
      ? color.primary
      : color.lavender
    : color.surfaceGray;
  const ink = selected ? color.darkInk : color.textSecondary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: background },
        pressed && styles.pressed,
        style,
      ]}>
      {icon ? <Icon name={icon} size="sm" color={ink} /> : null}
      <AppText variant="caption" style={{ color: ink }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: layout.chipHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: radius.pill,
  },
  pressed: {
    opacity: opacity.pressed,
  },
});
