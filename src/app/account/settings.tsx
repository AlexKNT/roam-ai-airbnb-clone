import { useAuth, useClerk } from '@clerk/expo';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Notice } from '@/components/ui/notice';
import { ProfileRow } from '@/components/ui/profile-row';
import { Screen } from '@/components/ui/screen';
import { settingsCopy } from '@/constants/copy';
import { requestAccountDeletion } from '@/profile/account-api';
import { trackAccountDeleted, trackSignedOut } from '@/profile/analytics';
import { readAppVersion } from '@/profile/app-version';
import { color, radius, spacing } from '@/theme';

export default function SettingsScreen() {
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const endSession = async () => {
    try {
      await signOut();
    } finally {
      router.replace('/sign-in');
    }
  };

  const confirmSignOut = async () => {
    setSignOutOpen(false);
    trackSignedOut('settings');
    await endSession();
  };

  const confirmDelete = async () => {
    setDeleteOpen(false);
    setDeleting(true);

    let deleted = false;

    try {
      const token = await getToken();
      if (!token) throw new Error('No session token.');

      await requestAccountDeletion(token);
      deleted = true;
    } catch {
      setDeleteFailed(true);
    } finally {
      setDeleting(false);

      // The account is gone, so the session that reached it has to go too.
      if (deleted) {
        trackAccountDeleted('settings');
        await endSession();
      }
    }
  };

  return (
    <Screen bottomInset="none">
      <View style={styles.body}>
        <View style={styles.card}>
          <ProfileRow
            icon="log-out-outline"
            label={settingsCopy.signOut}
            onPress={() => setSignOutOpen(true)}
          />
          <ProfileRow
            icon="trash-outline"
            label={settingsCopy.deleteAccount}
            last
            onPress={() => setDeleteOpen(true)}
          />
        </View>

        <AppText variant="caption" color="textMuted" align="center">
          {settingsCopy.version(readAppVersion())}
        </AppText>
      </View>

      <Notice
        visible={signOutOpen}
        title={settingsCopy.signOutTitle}
        message={settingsCopy.signOutMessage}
        dismissLabel={settingsCopy.signOutCancel}
        onClose={() => setSignOutOpen(false)}
        confirmLabel={settingsCopy.signOutConfirm}
        onConfirm={confirmSignOut}
      />
      <Notice
        visible={deleteOpen}
        title={settingsCopy.deleteTitle}
        message={settingsCopy.deleteMessage}
        dismissLabel={settingsCopy.deleteCancel}
        onClose={() => setDeleteOpen(false)}
        confirmLabel={settingsCopy.deleteConfirm}
        onConfirm={confirmDelete}
        destructive
        confirmLoading={deleting}
      />
      <Notice
        visible={deleteFailed}
        title={settingsCopy.deleteFailedTitle}
        message={settingsCopy.deleteFailedMessage}
        dismissLabel={settingsCopy.deleteFailedDismiss}
        onClose={() => setDeleteFailed(false)}
        confirmLabel={settingsCopy.deleteRetry}
        onConfirm={confirmDelete}
        confirmLoading={deleting}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing[6],
  },
  card: {
    paddingHorizontal: spacing[4],
    borderRadius: radius.lg,
    backgroundColor: color.surface,
  },
});
