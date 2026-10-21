import { forwardRef, type ComponentRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon, type AppIconName } from '@/components/ui/icon';
import { color, layout, opacity, radius, spacing } from '@/theme';

export type ButtonVariant = 'primary' | 'secondary';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: AppIconName;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const Button = forwardRef<ComponentRef<typeof View>, ButtonProps>(function Button(
  { label, onPress, variant = 'primary', icon, disabled = false, loading = false, style },
  ref,
) {
  const inactive = disabled || loading;
  const primary = variant === 'primary';
  const ink = primary ? color.darkInk : color.textPrimary;

  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        primary ? styles.primary : styles.secondary,
        pressed && styles.pressed,
        inactive && styles.inactive,
        style,
      ]}>
      {loading ? (
        <>
          <ActivityIndicator color={ink} />
          <AppText variant="button" style={{ color: ink }}>
            {label}
          </AppText>
        </>
      ) : (
        <>
          {icon && !primary ? <Icon name={icon} color={ink} /> : null}
          <AppText variant="button" style={{ color: ink }}>
            {label}
          </AppText>
          {icon && primary ? <Icon name={icon} color={ink} /> : null}
        </>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  base: {
    height: layout.controlHeight,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[6],
  },
  primary: {
    backgroundColor: color.primary,
  },
  secondary: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
  },
  pressed: {
    opacity: opacity.pressed,
  },
  inactive: {
    opacity: opacity.disabled,
  },
});
