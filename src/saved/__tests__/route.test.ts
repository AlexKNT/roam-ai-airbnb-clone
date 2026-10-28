import { verifyToken } from '@clerk/backend';

import { DELETE, GET, POST } from '@/app/api/saved-stays+api';
import { requireSavedStayStore } from '@/saved/store';
import type { SavedStayStore } from '@/saved/store';

jest.mock('@clerk/backend', () => ({ verifyToken: jest.fn() }));
jest.mock('@sanity/client', () => ({ createClient: jest.fn() }));
jest.mock('@/saved/store', () => ({ requireSavedStayStore: jest.fn() }));
jest.mock('@/saved/prune', () => ({
  // The prune has its own suite; here it only needs to hand the saves back.
  pruneOrphanSaves: jest.fn(async (saves: readonly unknown[]) => [...saves]),
}));

const verify = verifyToken as jest.Mock;
const requireStore = requireSavedStayStore as jest.Mock;

function store(overrides: Partial<SavedStayStore> = {}): SavedStayStore {
  return {
    read: jest.fn().mockResolvedValue({ saves: [], total: 0 }),
    create: jest.fn().mockResolvedValue('2026-10-01T10:00:00.000Z'),
    remove: jest.fn().mockResolvedValue(undefined),
    removeMany: jest.fn().mockResolvedValue(undefined),
    removeAll: jest.fn().mockResolvedValue(undefined),
    count: jest.fn().mockResolvedValue(1),
    ...overrides,
  };
}

function signedIn() {
  verify.mockResolvedValue({ sub: 'user_1' });
}

function post(body: unknown, headers: Record<string, string> = { Authorization: 'Bearer token' }) {
  return new Request('http://localhost/api/saved-stays', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

function del(url = 'http://localhost/api/saved-stays?stayId=stay-cabin', withAuth = true) {
  return new Request(url, {
    method: 'DELETE',
    headers: withAuth ? { Authorization: 'Bearer token' } : {},
  });
}

beforeEach(() => {
  jest.restoreAllMocks();
  verify.mockReset();
  requireStore.mockReset();
  process.env.CLERK_SECRET_KEY = 'test_secret';
  process.env.EXPO_PUBLIC_SANITY_PROJECT_ID = '9218z53u';
  process.env.EXPO_PUBLIC_SANITY_DATASET = 'production';
});

describe('the session check', () => {
  it('answers 401 and writes nothing when the request carries no session', async () => {
    const fakeStore = store();
    requireStore.mockReturnValue(fakeStore);

    const response = await POST(post({ stayId: 'stay-cabin' }, {}));

    expect(response.status).toBe(401);
    await expect(response.text()).resolves.toBe('');
    expect(fakeStore.create).not.toHaveBeenCalled();
  });

  it('answers 401 when the bearer token does not verify', async () => {
    verify.mockRejectedValue(new Error('bad token'));

    const response = await GET(
      new Request('http://localhost/api/saved-stays', {
        headers: { Authorization: 'Bearer nonsense' },
      }),
    );

    expect(response.status).toBe(401);
    expect(requireStore).not.toHaveBeenCalled();
  });

  it('answers 401 for a delete with no bearer token', async () => {
    const fakeStore = store();
    requireStore.mockReturnValue(fakeStore);

    const response = await DELETE(del(undefined, false));

    expect(response.status).toBe(401);
    expect(fakeStore.remove).not.toHaveBeenCalled();
  });
});

describe('body and query checks', () => {
  it('answers 422 when the body has no stay id', async () => {
    signedIn();
    const fakeStore = store();
    requireStore.mockReturnValue(fakeStore);

    const response = await POST(post({}));

    expect(response.status).toBe(422);
    expect(fakeStore.create).not.toHaveBeenCalled();
  });

  it('answers 422 when the stay id carries whitespace', async () => {
    signedIn();

    const response = await POST(post({ stayId: 'stay cabin' }));

    expect(response.status).toBe(422);
  });

  it('answers 422 when the stay id is longer than the route accepts', async () => {
    signedIn();

    const response = await POST(post({ stayId: 'a'.repeat(129) }));

    expect(response.status).toBe(422);
  });

  it('answers 422 when the delete has no stay id in the query string', async () => {
    signedIn();
    const fakeStore = store();
    requireStore.mockReturnValue(fakeStore);

    const response = await DELETE(del('http://localhost/api/saved-stays'));

    expect(response.status).toBe(422);
    expect(fakeStore.remove).not.toHaveBeenCalled();
  });

  it('answers 422 when the body is not JSON', async () => {
    signedIn();

    const response = await POST(
      new Request('http://localhost/api/saved-stays', {
        method: 'POST',
        headers: { Authorization: 'Bearer token' },
        body: 'not json',
      }),
    );

    expect(response.status).toBe(422);
  });
});

describe('a save that lands twice', () => {
  it('answers the original save time and the current count', async () => {
    signedIn();
    const create = jest.fn().mockResolvedValue('2026-10-01T10:00:00.000Z');
    requireStore.mockReturnValue(store({ create, count: jest.fn().mockResolvedValue(1) }));

    const first = await POST(post({ stayId: 'stay-cabin' }));
    const second = await POST(post({ stayId: 'stay-cabin' }));

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    await expect(first.json()).resolves.toEqual({
      stayId: 'stay-cabin',
      savedAt: '2026-10-01T10:00:00.000Z',
      count: 1,
    });
    await expect(second.json()).resolves.toEqual({
      stayId: 'stay-cabin',
      savedAt: '2026-10-01T10:00:00.000Z',
      count: 1,
    });
  });

  it('answers 500 when the store cannot write, so the heart can flip back', async () => {
    signedIn();
    requireStore.mockReturnValue(
      store({ create: jest.fn().mockRejectedValue(new Error('write denied')) }),
    );

    const response = await POST(post({ stayId: 'stay-cabin' }));

    expect(response.status).toBe(500);
  });
});

describe('the read', () => {
  it('answers the ids, the count and whether more exist', async () => {
    signedIn();
    requireStore.mockReturnValue(
      store({
        read: jest.fn().mockResolvedValue({
          saves: [{ stayId: 'stay-cabin', savedAt: '2026-10-01T10:00:00.000Z' }],
          total: 1,
        }),
      }),
    );

    const response = await GET(
      new Request('http://localhost/api/saved-stays', {
        headers: { Authorization: 'Bearer token' },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      stayIds: ['stay-cabin'],
      count: 1,
      hasMore: false,
    });
  });

  it('reports more saves than it returned', async () => {
    signedIn();
    requireStore.mockReturnValue(
      store({
        read: jest.fn().mockResolvedValue({
          saves: [{ stayId: 'stay-cabin', savedAt: '2026-10-01T10:00:00.000Z' }],
          total: 250,
        }),
      }),
    );

    const response = await GET(
      new Request('http://localhost/api/saved-stays', {
        headers: { Authorization: 'Bearer token' },
      }),
    );

    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({ count: 1, hasMore: true }),
    );
  });

  it('does not claim more saves when a pruned orphan shortened the list', async () => {
    signedIn();
    requireStore.mockReturnValue(
      store({
        read: jest.fn().mockResolvedValue({
          saves: [
            { stayId: 'stay-cabin', savedAt: '2026-10-01T10:00:00.000Z' },
            { stayId: 'stay-gone', savedAt: '2026-10-02T10:00:00.000Z' },
          ],
          total: 2,
        }),
      }),
    );

    const { pruneOrphanSaves } = jest.requireMock('@/saved/prune') as {
      pruneOrphanSaves: jest.Mock;
    };
    pruneOrphanSaves.mockImplementationOnce(async (saves: readonly { stayId: string }[]) =>
      saves.filter((save) => save.stayId !== 'stay-gone'),
    );

    const response = await GET(
      new Request('http://localhost/api/saved-stays', {
        headers: { Authorization: 'Bearer token' },
      }),
    );

    await expect(response.json()).resolves.toEqual({
      stayIds: ['stay-cabin'],
      count: 1,
      hasMore: false,
    });
  });

  it('asks the prune to delete through this guest own store', async () => {
    signedIn();
    const removeMany = jest.fn().mockResolvedValue(undefined);
    requireStore.mockReturnValue(
      store({
        removeMany,
        read: jest.fn().mockResolvedValue({
          saves: [{ stayId: 'stay-cabin', savedAt: '2026-10-01T10:00:00.000Z' }],
          total: 1,
        }),
      }),
    );

    const { pruneOrphanSaves } = jest.requireMock('@/saved/prune') as {
      pruneOrphanSaves: jest.Mock;
    };

    await GET(
      new Request('http://localhost/api/saved-stays', {
        headers: { Authorization: 'Bearer token' },
      }),
    );

    const deps = pruneOrphanSaves.mock.calls.at(-1)?.[1] as { deleteSaves: (ids: string[]) => void };

    await deps.deleteSaves(['stay-gone']);

    expect(removeMany).toHaveBeenCalledWith('user_1', ['stay-gone']);
  });
});

describe('the delete', () => {
  it('answers 200 with the stay id and the new count', async () => {
    signedIn();
    const remove = jest.fn().mockResolvedValue(undefined);
    requireStore.mockReturnValue(store({ remove, count: jest.fn().mockResolvedValue(0) }));

    const response = await DELETE(del());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ stayId: 'stay-cabin', count: 0 });
    expect(remove).toHaveBeenCalledWith('user_1', 'stay-cabin');
  });
});
