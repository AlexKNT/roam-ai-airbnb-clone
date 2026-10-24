import { useCallback, useMemo } from 'react';

import type { SearchSort, StaySearchParams } from '@/search/types';

import { searchStays } from './queries';
import type { StaySummary } from './types';
import { useSanityQuery, type QueryState } from './use-query';

const EMPTY_STAYS: StaySummary[] = [];

export type StaySearchState = QueryState<StaySummary[]>;

function serialize(params: StaySearchParams, sort: SearchSort) {
  const { filters, softText } = params;

  return JSON.stringify({
    maxPrice: filters.maxPrice ?? null,
    minGuests: filters.minGuests ?? null,
    type: filters.type ?? null,
    amenities: filters.amenities ?? [],
    petsOnly: filters.petsOnly === true,
    place: filters.place ?? null,
    softText,
    sort,
  });
}

/**
 * `useSanityQuery` refetches when its key or its `load` identity changes, so the
 * key carries the submit nonce and `load` only changes with the params themselves.
 */
export function useStaySearch(
  params: StaySearchParams,
  sort: SearchSort,
  submitNonce: number,
): StaySearchState {
  const queryKey = useMemo(
    () => `${serialize(params, sort)}#${submitNonce}`,
    [params, sort, submitNonce],
  );
  const load = useCallback(() => searchStays(params, sort), [params, sort]);

  return useSanityQuery({ queryKey, initialData: EMPTY_STAYS, load });
}
