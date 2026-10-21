import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon, type AppIconName } from '@/components/ui/icon';
import { color, iconSize, layout, opacity, radius, spacing } from '@/theme';

export type PolicyCardProps = {
  icon: AppIconName;
  title: string;
  description: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function PolicyCard({ icon, title, description, onPress, style }: PolicyCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}>
      <View style={styles.iconCircle}>
        <Icon name={icon} size="sm" color={color.darkInk} />
      </View>

      <View style={styles.copy}>
        <AppText variant="caption" color="textPrimary">
          {title}
        </AppText>
        <AppText variant="caption" color="textSecondary">
          {description}
        </AppText>
      </View>

      <Icon name="chevron-forward" size={iconSize.sm} color={color.darkInk} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    backgroundColor: color.badgeLavender,
    borderRadius: radius.lg,
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
});
