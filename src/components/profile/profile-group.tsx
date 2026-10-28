import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { color, radius, spacing } from '@/theme';

export type ProfileGroupProps = {
  label: string;
  children: ReactNode;
};

/** The grey panel around a section's rows, as `profile.png` groups Account and Preferences. */
export function ProfileGroup({ label, children }: ProfileGroupProps) {
  return (
    <View style={styles.group}>
      <AppText variant="subheading" accessibilityRole="header" aria-level={2}>
        {label}
      </AppText>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radius.xl,
    backgroundColor: color.surfaceGray,
  },
  card: {
    paddingHorizontal: spacing[4],
    borderRadius: radius.lg,
    backgroundColor: color.surface,
  },
});
