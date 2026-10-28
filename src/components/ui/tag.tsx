import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon, type AppIconName } from '@/components/ui/icon';
import { color, radius, spacing } from '@/theme';

export type TagTone = 'neutral' | 'lavender' | 'mint' | 'blush' | 'sky';

export type TagProps = {
  label: string;
  tone?: TagTone;
  icon?: AppIconName;
  /** The icon takes the badge's own colour by default. */
  iconColor?: string;
  style?: StyleProp<ViewStyle>;
};

const toneSurface: Record<TagTone, string> = {
  neutral: color.surfaceGray,
  lavender: color.badgeLavender,
  mint: color.badgeMint,
  blush: color.badgeBlush,
  sky: color.badgeSky,
};

export function Tag({ label, tone = 'neutral', icon, iconColor, style }: TagProps) {
  const ink = tone === 'neutral' ? color.textSecondary : color.darkInk;

  return (
    <View style={[styles.tag, { backgroundColor: toneSurface[tone] }, style]}>
      {icon ? <Icon name={icon} size="sm" color={iconColor ?? ink} /> : null}
      <AppText variant="label" style={{ color: ink }}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.pill,
  },
});
