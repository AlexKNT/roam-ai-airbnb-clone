import { createClerkClient, verifyToken } from '@clerk/backend';
import { isClerkAPIResponseError } from '@clerk/backend/errors';

import { accountDeletes } from '@/saved/limits';
import { requireSavedStayStore } from '@/saved/store';

function requireClerkSecret(): string {
  const secretKey = process.env.CLERK_SECRET_KEY?.trim();

  if (!secretKey) {
    throw new Error('The account route needs CLERK_SECRET_KEY to verify sessions.');
  }

  return secretKey;
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

/** A retry after a delete that already landed finds no user, which is the outcome we wanted. */
function isAlreadyDeleted(error: unknown): boolean {
  if (!isClerkAPIResponseError(error)) return false;
  if (error.status === 404) return true;

  return error.errors.some((entry) => entry.code === 'resource_not_found');
}

/**
 * Deletes the guest's saves first, so a Clerk failure never leaves their content
 * behind on an account they can still sign in to. A failed purge changes nothing.
 */
export async function DELETE(request: Request): Promise<Response> {
  const guestId = await readGuestId(request);
  if (!guestId) return unauthorized();

  if (!accountDeletes.take(guestId)) return json({ error: 'rate_limited' }, 429);

  try {
    await requireSavedStayStore().removeAll(guestId);
  } catch {
    return json({ error: 'account_delete_failed' }, 500);
  }

  try {
    const clerk = createClerkClient({ secretKey: requireClerkSecret() });

    await clerk.users.deleteUser(guestId);
  } catch (error) {
    if (!isAlreadyDeleted(error)) return json({ error: 'account_delete_failed' }, 500);
  }

  return json({ deleted: true });
}
