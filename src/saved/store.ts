import { createClient, type SanityClient } from '@sanity/client';

import { SAVED_STAYS_LIMIT } from './limits';
import { savedStayId } from './saved-stay-id';

const SANITY_API_VERSION = '2025-02-19';

export type SaveRow = {
  stayId: string;
  savedAt: string;
};

export type SavedStaysSnapshot = {
  saves: SaveRow[];
  /** Every save the guest holds, which can be more than the read returns. */
  total: number;
};

export type SavedStayStore = {
  read: (guestId: string) => Promise<SavedStaysSnapshot>;
  /** Answers the save time the document actually holds, so a repeat saves nothing new. */
  create: (guestId: string, stayId: string) => Promise<string>;
  remove: (guestId: string, stayId: string) => Promise<void>;
  removeMany: (guestId: string, stayIds: readonly string[]) => Promise<void>;
  count: (guestId: string) => Promise<number>;
};

const readQuery = `{
  "saves": *[_type == "savedStay" && guestId == $guestId] | order(savedAt desc) [0...$limit]{stayId, savedAt},
  "total": count(*[_type == "savedStay" && guestId == $guestId])
}`;

const countQuery = `count(*[_type == "savedStay" && guestId == $guestId])`;

export function createSavedStayStore(client: SanityClient): SavedStayStore {
  return {
    async read(guestId) {
      const result = await client.fetch<SavedStaysSnapshot>(readQuery, {
        guestId,
        limit: SAVED_STAYS_LIMIT,
      });

      return { saves: result.saves ?? [], total: result.total ?? 0 };
    },

    async create(guestId, stayId) {
      const id = savedStayId(guestId, stayId);
      const now = new Date().toISOString();

      // Create only, so a save never moves in the list when it is tapped again.
      await client.createIfNotExists({
        _id: id,
        _type: 'savedStay',
        guestId,
        stayId,
        savedAt: now,
      });

      const stored = await client.getDocument<{ savedAt?: string }>(id);

      return stored?.savedAt ?? now;
    },

    async remove(guestId, stayId) {
      await client.delete(savedStayId(guestId, stayId));
    },

    async removeMany(guestId, stayIds) {
      if (stayIds.length === 0) return;

      const transaction = client.transaction();

      for (const stayId of stayIds) transaction.delete(savedStayId(guestId, stayId));

      await transaction.commit();
    },

    async count(guestId) {
      const total = await client.fetch<number>(countQuery, { guestId });

      return Math.min(total, SAVED_STAYS_LIMIT);
    },
  };
}

let privateClient: SanityClient | null = null;

/** The private dataset is server only: its tokens never reach the app bundle. */
export function requireSavedStayStore(): SavedStayStore {
  const projectId = process.env.EXPO_PUBLIC_SANITY_PROJECT_ID?.trim();
  const dataset = process.env.SANITY_PRIVATE_DATASET?.trim();
  const writeToken = process.env.SANITY_API_WRITE_TOKEN?.trim();
  const readToken = process.env.SANITY_API_READ_TOKEN?.trim() || writeToken;

  if (!projectId || !dataset || !writeToken) {
    throw new Error(
      'The saved stays route needs EXPO_PUBLIC_SANITY_PROJECT_ID, SANITY_PRIVATE_DATASET and SANITY_API_WRITE_TOKEN.',
    );
  }

  privateClient ??= createClient({
    projectId,
    dataset,
    apiVersion: SANITY_API_VERSION,
    token: writeToken,
    useCdn: false,
    perspective: 'raw',
  });

  // Reads honour a dedicated read token when one is configured.
  return createSavedStayStore(
    readToken === writeToken
      ? privateClient
      : privateClient.withConfig({ token: readToken }),
  );
}
