import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { HomeHeader } from '@/components/home/home-header';
import { HomePromptBar } from '@/components/home/home-prompt-bar';
import { Alert } from '@/components/ui/alert';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { ListingCard } from '@/components/ui/listing-card';
import { Screen } from '@/components/ui/screen';
import { posthogLogger } from '@/config/posthog';
import { homeCopy, stayCopy, stayTypeFilters } from '@/constants/copy';
import type { StayType } from '@/sanity/types';
import { useStays } from '@/sanity/use-stays';
import { color, spacing } from '@/theme';

export default function HomeScreen() {
  const [selected, setSelected] = useState<StayType | 'all'>('all');
  const stays = useStays(selected === 'all' ? undefined : selected);

  useEffect(() => {
    posthogLogger.info('home_screen_displayed', { screen: 'home' });
  }, []);

  const openSearch = () => router.navigate('/search');
  const ready = stays.status === 'ready';

  return (
    <Screen background="surface">
      <View style={styles.body}>
        <HomeHeader onSearchPress={openSearch} />

        <HomePromptBar onPress={openSearch} />

        <View style={styles.chips}>
          {stayTypeFilters.map((filter) => (
            <Chip
              key={filter.type}
              label={filter.label}
              icon={filter.icon}
              tone="primary"
              selected={selected === filter.type}
              onPress={() => setSelected(filter.type)}
            />
          ))}
        </View>

        <View style={styles.feed}>
          {stays.status === 'loading' ? (
            <View style={styles.state}>
              <ActivityIndicator color={color.primary} />
              <AppText variant="caption" color="textSecondary" align="center">
                {homeCopy.loading}
              </AppText>
            </View>
          ) : null}

          {stays.status === 'error' ? (
            <View style={styles.state}>
              <Alert tone="error" message={stays.error ?? stayCopy.listError} />
              <Button label={stayCopy.retry} onPress={stays.retry} variant="secondary" />
            </View>
          ) : null}

          {ready && stays.data.length === 0 ? (
            <View style={styles.state}>
              <AppText variant="button" align="center">
                {homeCopy.emptyTitle}
              </AppText>
              <AppText variant="body" color="textSecondary" align="center">
                {homeCopy.emptyDescription}
              </AppText>
              <Button label={homeCopy.emptyAction} onPress={() => setSelected('all')} />
            </View>
          ) : null}

          {ready
            ? stays.data.map((stay) => (
                <ListingCard
                  key={stay._id}
                  image={stay.coverImage?.url ?? null}
                  imageAlt={stay.coverImage?.alt}
                  title={stay.name}
                  place={stay.place}
                  rating={stay.rating}
                  onPress={() =>
                    router.push({ pathname: '/stay/[slug]', params: { slug: stay.slug } })
                  }
                />
              ))
            : null}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing[6],
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  feed: {
    gap: spacing[4],
  },
  state: {
    alignItems: 'stretch',
    gap: spacing[3],
    paddingVertical: spacing[10],
  },
});

