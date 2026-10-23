import type { AppIconName } from '@/components/ui/icon';

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

const amenityIcons: Record<string, AppIconName> = {
  wifi: 'wifi',
  'fast wi fi': 'wifi',
  'hot tub': 'bathtub-outline',
  'pet friendly': 'paw',
  fireplace: 'fire',
  'forest views': 'image-filter-hdr',
  'mountain views': 'image-filter-hdr',
  'ocean view': 'waves',
  'beach access': 'waves',
  pool: 'pool',
};

/** Icons are matched on the label the sheet shows, so the card and the detail screen agree. */
export function amenityIconFor(label: string): AppIconName | undefined {
  return amenityIcons[label.toLowerCase()];
}
