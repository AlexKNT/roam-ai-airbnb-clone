import type { SearchSort } from '@/search/types';

export type SanityImageRow = {
  ref: string | null;
  alt: string | null;
};

export type StaySummaryRow = {
  _id: string;
  slug: string;
  name: string;
  type: string;
  place: string;
  pricePerNight: number;
  rating: number;
  reviewCount: number;
  amenities: string[] | null;
  coverImage: SanityImageRow | null;
};

export type StayDetailRow = StaySummaryRow & {
  summary: string;
  guests: number;
  bedrooms: number | null;
  beds: number | null;
  baths: number | null;
  petsAllowed: boolean;
  gallery: SanityImageRow[] | null;
  checkInTime: string;
  checkOutTime: string;
  host: {
    name: string;
    avatar: SanityImageRow | null;
    superhost: boolean;
  } | null;
  cancellationPolicy: {
    title: string;
    summary: string;
    body: string;
  } | null;
  houseRules: {
    name: string;
    rules: string[] | null;
  } | null;
};

const summaryFields = `_id,
  "slug": slug.current,
  name,
  type,
  "place": city + ", " + region,
  pricePerNight,
  rating,
  reviewCount,
  "amenities": amenities,
  "coverImage": gallery[0]{"ref": image.asset._ref, alt}`;

const listOrder = '[0...50]';

export const stayDetailQuery = `*[_type == "stay" && slug.current == $slug][0]{
  ${summaryFields},
  summary,
  guests,
  bedrooms,
  beds,
  baths,
  petsAllowed,
  "gallery": gallery[]{"ref": image.asset._ref, alt},
  checkInTime,
  checkOutTime,
  "host": host->{name, "avatar": avatar{"ref": asset._ref, alt}, superhost},
  "cancellationPolicy": cancellationPolicy->{title, summary, body},
  "houseRules": houseRules->{name, rules}
}`;

export const staysQuery = `*[_type == "stay"] | order(rating desc, lower(name) asc, _id asc)${listOrder}{
  ${summaryFields}
}`;

export const staysByTypeQuery = `*[_type == "stay" && type == $type] | order(rating desc, lower(name) asc, _id asc)${listOrder}{
  ${summaryFields}
}`;

/**
 * Hard constraints, all as parameters. A value that is not set arrives as null,
 * so the guard keeps that clause out of the way instead of excluding rows.
 */
const searchFilter = `_type == "stay"
  && (!defined($maxPrice) || pricePerNight <= $maxPrice)
  && (!defined($minGuests) || guests >= $minGuests)
  && (!defined($type) || type == $type)
  && (!defined($amenities) || count((amenities)[@ in $amenities]) == count($amenities))
  && (!defined($petsOnly) || !$petsOnly || petsAllowed == true)
  && (!defined($place) || lower(city) == $place || lower(region) == $place)`;

const searchOrder: Record<SearchSort, string> = {
  best: 'order(rating desc, lower(name) asc, _id asc)',
  'price-asc': 'order(pricePerNight asc, lower(name) asc, _id asc)',
  'price-desc': 'order(pricePerNight desc, lower(name) asc, _id asc)',
  rating: 'order(rating desc, lower(name) asc, _id asc)',
};

export const SEARCH_RESULT_LIMIT = 50;

/** Only the sort name picks a constant order clause; no guest text reaches this string. */
export function staySearchQuery(sort: SearchSort): string {
  return `*[${searchFilter}] | ${searchOrder[sort]} ${listOrder}{
  ${summaryFields}
}`;
}

/** Best match with mood text: embeddings rank, then the usual rating order settles ties. */
export const scoredStaySearchQuery = `*[${searchFilter}] | score(text::semanticSimilarity($softText)) | order(_score desc, rating desc, lower(name) asc) ${listOrder}{
  ${summaryFields}
}`;
