import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { profileCopy } from '@/constants/copy';
import { color, layout, radius } from '@/theme';

export type ProfileAvatarProps = {
  imageUrl: string | null;
  initials: string | null;
};

/** The Clerk photo, or the guest's initials, or the person icon when neither exists. */
export function ProfileAvatar({ imageUrl, initials }: ProfileAvatarProps) {
  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={styles.avatar}
        contentFit="cover"
        accessibilityLabel={profileCopy.avatarLabel}
      />
    );
  }

  return (
    <View accessible accessibilityLabel={profileCopy.avatarLabel} style={[styles.avatar, styles.fallback]}>
      {initials ? (
        <AppText variant="heading">{initials}</AppText>
      ) : (
        <Icon name="person" size="lg" color={color.textSecondary} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: layout.profileAvatarSize,
    height: layout.profileAvatarSize,
    borderRadius: radius.pill,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.surfaceGray,
  },
});
