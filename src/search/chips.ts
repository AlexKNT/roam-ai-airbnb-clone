import { amenityLabels, type Amenity } from '@/constants/amenities';
import { searchCopy, stayTypeFilters } from '@/constants/copy';

import { placeLabel } from './places';
import type { SearchConstraintKind, StaySearchFilters } from './types';

export type SearchChip = {
  key: string;
  kind: SearchConstraintKind;
  label: string;
  /** Set on amenity chips, so removing one leaves its neighbours alone. */
  amenity?: Amenity;
};

/** The chips are the filters, in the fixed order the spec names. */
export function searchChips(filters: StaySearchFilters): SearchChip[] {
  const chips: SearchChip[] = [];

  if (filters.maxPrice !== undefined) {
    chips.push({
      key: 'price',
      kind: 'price',
      label: searchCopy.priceChip(filters.maxPrice),
    });
  }

  if (filters.minGuests !== undefined) {
    chips.push({
      key: 'guests',
      kind: 'guests',
      label: searchCopy.guestsChip(filters.minGuests),
    });
  }

  if (filters.type !== undefined) {
    const type = filters.type;
    const label = stayTypeFilters.find((filter) => filter.type === type)?.label ?? type;
    chips.push({ key: 'type', kind: 'type', label });
  }

  for (const amenity of filters.amenities ?? []) {
    chips.push({
      key: `amenity-${amenity}`,
      kind: 'amenities',
      label: amenityLabels[amenity],
      amenity,
    });
  }

  if (filters.petsOnly === true) {
    chips.push({ key: 'pets', kind: 'pets', label: searchCopy.petsChip });
  }

  if (filters.place !== undefined) {
    chips.push({ key: 'place', kind: 'place', label: placeLabel(filters.place) });
  }

  return chips;
}

export function withoutConstraint(
  filters: StaySearchFilters,
  chip: SearchChip,
): StaySearchFilters {
  const next: StaySearchFilters = { ...filters };

  switch (chip.kind) {
    case 'price':
      delete next.maxPrice;
      break;
    case 'guests':
      delete next.minGuests;
      break;
    case 'type':
      delete next.type;
      break;
    case 'amenities': {
      const remaining = (next.amenities ?? []).filter((value) => value !== chip.amenity);
      if (remaining.length > 0) {
        next.amenities = remaining;
      } else {
        delete next.amenities;
      }
      break;
    }
    case 'pets':
      delete next.petsOnly;
      break;
    case 'place':
      delete next.place;
      break;
  }

  return next;
}
