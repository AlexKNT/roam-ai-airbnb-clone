import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Logo } from '@/components/ui/logo';
import { Screen } from '@/components/ui/screen';
import { color, radius, spacing } from '@/theme';

type PlaceholderScreenProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

/** The four tab routes stand on this until their slice arrives. */
export function PlaceholderScreen({ title, description, children }: PlaceholderScreenProps) {
  return (
    <Screen>
      <View style={styles.body}>
        <View style={styles.card}>
          <Logo size={32} />
          <View style={styles.copy}>
            <AppText variant="heading">{title}</AppText>
            <AppText variant="body" color="textSecondary">
              {description}
            </AppText>
          </View>
          {children}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: color.surface,
    borderRadius: radius.xl,
    padding: spacing[6],
    gap: spacing[6],
  },
  copy: {
    gap: spacing[2],
  },
});
