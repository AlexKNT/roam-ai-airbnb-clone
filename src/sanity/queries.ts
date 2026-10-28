import { amenityLabelsFor } from '@/constants/amenities';
import { posthogLogger } from '@/config/posthog';
import type { SearchSort, StaySearchParams } from '@/search/types';

import { requireSanityClient } from './client';
import {
  roamPoliciesQuery,
  scoredStaySearchQuery,
  stayDetailQuery,
  staySearchQuery,
  staysByIdsQuery,
  staysByTypeQuery,
  staysQuery,
  type RoamPolicyRow,
  type StayDetailRow,
  type StaySummaryRow,
} from './groq';
import { CARD_IMAGE_SIZE, DETAIL_IMAGE_SIZE, toStayImage } from './image';
import type {
  CancellationPolicy,
  Host,
  HouseRules,
  RoamPolicy,
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

/** The stays saved by a guest, in no particular order: the caller keeps the save order. */
export async function getStaysByIds(ids: readonly string[]): Promise<StaySummary[]> {
  if (ids.length === 0) return [];

  const client = requireSanityClient();
  const rows = await client.fetch<StaySummaryRow[]>(staysByIdsQuery, { ids });

  return rows.map(toStaySummary);
}

/** Published Roam policies in title order: the Policies screen prints them word for word. */
export async function getRoamPolicies(): Promise<RoamPolicy[]> {
  const client = requireSanityClient();
  const rows = await client.fetch<RoamPolicyRow[]>(roamPoliciesQuery);

  return rows.map((row) => ({
    _id: row._id,
    title: row.title,
    summary: row.summary,
    body: row.body,
    topic: row.topic ?? null,
  }));
}

let degradeReported = false;
/** One warning per session: the order changed, the guest is not told again. */
function reportScoringDegrade(error: unknown) {
  if (degradeReported) return;

  degradeReported = true;
  posthogLogger.warn('search_scoring_unavailable', {
    reason: error instanceof Error ? error.name : 'unknown',
  });
}

export async function searchStays(
  params: StaySearchParams,
  sort: SearchSort,
): Promise<StaySummary[]> {
  const client = requireSanityClient();
  const queryParams = {
    maxPrice: params.filters.maxPrice ?? null,
    minGuests: params.filters.minGuests ?? null,
    type: params.filters.type ?? null,
    amenities: params.filters.amenities ?? null,
    petsOnly: params.filters.petsOnly ?? null,
    place: params.filters.place ?? null,
    softText: params.softText,
  };

  // A mood word never removes a stay, so a failed scored read falls back once.
  if (sort === 'best' && params.softText) {
    try {
      const rows = await client.fetch<StaySummaryRow[]>(scoredStaySearchQuery, queryParams);
      return rows.map(toStaySummary);
    } catch (error) {
      reportScoringDegrade(error);
    }
  }

  const rows = await client.fetch<StaySummaryRow[]>(staySearchQuery(sort), queryParams);

  return rows.map(toStaySummary);
}
