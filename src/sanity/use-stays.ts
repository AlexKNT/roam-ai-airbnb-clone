import { useCallback } from 'react';

import { getStays } from './queries';
import type { StaySummary, StayType } from './types';
import { useSanityQuery, type QueryState } from './use-query';

const EMPTY_STAYS: StaySummary[] = [];

export type StaysState = QueryState<StaySummary[]>;

export function useStays(type?: StayType): StaysState {
  const load = useCallback(() => getStays({ type }), [type]);

  return useSanityQuery({
    queryKey: type ?? 'all',
    initialData: EMPTY_STAYS,
    load,
  });
}
