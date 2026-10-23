import { amenityLabelsFor } from '@/constants/amenities';

import { requireSanityClient } from './client';
import {
  stayDetailQuery,
  staysByTypeQuery,
  staysQuery,
  type StayDetailRow,
  type StaySummaryRow,
} from './groq';
import { CARD_IMAGE_SIZE, DETAIL_IMAGE_SIZE, toStayImage } from './image';
import type {
  CancellationPolicy,
  Host,
  HouseRules,
  StayDetail,
  StayImage,
  StaySummary,
  StayType,
} from './types';

export type GetStaysOptions = {
  type?: StayType;
};

function toStaySummary(row: StaySummaryRow): StaySummary {
  return {
    _id: row._id,
    slug: row.slug,
    name: row.name,
    type: row.type as StayType,
    place: row.place,
    pricePerNight: row.pricePerNight,
    rating: row.rating,
    reviewCount: row.reviewCount,
    amenities: amenityLabelsFor(row.amenities ?? []),
    coverImage: toStayImage(row.coverImage, CARD_IMAGE_SIZE),
  };
}

function toHost(host: StayDetailRow['host']): Host | null {
  if (!host) {
    return null;
  }

  return {
    name: host.name,
    avatar: toStayImage(host.avatar, DETAIL_IMAGE_SIZE),
    superhost: host.superhost,
  };
}

function toCancellationPolicy(
  policy: StayDetailRow['cancellationPolicy'],
): CancellationPolicy | null {
  if (!policy) {
    return null;
  }

  return {
    title: policy.title,
    summary: policy.summary,
    body: policy.body,
  };
}

function toHouseRules(rules: StayDetailRow['houseRules']): HouseRules | null {
  if (!rules) {
    return null;
  }

  return {
    name: rules.name,
    rules: rules.rules ?? [],
  };
}

function toStayDetail(row: StayDetailRow): StayDetail {
  const gallery = (row.gallery ?? [])
    .map((image) => toStayImage(image, DETAIL_IMAGE_SIZE))
    .filter((image): image is StayImage => image !== null);

  return {
    ...toStaySummary(row),
    summary: row.summary,
    guests: row.guests,
    bedrooms: row.bedrooms,
    beds: row.beds,
    baths: row.baths,
    petsAllowed: row.petsAllowed,
    gallery,
    checkInTime: row.checkInTime,
    checkOutTime: row.checkOutTime,
    host: toHost(row.host),
    cancellationPolicy: toCancellationPolicy(row.cancellationPolicy),
    houseRules: toHouseRules(row.houseRules),
  };
}

export async function getStays(options: GetStaysOptions = {}): Promise<StaySummary[]> {
  const client = requireSanityClient();
  const rows = options.type
    ? await client.fetch<StaySummaryRow[]>(staysByTypeQuery, { type: options.type })
    : await client.fetch<StaySummaryRow[]>(staysQuery);

  return rows.map(toStaySummary);
}

export async function getStayBySlug(slug: string): Promise<StayDetail | null> {
  const client = requireSanityClient();
  const row = await client.fetch<StayDetailRow | null>(stayDetailQuery, { slug });

  return row ? toStayDetail(row) : null;
}
