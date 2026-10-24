import { posthog } from '@/config/posthog';

import { filterKinds, type SearchSort, type StaySearchFilters } from './types';

/**
 * The sentence itself never leaves the device through analytics: only the sort
 * and which kinds of constraint the parser applied.
 */
export function trackSearchSubmitted(sort: SearchSort, filters: StaySearchFilters) {
  const kinds = filterKinds(filters);

  try {
    posthog?.capture('search_submitted', {
      sort,
      filterCount: kinds.length,
      constraintKinds: kinds,
    });
  } catch {
    // Analytics never blocks a search.
  }
}
