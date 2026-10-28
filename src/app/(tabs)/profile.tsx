import { useUser } from '@clerk/expo';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { CancellationBanner } from '@/components/profile/cancellation-banner';
import { ProfileGroup } from '@/components/profile/profile-group';
import { ProfileIdentityCard } from '@/components/profile/profile-identity-card';
import { ProfileStats, type ProfileStat } from '@/components/profile/profile-stats';
import { AppText } from '@/components/ui/app-text';
import { IconButton } from '@/components/ui/icon-button';
import { Logo } from '@/components/ui/logo';
import { Notice } from '@/components/ui/notice';
import { ProfileRow } from '@/components/ui/profile-row';
import { Screen } from '@/components/ui/screen';
import { profileCopy, supportEmail } from '@/constants/copy';
import { trackProfileOpened } from '@/profile/analytics';
import { profileIdentityFrom } from '@/profile/identity';
import { useSavedStays } from '@/saved/use-saved-stays';
import { opacity, spacing } from '@/theme';

/** Booking does not exist yet, so Trips reports an honest zero rather than a number. */
const TRIPS_COUNT = 0;

export default function ProfileScreen() {
  const { user } = useUser();
  const saved = useSavedStays();
  const [paymentNotice, setPaymentNotice] = useState(false);
  const [notificationNotice, setNotificationNotice] = useState(false);
  const [mailNotice, setMailNotice] = useState(false);

  useEffect(() => {
    trackProfileOpened('profile');
  }, []);

  const identity = profileIdentityFrom(user);
  const savedValue =
    saved.status === 'ready'
      ? `${saved.count}${saved.hasMore ? '+' : ''}`
      : profileCopy.statUnavailable;

  const stats: ProfileStat[] = [
    { value: String(TRIPS_COUNT), label: profileCopy.statsTrips },
    {
      value: savedValue,
      label: profileCopy.statsSaved,
      footnote:
        saved.status === 'error' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={profileCopy.savedRetryLabel}
            onPress={saved.retry}
            hitSlop={spacing[3]}
            style={({ pressed }) => pressed && styles.pressed}>
            <AppText variant="label" color="textSecondary" style={styles.retryLabel}>
              {profileCopy.savedRetry}
            </AppText>
          </Pressable>
        ) : null,
    },
  ];

  const openSupport = async () => {
    const url = `mailto:${supportEmail}?subject=${encodeURIComponent(profileCopy.mailSubject)}`;

    try {
      await Linking.openURL(url);
    } catch {
      setMailNotice(true);
    }
  };

  return (
    <Screen background="surface">
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Logo size={48} />
          <IconButton
            icon="settings-outline"
            label={profileCopy.settingsLabel}
            shape="soft"
            onPress={() => router.push('/account/settings')}
          />
        </View>

        <ProfileIdentityCard identity={identity} />
        <ProfileStats stats={stats} />

        <ProfileGroup label={profileCopy.accountGroup}>
          <ProfileRow
            icon="person-outline"
            label={profileCopy.personalInfo}
            onPress={() => router.push('/account/personal-info')}
          />
          <ProfileRow
            icon="card-outline"
            label={profileCopy.paymentMethods}
            onPress={() => setPaymentNotice(true)}
          />
          <ProfileRow
            icon="briefcase-outline"
            label={profileCopy.trips}
            last
            onPress={() => router.navigate('/trips')}
          />
        </ProfileGroup>

        <ProfileGroup label={profileCopy.preferencesGroup}>
          <ProfileRow
            icon="notifications-outline"
            label={profileCopy.notifications}
            onPress={() => setNotificationNotice(true)}
          />
          <ProfileRow
            icon="help-circle-outline"
            label={profileCopy.helpSupport}
            last
            onPress={openSupport}
          />
        </ProfileGroup>

        <CancellationBanner onPress={() => router.push('/account/policies')} />
      </View>

      <Notice
        visible={paymentNotice}
        title={profileCopy.laterTitle}
        message={profileCopy.paymentMethodsNotice}
        dismissLabel={profileCopy.noticeDismiss}
        onClose={() => setPaymentNotice(false)}
      />
      <Notice
        visible={notificationNotice}
        title={profileCopy.laterTitle}
        message={profileCopy.notificationsNotice}
        dismissLabel={profileCopy.noticeDismiss}
        onClose={() => setNotificationNotice(false)}
      />
      <Notice
        visible={mailNotice}
        title={profileCopy.mailUnavailableTitle}
        message={profileCopy.mailUnavailableMessage(supportEmail)}
        dismissLabel={profileCopy.noticeDismiss}
        onClose={() => setMailNotice(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing[4],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  retryLabel: {
    textDecorationLine: 'underline',
  },
  pressed: {
    opacity: opacity.pressed,
  },
});
