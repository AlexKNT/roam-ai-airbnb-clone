import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { stayDetailCopy } from '@/constants/copy';
import type { StayImage } from '@/sanity/types';
import { color, iconSize, layout, opacity, radius, spacing } from '@/theme';

export type StayHostRowProps = {
  name: string;
  avatar: StayImage | null;
  superhost: boolean;
  onPress: () => void;
};

function initialsOf(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
}

export function StayHostRow({ name, avatar, superhost, onPress }: StayHostRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${stayDetailCopy.hostedBy(name)}${superhost ? `, ${stayDetailCopy.superhost}` : ''}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      {avatar?.url ? (
        <Image
          source={{ uri: avatar.url }}
          style={styles.avatar}
          contentFit="cover"
          accessibilityLabel={stayDetailCopy.hostAvatar(name)}
        />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <AppText variant="subheading">{initialsOf(name)}</AppText>
        </View>
      )}

      <View style={styles.copy}>
        <AppText variant="subheading" numberOfLines={1}>
          {stayDetailCopy.hostedBy(name)}
        </AppText>
        {superhost ? (
          <View style={styles.superhost}>
            <Icon name="seal" size={iconSize.sm} color={color.textSecondary} />
            <AppText variant="caption" color="textSecondary">
              {stayDetailCopy.superhost}
            </AppText>
          </View>
        ) : null}
      </View>

      <Icon name="chevron-forward" size={iconSize.sm} color={color.textPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: layout.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  pressed: {
    opacity: opacity.pressed,
  },
  avatar: {
    width: layout.hostAvatarSize,
    height: layout.hostAvatarSize,
    borderRadius: radius.pill,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.surfaceGray,
  },
  copy: {
    flex: 1,
    gap: spacing[1],
  },
  superhost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
});
