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
