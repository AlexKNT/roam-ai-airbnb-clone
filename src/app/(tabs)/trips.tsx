import { router } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { TripPlaceholder } from '@/components/trips/trip-placeholder';
import { Alert } from '@/components/ui/alert';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ListingCard } from '@/components/ui/listing-card';
import { Screen } from '@/components/ui/screen';
import { posthogLogger } from '@/config/posthog';
import { savedStaysCopy } from '@/constants/copy';
import { savedStayScreens } from '@/saved/screens';
import { useSavedStays } from '@/saved/use-saved-stays';
import { getStaysByIds } from '@/sanity/queries';
import type { StaySummary } from '@/sanity/types';
import { useSanityQuery } from '@/sanity/use-query';
import { color, iconSize, layout, radius, spacing } from '@/theme';

const EMPTY_STAYS: StaySummary[] = [];

export default function TripsScreen() {
  const { status, stayIds, hasMore, isSaved, toggle, retry } = useSavedStays();
  const retriedOnMount = useRef(false);

  useEffect(() => {
    posthogLogger.info('trips_screen_displayed', { screen: 'trips' });
  }, []);

  const load = useCallback(() => getStaysByIds(stayIds), [stayIds]);
  const stays = useSanityQuery({
    queryKey: stayIds.join(','),
    enabled: stayIds.length > 0,
    initialData: EMPTY_STAYS,
    load,
  });

  // Opening Trips after a failed read is reason enough to try again once.
  useEffect(() => {
    if (status !== 'error' || retriedOnMount.current) return;

    retriedOnMount.current = true;
    retry();
  }, [retry, status]);

  const byId = new Map(stays.data.map((stay) => [stay._id, stay]));
  const rows = stayIds.flatMap((id) => {
    const stay = byId.get(id);

    return stay ? [stay] : [];
  });
  const waiting = status !== 'ready' && status !== 'error';
  const loadingRows =
    waiting || (status === 'ready' && stayIds.length > 0 && stays.status === 'loading');

  return (
    <Screen background="surface">
      <View style={styles.body}>
        <AppText variant="heading">{savedStaysCopy.tripsTitle}</AppText>

        {loadingRows ? (
          <View style={styles.list}>
            <AppText variant="caption" color="textSecondary">
              {savedStaysCopy.tripsLoading}
            </AppText>
            <TripPlaceholder />
            <TripPlaceholder />
            <TripPlaceholder />
          </View>
        ) : null}

        {status === 'error' ? (
          <View style={styles.state}>
            <Alert tone="error" message={savedStaysCopy.tripsError} />
            <Button label={savedStaysCopy.tripsRetry} onPress={retry} variant="secondary" />
          </View>
        ) : null}

        {status === 'ready' && stayIds.length === 0 ? (
          <View style={styles.state}>
            <View style={styles.emptyIcon}>
              <Icon name="heart-outline" size={iconSize.lg} color={color.textSecondary} />
            </View>
            <AppText variant="button" align="center">
              {savedStaysCopy.tripsEmptyTitle}
            </AppText>
            <AppText variant="body" color="textSecondary" align="center">
              {savedStaysCopy.tripsEmptyDescription}
            </AppText>
            <Button
              label={savedStaysCopy.tripsEmptyAction}
              onPress={() => router.navigate('/search')}
            />
          </View>
        ) : null}

        {status === 'ready' && stayIds.length > 0 && stays.status === 'error' ? (
          <View style={styles.state}>
            <Alert tone="error" message={savedStaysCopy.tripsError} />
            <Button label={savedStaysCopy.tripsRetry} onPress={stays.retry} variant="secondary" />
          </View>
        ) : null}

        {status === 'ready' && stays.status === 'ready' ? (
          <View style={styles.list}>
            {rows.map((stay) => (
              <ListingCard
                key={stay._id}
                layout="row"
                image={stay.coverImage?.url ?? null}
                imageAlt={stay.coverImage?.alt}
                title={stay.name}
                place={stay.place}
                rating={stay.rating}
                reviewCount={stay.reviewCount}
                pricePerNight={stay.pricePerNight}
                amenities={stay.amenities}
                saved={isSaved(stay._id)}
                onToggleSave={() => toggle(stay._id, savedStayScreens.trips)}
                onPress={() =>
                  router.push({ pathname: '/stay/[slug]', params: { slug: stay.slug } })
                }
              />
            ))}

            {hasMore ? (
              <AppText variant="caption" color="textSecondary" align="center">
                {savedStaysCopy.tripsHasMore}
              </AppText>
            ) : null}
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing[6],
  },
  list: {
    gap: spacing[4],
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

