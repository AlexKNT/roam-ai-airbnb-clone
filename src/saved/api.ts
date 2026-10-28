export type SavedStaysList = {
  stayIds: string[];
  count: number;
  hasMore: boolean;
};

function endpoint() {
  const origin = process.env.EXPO_PUBLIC_API_ORIGIN?.trim().replace(/\/+$/, '');

  return origin ? `${origin}/api/saved-stays` : '/api/saved-stays';
}

async function read(response: Response): Promise<unknown> {
  if (!response.ok) throw new Error(`Saved stays answered ${response.status}.`);

  return response.json();
}

export async function fetchSavedStays(token: string): Promise<SavedStaysList> {
  const body = (await read(
    await fetch(endpoint(), { headers: { Authorization: `Bearer ${token}` } }),
  )) as Partial<SavedStaysList> | null;

  return {
    stayIds: Array.isArray(body?.stayIds) ? body.stayIds.filter((id) => typeof id === 'string') : [],
    count: typeof body?.count === 'number' ? body.count : 0,
    hasMore: body?.hasMore === true,
  };
}

export async function saveStay(token: string, stayId: string): Promise<void> {
  await read(
    await fetch(endpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ stayId }),
    }),
  );
}

/** DELETE carries the id in the query string, so no proxy can strip it. */
export async function unsaveStay(token: string, stayId: string): Promise<void> {
  await read(
    await fetch(`${endpoint()}?stayId=${encodeURIComponent(stayId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),
  );
}
