import { verifyToken } from '@clerk/backend';
import { createClient, type SanityClient } from '@sanity/client';

import { SAVED_STAYS_LIMIT, savedStayReads, savedStayWrites } from '@/saved/limits';
import { pruneOrphanSaves } from '@/saved/prune';
import { isStayId } from '@/saved/saved-stay-id';
import { requireSavedStayStore } from '@/saved/store';

const SANITY_API_VERSION = '2025-02-19';

const liveStayQuery = `*[_type == "stay" && _id in $ids]._id`;

function requireClerkSecret(): string {
  const secretKey = process.env.CLERK_SECRET_KEY?.trim();

  if (!secretKey) {
    throw new Error('The saved stays route needs CLERK_SECRET_KEY to verify sessions.');
  }

  return secretKey;
}

let publicSanity: SanityClient | null = null;

function requirePublicSanity(): SanityClient {
  const projectId = process.env.EXPO_PUBLIC_SANITY_PROJECT_ID?.trim();
  const dataset = process.env.EXPO_PUBLIC_SANITY_DATASET?.trim();

  if (!projectId || !dataset) {
    throw new Error(
      'The saved stays route needs EXPO_PUBLIC_SANITY_PROJECT_ID and EXPO_PUBLIC_SANITY_DATASET.',
    );
  }

  publicSanity ??= createClient({
    projectId,
    dataset,
    apiVersion: SANITY_API_VERSION,
    useCdn: false,
    perspective: 'published',
  });

  return publicSanity;
}

/** Published stays only: a deleted or unpublished stay has no save to show. */
async function readLiveStayIds(stayIds: readonly string[]): Promise<Set<string>> {
  const rows = await requirePublicSanity().fetch<string[]>(liveStayQuery, { ids: stayIds });

  return new Set(rows);
}

function logPrune(message: string, details: Record<string, unknown>) {
  console.warn(`[saved-stays] ${message}`, details);
}

function unauthorized(): Response {
  return new Response(null, { status: 401 });
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

async function readGuestId(request: Request): Promise<string | null> {
  const header = request.headers.get('authorization') ?? '';
  const [scheme, token] = header.split(' ');

  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;

  try {
    const payload = await verifyToken(token, { secretKey: requireClerkSecret() });

    return payload?.sub ?? null;
  } catch {
    return null;
  }
}

export async function GET(request: Request): Promise<Response> {
  const guestId = await readGuestId(request);
  if (!guestId) return unauthorized();

  if (!savedStayReads.take(guestId)) return json({ error: 'rate_limited' }, 429);

  try {
    const store = requireSavedStayStore();
    const snapshot = await store.read(guestId);
    const saves = await pruneOrphanSaves(snapshot.saves, {
      liveStayIds: readLiveStayIds,
      deleteSaves: (stayIds) => store.removeMany(guestId, stayIds),
      log: logPrune,
    });

    return json({
      stayIds: saves.map((save) => save.stayId),
      count: saves.length,
      // Measured against the read window, not against what survived the prune.
      hasMore: snapshot.total > SAVED_STAYS_LIMIT,
    });
  } catch {
    return json({ error: 'saved_stays_failed' }, 500);
  }
}

export async function POST(request: Request): Promise<Response> {
  const guestId = await readGuestId(request);
  if (!guestId) return unauthorized();

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_request' }, 422);
  }

  const stayId = (body as { stayId?: unknown } | null)?.stayId;

  if (!isStayId(stayId)) return json({ error: 'invalid_stay_id' }, 422);
  if (!savedStayWrites.take(guestId)) return json({ error: 'rate_limited' }, 429);

  try {
    const store = requireSavedStayStore();
    const savedAt = await store.create(guestId, stayId);
    const count = await store.count(guestId);

    return json({ stayId, savedAt, count });
  } catch {
    return json({ error: 'saved_stays_failed' }, 500);
  }
}

export async function DELETE(request: Request): Promise<Response> {
  const guestId = await readGuestId(request);
  if (!guestId) return unauthorized();

  const stayId = new URL(request.url).searchParams.get('stayId');

  if (!isStayId(stayId)) return json({ error: 'invalid_stay_id' }, 422);
  if (!savedStayWrites.take(guestId)) return json({ error: 'rate_limited' }, 429);

  try {
    const store = requireSavedStayStore();

    await store.remove(guestId, stayId);

    return json({ stayId, count: await store.count(guestId) });
  } catch {
    return json({ error: 'saved_stays_failed' }, 500);
  }
}
