import type { Amenity } from '@/constants/amenities';
import type { StayType } from '@/sanity/types';

export const searchSortValues = ['best', 'price-asc', 'price-desc', 'rating'] as const;

export type SearchSort = (typeof searchSortValues)[number];

export type StaySearchFilters = {
  maxPrice?: number;
  minGuests?: number;
  type?: StayType;
  amenities?: Amenity[];
  petsOnly?: boolean;
  place?: string;
};

export type StaySearchParams = {
  filters: StaySearchFilters;
  softText: string | null;
};

export const searchConstraintKinds = [
  'price',
  'guests',
  'type',
  'amenities',
  'pets',
  'place',
] as const;

export type SearchConstraintKind = (typeof searchConstraintKinds)[number];

export const emptySearchParams: StaySearchParams = { filters: {}, softText: null };

export function filterKinds(filters: StaySearchFilters): SearchConstraintKind[] {
  const kinds: SearchConstraintKind[] = [];

  if (filters.maxPrice !== undefined) kinds.push('price');
  if (filters.minGuests !== undefined) kinds.push('guests');
  if (filters.type !== undefined) kinds.push('type');
  if ((filters.amenities ?? []).length > 0) kinds.push('amenities');
  if (filters.petsOnly === true) kinds.push('pets');
  if (filters.place !== undefined) kinds.push('place');

  return kinds;
}

export function hasFilters(filters: StaySearchFilters): boolean {
  return filterKinds(filters).length > 0;
}
