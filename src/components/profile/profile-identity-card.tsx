import { StyleSheet, View } from 'react-native';

import { ProfileAvatar } from '@/components/profile/profile-avatar';
import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { Tag } from '@/components/ui/tag';
import { profileCopy } from '@/constants/copy';
import type { ProfileIdentity } from '@/profile/identity';
import { color, iconSize, radius, spacing } from '@/theme';

export function ProfileIdentityCard({ identity }: { identity: ProfileIdentity }) {
  return (
    <View style={styles.card}>
      <ProfileAvatar imageUrl={identity.imageUrl} initials={identity.initials} />

      <View style={styles.copy}>
        <AppText variant="heading" accessibilityRole="header" numberOfLines={2} style={styles.name}>
          {identity.name}
        </AppText>

        {identity.place ? (
          <View style={styles.placeRow}>
            <Icon name="location-outline" size={iconSize.sm} color={color.textSecondary} />
            <AppText variant="body" color="textSecondary" numberOfLines={1} style={styles.place}>
              {identity.place}
            </AppText>
          </View>
        ) : null}

        <Tag label={profileCopy.badge} tone="lavender" icon="star" iconColor={color.primary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    padding: spacing[3],
    borderRadius: radius.xl,
    backgroundColor: color.surface,
  },
  copy: {
    flex: 1,
    alignItems: 'flex-start',
    gap: spacing[1],
  },
  name: {
    alignSelf: 'stretch',
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    alignSelf: 'stretch',
  },
  place: {
    flexShrink: 1,
  },
});
