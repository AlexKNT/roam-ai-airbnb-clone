import { forwardRef, type ComponentRef, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon, type AppIconName } from '@/components/ui/icon';
import { color, layout, opacity, radius, spacing } from '@/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: AppIconName;
  /** `edge` pins the icon to the trailing end, as the auth designs show. */
  iconPlacement?: 'inline' | 'edge';
  /** A mark that carries its own artwork, such as a provider logo, shown before the label. */
  leading?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const Button = forwardRef<ComponentRef<typeof View>, ButtonProps>(function Button(
  {
    label,
    onPress,
    variant = 'primary',
    icon,
    iconPlacement = 'inline',
    leading,
    disabled = false,
    loading = false,
    style,
  },
  ref,
) {
  const inactive = disabled || loading;
  const primary = variant === 'primary';
  const ink =
    variant === 'danger' ? color.surface : primary ? color.darkInk : color.textPrimary;

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
        primary ? styles.primary : variant === 'danger' ? styles.danger : styles.secondary,
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
          {leading ?? (icon && !primary ? <Icon name={icon} color={ink} /> : null)}
          <AppText variant="button" style={{ color: ink }}>
            {label}
          </AppText>
          {icon && primary && iconPlacement === 'inline' ? (
            <Icon name={icon} color={ink} />
          ) : null}
          {icon && primary && iconPlacement === 'edge' ? (
            <View style={styles.edgeIcon}>
              <Icon name={icon} color={ink} />
            </View>
          ) : null}
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
  danger: {
    backgroundColor: color.dangerInk,
  },
  pressed: {
    opacity: opacity.pressed,
  },
  inactive: {
    opacity: opacity.disabled,
  },
  edgeIcon: {
    position: 'absolute',
    right: spacing[5],
  },
});
