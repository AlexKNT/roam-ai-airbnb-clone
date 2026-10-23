import { useUser } from '@clerk/expo';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { IconButton } from '@/components/ui/icon-button';
import { Logo } from '@/components/ui/logo';
import { homeCopy } from '@/constants/copy';
import { color, layout, radius, spacing } from '@/theme';

function initialsOf(...parts: (string | null | undefined)[]) {
  const initials = parts
    .filter((part): part is string => Boolean(part))
    .map((part) => part.trim().charAt(0).toUpperCase())
    .join('');

  return initials.slice(0, 2);
}

export function HomeHeader({ onSearchPress }: { onSearchPress: () => void }) {
  const { user } = useUser();
  const name = user?.firstName ?? user?.username ?? null;
  const greeting = name ? homeCopy.greeting(name) : homeCopy.greetingFallback;
  const image = user?.imageUrl;
  const initials = initialsOf(user?.firstName, user?.lastName) || name?.charAt(0)?.toUpperCase();

  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <Logo size={56} />
        {image ? (
          <Image
            source={{ uri: image }}
            style={styles.avatar}
            contentFit="cover"
            accessibilityLabel={homeCopy.avatarLabel}
          />
        ) : (
          <View
            accessible
            accessibilityLabel={homeCopy.avatarLabel}
            style={[styles.avatar, styles.avatarFallback]}>
            <AppText variant="button">{initials ?? ''}</AppText>
          </View>
        )}
      </View>

      <View style={styles.heroRow}>
        <View style={styles.heroCopy}>
          <AppText variant="body" color="textSecondary">
            {greeting}
          </AppText>
          <AppText variant="display">{homeCopy.headline}</AppText>
        </View>
        <IconButton
          icon="search"
          label={homeCopy.searchLabel}
          size={layout.heroSearchButton}
          shape="soft"
          onPress={onSearchPress}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing[6],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatar: {
    width: layout.avatarSize,
    height: layout.avatarSize,
    borderRadius: radius.pill,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.surfaceGray,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  heroCopy: {
    flex: 1,
    gap: spacing[1],
  },
});
