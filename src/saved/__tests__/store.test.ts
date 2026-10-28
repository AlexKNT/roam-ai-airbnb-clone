import type { SanityClient } from '@sanity/client';

import { SAVED_STAYS_LIMIT } from '../limits';
import { createSavedStayStore } from '../store';

// The real client is ESM only, and nothing here talks to Sanity.
jest.mock('@sanity/client', () => ({ createClient: jest.fn() }));

function fakeClient(overrides: Record<string, unknown> = {}) {
  const transaction = { delete: jest.fn(), commit: jest.fn().mockResolvedValue(undefined) };
  transaction.delete.mockReturnValue(transaction);

  const client = {
    createIfNotExists: jest.fn().mockResolvedValue({ _id: 'savedStay.user_1.stay-cabin' }),
    getDocument: jest.fn().mockResolvedValue({ savedAt: '2026-10-01T10:00:00.000Z' }),
    delete: jest.fn().mockResolvedValue(undefined),
    fetch: jest.fn().mockResolvedValue(0),
    transaction: jest.fn(() => transaction),
    ...overrides,
  };

  return { client: client as unknown as SanityClient, transaction, raw: client };
}

describe('createSavedStayStore.create', () => {
  it('writes one document under the id built from the guest and the stay', async () => {
    const { client, raw } = fakeClient();

    await createSavedStayStore(client).create('user_1', 'stay-cabin');

    expect(raw.createIfNotExists).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: 'savedStay.user_1.stay-cabin',
        _type: 'savedStay',
        guestId: 'user_1',
        stayId: 'stay-cabin',
      }),
    );
  });

  it('answers the save time the document already holds, so a repeat saves nothing new', async () => {
    const { client } = fakeClient({
      getDocument: jest.fn().mockResolvedValue({ savedAt: '2026-01-05T08:30:00.000Z' }),
    });

    await expect(createSavedStayStore(client).create('user_1', 'stay-cabin')).resolves.toBe(
      '2026-01-05T08:30:00.000Z',
    );
  });
});

describe('createSavedStayStore read and count', () => {
  it('returns the saves and the full total from one query', async () => {
    const { client, raw } = fakeClient({
      fetch: jest.fn().mockResolvedValue({
        saves: [{ stayId: 'stay-beach', savedAt: '2026-10-03T10:00:00.000Z' }],
        total: 1,
      }),
    });

    const snapshot = await createSavedStayStore(client).read('user_1');

    expect(snapshot).toEqual({
      saves: [{ stayId: 'stay-beach', savedAt: '2026-10-03T10:00:00.000Z' }],
      total: 1,
    });
    expect(raw.fetch).toHaveBeenCalledWith(expect.any(String), {
      guestId: 'user_1',
      limit: SAVED_STAYS_LIMIT,
    });
  });

  it('never reports a count above what the read can show', async () => {
    const { client } = fakeClient({ fetch: jest.fn().mockResolvedValue(SAVED_STAYS_LIMIT + 40) });

    await expect(createSavedStayStore(client).count('user_1')).resolves.toBe(SAVED_STAYS_LIMIT);
  });
});

describe('createSavedStayStore removal', () => {
  it('deletes the one document for that guest and stay', async () => {
    const { client, raw } = fakeClient();

    await createSavedStayStore(client).remove('user_1', 'stay-cabin');

    expect(raw.delete).toHaveBeenCalledWith('savedStay.user_1.stay-cabin');
  });

  it('deletes each pruned save inside one transaction', async () => {
    const { client, transaction } = fakeClient();

    await createSavedStayStore(client).removeMany('user_1', ['stay-a', 'stay-b']);

    expect(transaction.delete).toHaveBeenCalledWith('savedStay.user_1.stay-a');
    expect(transaction.delete).toHaveBeenCalledWith('savedStay.user_1.stay-b');
    expect(transaction.commit).toHaveBeenCalledTimes(1);
  });

  it('writes nothing when there is nothing to prune', async () => {
    const { client, raw } = fakeClient();

    await createSavedStayStore(client).removeMany('user_1', []);

    expect(raw.transaction).not.toHaveBeenCalled();
  });

  it('deletes every save for the guest in one query mutation', async () => {
    const { client, raw } = fakeClient();

    await createSavedStayStore(client).removeAll('user_1');

    expect(raw.delete).toHaveBeenCalledWith({
      query: '*[_type == "savedStay" && guestId == $guestId]',
      params: { guestId: 'user_1' },
    });
  });
});
