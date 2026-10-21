import { forwardRef, type ComponentRef } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, type AppIconName } from '@/components/ui/icon';
import { color, layout, opacity, radius } from '@/theme';

export type IconButtonTone = 'surface' | 'plain';

export type IconButtonProps = {
  icon: AppIconName;
  /** Icon only controls carry a spoken label, so one is required. */
  label: string;
  onPress: () => void;
  size?: number;
  tone?: IconButtonTone;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const IconButton = forwardRef<ComponentRef<typeof Pressable>, IconButtonProps>(
  function IconButton(
    { icon, label, onPress, size = layout.activePill, tone = 'surface', disabled = false, style },
    ref,
  ) {
    return (
      <Pressable
        ref={ref}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.base,
          { width: size, height: size, borderRadius: radius.pill },
          tone === 'surface' && styles.surface,
          pressed && styles.pressed,
          disabled && styles.disabled,
          style,
        ]}>
        <Icon name={icon} size={size >= layout.controlHeight ? 'lg' : 'sm'} color={color.textPrimary} />
      </Pressable>
    );
  },
);

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  surface: {
    backgroundColor: color.surfaceGray,
  },
  pressed: {
    opacity: opacity.pressed,
  },
  disabled: {
    opacity: opacity.disabled,
  },
});
