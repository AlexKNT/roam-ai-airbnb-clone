import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { SearchChips } from '@/components/search/search-chips';
import { SortMenu } from '@/components/search/sort-menu';
import { Alert } from '@/components/ui/alert';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { ListingCard } from '@/components/ui/listing-card';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { SearchField } from '@/components/ui/search-field';
import { posthogLogger } from '@/config/posthog';
import { homeCopy, searchCopy, stayCopy } from '@/constants/copy';
import { savedStayScreens } from '@/saved/screens';
import { useSavedStays } from '@/saved/use-saved-stays';
import { trackSearchSubmitted } from '@/search/analytics';
import { searchChips, withoutConstraint, type SearchChip } from '@/search/chips';
import { parseStayQuery } from '@/search/parse';
import { emptySearchParams, hasFilters, type SearchSort } from '@/search/types';
import { SEARCH_RESULT_LIMIT } from '@/sanity/groq';
import { useStaySearch } from '@/sanity/use-stay-search';
import { color, layout, spacing } from '@/theme';

export default function SearchScreen() {
  const { focus } = useLocalSearchParams<{ focus?: string }>();
  const [sentence, setSentence] = useState('');
  const [params, setParams] = useState(emptySearchParams);
  const [sort, setSort] = useState<SearchSort>('best');
  const [submitNonce, setSubmitNonce] = useState(0);
  const [unclear, setUnclear] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const search = useStaySearch(params, sort, submitNonce);
  const { isSaved, toggle } = useSavedStays();

  useEffect(() => {
    posthogLogger.info('search_screen_displayed', { screen: 'search' });
  }, []);

  const submit = () => {
    const parsed = parseStayQuery(sentence);

    setParams(parsed);
    setUnclear(sentence.trim().length > 0 && !hasFilters(parsed.filters));
    setSubmitNonce((value) => value + 1);
    trackSearchSubmitted(sort, parsed.filters);
  };

  const removeChip = (chip: SearchChip) => {
    const filters = withoutConstraint(params.filters, chip);

    setParams({ ...params, filters });
    setSubmitNonce((value) => value + 1);
    trackSearchSubmitted(sort, filters);
  };

  const changeSort = (next: SearchSort) => {
    setSort(next);
    setSubmitNonce((value) => value + 1);
    trackSearchSubmitted(next, params.filters);
  };

  const clearFilters = () => {
    setSentence('');
    setParams(emptySearchParams);
    setSort('best');
    setUnclear(false);
    setSubmitNonce((value) => value + 1);
  };

  const chips = searchChips(params.filters);
  const ready = search.status === 'ready';
  const capped = search.data.length >= SEARCH_RESULT_LIMIT;
  const countLabel = capped ? searchCopy.countCapped : searchCopy.count(search.data.length);

  return (
    <Screen background="surface">
      <View style={styles.body}>
        <View style={styles.header}>
          <IconButton
            icon="chevron-back"
            label={searchCopy.back}
            size={layout.controlHeight}
            onPress={() => router.navigate('/')}
          />

          <SearchField
            key={focus ?? 'field'}
            autoFocus={Boolean(focus)}
            label={searchCopy.fieldLabel}
            placeholder={searchCopy.placeholder}
            value={sentence}
            onChangeText={setSentence}
            onSubmitEditing={submit}
            onFilterPress={() => setNoticeOpen(true)}
            style={styles.field}
          />
        </View>

        <SearchChips chips={chips} onRemove={removeChip} />

        {unclear && ready ? (
          <AppText variant="caption" color="textSecondary">
            {searchCopy.unclear}
          </AppText>
        ) : null}

        {search.status === 'error' ? null : (
          <View style={styles.countRow}>
            <View style={styles.flex}>
              {ready && search.data.length > 0 ? (
                <AppText variant="subheading">{countLabel}</AppText>
              ) : null}
            </View>
            <SortMenu value={sort} onChange={changeSort} />
          </View>
        )}

        {search.status === 'loading' ? (
          <View style={styles.state}>
            <ActivityIndicator color={color.primary} />
            <AppText variant="caption" color="textSecondary" align="center">
              {homeCopy.loading}
            </AppText>
          </View>
        ) : null}

        {search.status === 'error' ? (
          <View style={styles.state}>
            <Alert tone="error" message={search.error ?? stayCopy.listError} />
            <Button label={stayCopy.retry} onPress={search.retry} variant="secondary" />
          </View>
        ) : null}

        {ready && search.data.length === 0 ? (
          <View style={styles.state}>
            <AppText variant="button" align="center">
              {searchCopy.emptyTitle}
            </AppText>
            <AppText variant="body" color="textSecondary" align="center">
              {searchCopy.emptyDescription}
            </AppText>
            <Button label={searchCopy.emptyAction} onPress={clearFilters} />
          </View>
        ) : null}

        {ready
          ? search.data.map((stay) => (
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
                onToggleSave={() => toggle(stay._id, savedStayScreens.search)}
                onPress={() =>
                  router.push({ pathname: '/stay/[slug]', params: { slug: stay.slug } })
                }
              />
            ))
          : null}
      </View>

      <Notice
        visible={noticeOpen}
        title={searchCopy.filtersNoticeTitle}
        message={searchCopy.filtersNotice}
        dismissLabel={searchCopy.noticeDismiss}
        onClose={() => setNoticeOpen(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing[6],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  field: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[4],
  },
  state: {
    alignItems: 'stretch',
    gap: spacing[3],
    paddingVertical: spacing[10],
  },
});

