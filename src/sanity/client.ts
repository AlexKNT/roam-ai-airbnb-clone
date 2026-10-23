import { createClient, type SanityClient } from '@sanity/client';

import { sanityDataset, sanityProjectId } from './config';

export const SANITY_API_VERSION = '2025-02-19';

export const sanityClient: SanityClient | null =
  sanityProjectId && sanityDataset
    ? createClient({
        projectId: sanityProjectId,
        dataset: sanityDataset,
        apiVersion: SANITY_API_VERSION,
        useCdn: true,
        perspective: 'published',
      })
    : null;

export class SanityConfigurationError extends Error {
  constructor() {
    super(
      'Sanity is not configured: set EXPO_PUBLIC_SANITY_PROJECT_ID and EXPO_PUBLIC_SANITY_DATASET.',
    );
    this.name = 'SanityConfigurationError';
  }
}

export function requireSanityClient(): SanityClient {
  if (!sanityClient) {
    throw new SanityConfigurationError();
  }

  return sanityClient;
}
