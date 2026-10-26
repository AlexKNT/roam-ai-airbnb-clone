import type { AppIconName } from '@/components/ui/icon';

import { type Amenity } from './amenity-labels';

export {
  amenityLabel,
  amenityLabels,
  amenityLabelsFor,
  amenityValues,
  type Amenity,
} from './amenity-labels';

/**
 * Words the search parser reads as an amenity, lowercase. Longer phrases are
 * tried first, so "hot tub" wins before "tub" ever could. `pet-friendly` is
 * empty on purpose: "pet friendly" is read by the pets rule, not as an amenity.
 */
export const amenitySynonyms: Record<Amenity, readonly string[]> = {
  'hot-tub': ['hot tub', 'hot tubs', 'hottub', 'jacuzzi'],
  'pet-friendly': [],
  'fast-wifi': ['fast wifi', 'fast wi fi', 'wifi', 'wi fi', 'internet'],
  'forest-view': ['forest view', 'forest views', 'forest', 'woods', 'trees'],
  'ocean-view': ['ocean view', 'ocean views', 'sea view', 'oceanfront', 'ocean'],
  'mountain-view': ['mountain view', 'mountain views', 'mountains', 'mountain'],
  pool: ['swimming pool', 'pool'],
  fireplace: ['fireplace', 'fire place', 'fireside'],
  'beach-access': ['beach access'],
};

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
