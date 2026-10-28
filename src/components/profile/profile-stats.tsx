import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { color, radius, spacing } from '@/theme';

export type ProfileStat = {
  value: string;
  label: string;
  /** Rendered under the label, for the Saved retry when the count could not load. */
  footnote?: ReactNode;
};

export function ProfileStats({ stats }: { stats: readonly ProfileStat[] }) {
  return (
    <View style={styles.card}>
      {stats.map((stat, index) => (
        <View key={stat.label} style={[styles.cell, index > 0 && styles.divider]}>
          <AppText variant="subheading">{stat.value}</AppText>
          <AppText variant="caption" color="textSecondary">
            {stat.label}
          </AppText>
          {stat.footnote}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    paddingVertical: spacing[4],
    borderRadius: radius.xl,
    backgroundColor: color.surface,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[1],
  },
  divider: {
    borderLeftWidth: 1,
    borderLeftColor: color.border,
  },
});
