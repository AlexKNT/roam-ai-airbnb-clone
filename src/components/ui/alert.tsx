import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { color, iconSize, opacity, radius, spacing } from '@/theme';

export type AlertTone = 'success' | 'error';

export type AlertProps = {
  tone: AlertTone;
  message: string;
  onDismiss?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function Alert({ tone, message, onDismiss, style }: AlertProps) {
  const success = tone === 'success';

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.alert, success ? styles.success : styles.error, style]}>
      <Icon
        name={success ? 'checkmark-circle' : 'alert-circle'}
        size={iconSize.sm}
        color={success ? color.successInk : color.dangerInk}
      />

      <AppText variant="caption" style={[styles.message, { color: success ? color.successInk : color.dangerInk }]}>
        {message}
      </AppText>

      {onDismiss ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss message"
          onPress={onDismiss}
          hitSlop={spacing[2]}
          style={({ pressed }) => pressed && styles.pressed}>
          <Icon name="close" size={iconSize.sm} color={success ? color.successInk : color.dangerInk} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radius.md,
  },
  success: {
    backgroundColor: color.successSurface,
  },
  error: {
    backgroundColor: color.dangerSurface,
  },
  message: {
    flex: 1,
  },
  pressed: {
    opacity: opacity.pressed,
  },
});
