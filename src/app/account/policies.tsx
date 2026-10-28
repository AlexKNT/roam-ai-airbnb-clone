import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { Alert } from '@/components/ui/alert';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { policiesCopy } from '@/constants/copy';
import { getRoamPolicies } from '@/sanity/queries';
import type { RoamPolicy } from '@/sanity/types';
import { useSanityQuery } from '@/sanity/use-query';
import { color, iconSize, layout, radius, spacing } from '@/theme';

const EMPTY_POLICIES: RoamPolicy[] = [];

export default function PoliciesScreen() {
  const load = useCallback(() => getRoamPolicies(), []);
  const policies = useSanityQuery({
    queryKey: 'roam-policies',
    initialData: EMPTY_POLICIES,
    load,
  });

  return (
    <Screen bottomInset="none">
      <View style={styles.body}>
        {policies.status === 'loading' ? (
          <AppText variant="body" color="textSecondary">
            {policiesCopy.loading}
          </AppText>
        ) : null}

        {policies.status === 'error' ? (
          <View style={styles.state}>
            <Alert tone="error" message={policiesCopy.error} />
            <Button label={policiesCopy.retry} onPress={policies.retry} variant="secondary" />
          </View>
        ) : null}

        {policies.status === 'ready' && policies.data.length === 0 ? (
          <View style={styles.state}>
            <View style={styles.emptyIcon}>
              <Icon name="document-text-outline" size={iconSize.lg} color={color.textSecondary} />
            </View>
            <AppText variant="button" align="center">
              {policiesCopy.emptyTitle}
            </AppText>
            <AppText variant="body" color="textSecondary" align="center">
              {policiesCopy.emptyDescription}
            </AppText>
          </View>
        ) : null}

        {policies.status === 'ready'
          ? policies.data.map((policy) => (
              <View key={policy._id} style={styles.card}>
                <AppText variant="subheading">{policy.title}</AppText>
                <AppText variant="caption" color="textSecondary">
                  {policy.summary}
                </AppText>
                <AppText variant="body">{policy.body}</AppText>
                <AppText variant="label" color="textMuted">
                  {policiesCopy.source(policy.topic)}
                </AppText>
              </View>
            ))
          : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing[4],
  },
  card: {
    gap: spacing[2],
    padding: spacing[5],
    borderRadius: radius.xl,
    backgroundColor: color.surface,
  },
  state: {
    alignItems: 'stretch',
    gap: spacing[3],
    paddingVertical: spacing[10],
  },
  emptyIcon: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    width: layout.emptyIcon,
    height: layout.emptyIcon,
    borderRadius: radius.pill,
    backgroundColor: color.surfaceGray,
  },
});
