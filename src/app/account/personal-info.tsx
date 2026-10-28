import { useUser } from '@clerk/expo';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Screen } from '@/components/ui/screen';
import { personalInfoCopy } from '@/constants/copy';
import { trackPersonalInfoSaved } from '@/profile/analytics';
import { profileIdentityFrom } from '@/profile/identity';
import {
  toProfileSaveInput,
  validateProfileDraft,
  type ProfileDraft,
} from '@/profile/validation';
import { color, radius, spacing } from '@/theme';

export default function PersonalInfoScreen() {
  const { user } = useUser();

  // The account layout holds the session gate, so a missing user here is only the first frame.
  if (!user) return null;

  return <PersonalInfoForm user={user} />;
}

function PersonalInfoForm({ user }: { user: NonNullable<ReturnType<typeof useUser>['user']> }) {
  const identity = profileIdentityFrom(user);
  const current: ProfileDraft = {
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    place: identity.place ?? '',
  };

  const [draft, setDraft] = useState<ProfileDraft>(current);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const errors = validateProfileDraft(draft);
  const changed =
    draft.firstName.trim() !== current.firstName.trim() ||
    draft.lastName.trim() !== current.lastName.trim() ||
    draft.place.trim() !== current.place.trim();

  const submit = async () => {
    setShowErrors(true);
    setSaveFailed(false);

    if (Object.keys(errors).length > 0) return;

    const input = toProfileSaveInput(draft);
    const metadata: Record<string, unknown> = { ...user.unsafeMetadata };

    if (input.place === null) delete metadata.place;
    else metadata.place = input.place;

    setSaving(true);

    try {
      await user.update({
        firstName: input.firstName,
        lastName: input.lastName,
        unsafeMetadata: metadata,
      });
      trackPersonalInfoSaved('personal_info');
      router.back();
    } catch {
      setSaveFailed(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen bottomInset="none">
      <View style={styles.body}>
        <View style={styles.card}>
          <Input
            label={personalInfoCopy.firstName}
            value={draft.firstName}
            onChangeText={(firstName) => setDraft((value) => ({ ...value, firstName }))}
            autoComplete="given-name"
            autoCapitalize="words"
            error={showErrors ? errors.firstName : undefined}
          />
          <Input
            label={personalInfoCopy.lastName}
            value={draft.lastName}
            onChangeText={(lastName) => setDraft((value) => ({ ...value, lastName }))}
            autoComplete="family-name"
            autoCapitalize="words"
            error={showErrors ? errors.lastName : undefined}
          />
          <Input
            label={personalInfoCopy.place}
            value={draft.place}
            onChangeText={(place) => setDraft((value) => ({ ...value, place }))}
            placeholder={personalInfoCopy.placePlaceholder}
            autoCapitalize="words"
            error={showErrors ? errors.place : undefined}
          />
          <Input
            label={personalInfoCopy.email}
            value={identity.email ?? ''}
            onChangeText={() => {}}
            helper={personalInfoCopy.emailHelper}
            disabled
          />
        </View>

        {saveFailed ? <Alert tone="error" message={personalInfoCopy.saveFailed} /> : null}

        <Button
          label={personalInfoCopy.save}
          onPress={submit}
          disabled={!changed || saving}
          loading={saving}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing[4],
  },
  card: {
    gap: spacing[4],
    padding: spacing[5],
    borderRadius: radius.xl,
    backgroundColor: color.surface,
  },
});
