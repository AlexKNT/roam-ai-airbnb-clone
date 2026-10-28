import { createClerkClient, verifyToken } from '@clerk/backend';
import { isClerkAPIResponseError } from '@clerk/backend/errors';

import { DELETE } from '@/app/api/account+api';
import { requireSavedStayStore } from '@/saved/store';
import type { SavedStayStore } from '@/saved/store';

jest.mock('@clerk/backend', () => ({ createClerkClient: jest.fn(), verifyToken: jest.fn() }));
jest.mock('@clerk/backend/errors', () => ({ isClerkAPIResponseError: jest.fn() }));
jest.mock('@/saved/store', () => ({ requireSavedStayStore: jest.fn() }));

const verify = verifyToken as jest.Mock;
const createClient = createClerkClient as jest.Mock;
const isClerkError = isClerkAPIResponseError as unknown as jest.Mock;
const requireStore = requireSavedStayStore as jest.Mock;

const TEST_TOKEN = 'test_token';
const AUTH_HEADER = { Authorization: `Bearer ${TEST_TOKEN}` };

type FakeStore = SavedStayStore & { removeAll: jest.Mock };

function store(removeAll = jest.fn().mockResolvedValue(undefined)): FakeStore {
  return {
    read: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
    removeMany: jest.fn(),
    removeAll,
    count: jest.fn(),
  } as unknown as FakeStore;
}

function deleteUser() {
  const users = { deleteUser: jest.fn().mockResolvedValue({ id: 'user_1' }) };

  createClient.mockReturnValue({ users });

  return users.deleteUser;
}

function request(withAuth = true) {
  return new Request('http://localhost/api/account', {
    method: 'DELETE',
    headers: withAuth ? AUTH_HEADER : {},
  });
}

beforeEach(() => {
  jest.resetAllMocks();
  process.env.CLERK_SECRET_KEY = 'test_secret';
  isClerkError.mockReturnValue(false);
  verify.mockResolvedValue({ sub: 'user_1' });
  createClient.mockReturnValue({ users: { deleteUser: jest.fn() } });
  requireStore.mockReturnValue(store());
});

describe('the session check', () => {
  it('answers 401 with an empty body and changes nothing without a session', async () => {
    const fakeStore = store();
    requireStore.mockReturnValue(fakeStore);
    const removeUser = deleteUser();

    const response = await DELETE(request(false));

    expect(response.status).toBe(401);
    await expect(response.text()).resolves.toBe('');
    expect(fakeStore.removeAll).not.toHaveBeenCalled();
    expect(removeUser).not.toHaveBeenCalled();
  });

  it('answers 401 when the bearer token does not verify', async () => {
    verify.mockRejectedValue(new Error('bad token'));

    const response = await DELETE(request());

    expect(response.status).toBe(401);
    expect(requireStore).not.toHaveBeenCalled();
  });
});

describe('the purge and the Clerk delete', () => {
  it('deletes the token subject saves before the user', async () => {
    const order: string[] = [];
    const fakeStore = store(jest.fn(async () => void order.push('purge')));
    requireStore.mockReturnValue(fakeStore);
    const removeUser = deleteUser();
    removeUser.mockImplementation(async () => void order.push('delete'));

    const response = await DELETE(request());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ deleted: true });
    expect(fakeStore.removeAll).toHaveBeenCalledWith('user_1');
    expect(removeUser).toHaveBeenCalledWith('user_1');
    expect(order).toEqual(['purge', 'delete']);
  });

  it('answers 500 and never deletes the user when the purge fails', async () => {
    const fakeStore = store(jest.fn().mockRejectedValue(new Error('write denied')));
    requireStore.mockReturnValue(fakeStore);
    const removeUser = deleteUser();

    const response = await DELETE(request());

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'account_delete_failed' });
    expect(removeUser).not.toHaveBeenCalled();
  });

  it('answers 500 when the user delete fails, so the screen can offer a retry', async () => {
    const fakeStore = store();
    requireStore.mockReturnValue(fakeStore);
    deleteUser().mockRejectedValue(new Error('clerk down'));

    const response = await DELETE(request());

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'account_delete_failed' });
    expect(fakeStore.removeAll).toHaveBeenCalledTimes(1);
  });

  it('counts a user that is already gone as a successful delete', async () => {
    const fakeStore = store();
    requireStore.mockReturnValue(fakeStore);
    const gone = { status: 404, errors: [{ code: 'resource_not_found' }] };
    deleteUser().mockRejectedValue(gone);
    isClerkError.mockImplementation((error: unknown) => error === gone);

    const response = await DELETE(request());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ deleted: true });
  });
});

describe('the attempt limit', () => {
  it('answers 429 after five attempts in the window for one subject', async () => {
    verify.mockResolvedValue({ sub: 'user_rate_limited' });

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const allowed = await DELETE(request());
      expect(allowed.status).toBe(200);
    }

    const response = await DELETE(request());

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({ error: 'rate_limited' });
  });
});
