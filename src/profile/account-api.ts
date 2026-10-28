function endpoint() {
  const origin = process.env.EXPO_PUBLIC_API_ORIGIN?.trim().replace(/\/+$/, '');

  return origin ? `${origin}/api/account` : '/api/account';
}

export class AccountDeleteError extends Error {
  constructor() {
    super('The account could not be deleted.');
    this.name = 'AccountDeleteError';
  }
}

/**
 * A 401 means the token no longer verifies, so the account is already out of
 * reach and a retry after a delete that landed badly cannot do better.
 */
export async function requestAccountDeletion(token: string): Promise<void> {
  const response = await fetch(endpoint(), {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.ok || response.status === 401) return;

  throw new AccountDeleteError();
}
