import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon, type AppIconName } from '@/components/ui/icon';
import { color, iconSize, layout, opacity, radius, spacing } from '@/theme';

export type PolicyCardProps = {
  icon: AppIconName;
  title: string;
  description: string;
  onPress?: () => void;
  /** Set only when the card opens more text of its own; leaves the chevron pointing down. */
  expanded?: boolean;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function PolicyCard({
  icon,
  title,
  description,
  onPress,
  expanded,
  children,
  style,
}: PolicyCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}`}
      accessibilityState={expanded === undefined ? undefined : { expanded }}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}>
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Icon name={icon} size="sm" color={color.darkInk} />
        </View>

        <View style={styles.copy}>
          <AppText variant="subheading" color="textPrimary">
            {title}
          </AppText>
          <AppText variant="caption" color="textSecondary">
            {description}
          </AppText>
        </View>

        <Icon name={expanded ? 'chevron-down' : 'chevron-forward'} size={iconSize.sm} color={color.darkInk} />
      </View>

      {expanded && children ? <View style={styles.body}>{children}</View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing[4],
    backgroundColor: color.badgeLavender,
    borderRadius: radius.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  pressed: {
    opacity: opacity.pressed,
  },
  iconCircle: {
    width: layout.touchTarget,
    height: layout.touchTarget,
    borderRadius: radius.pill,
    backgroundColor: color.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: spacing[1],
  },
  body: {
    marginTop: spacing[3],
  },
});
