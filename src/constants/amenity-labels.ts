/**
 * The amenity values the schema accepts and the labels every surface shows.
 * Kept free of imports so an API route can read labels without pulling in the
 * icon library.
 */
export const amenityValues = [
  'hot-tub',
  'pet-friendly',
  'fast-wifi',
  'forest-view',
  'ocean-view',
  'mountain-view',
  'pool',
  'fireplace',
  'beach-access',
] as const;

export type Amenity = (typeof amenityValues)[number];

export const amenityLabels: Record<Amenity, string> = {
  'hot-tub': 'Hot Tub',
  'pet-friendly': 'Pet Friendly',
  'fast-wifi': 'Fast Wi Fi',
  'forest-view': 'Forest Views',
  'ocean-view': 'Ocean View',
  'mountain-view': 'Mountain Views',
  pool: 'Pool',
  fireplace: 'Fireplace',
  'beach-access': 'Beach Access',
};

export function amenityLabel(value: string): string | null {
  if (!Object.prototype.hasOwnProperty.call(amenityLabels, value)) {
    return null;
  }

  return amenityLabels[value as Amenity];
}

export function amenityLabelsFor(values: readonly string[]): string[] {
  return values
    .map((value) => amenityLabel(value))
    .filter((label): label is string => label !== null);
}
