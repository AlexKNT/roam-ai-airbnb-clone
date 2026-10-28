import { pruneOrphanSaves, type PruneDeps } from '../prune';

const saves = [
  { stayId: 'stay-cabin', savedAt: '2026-10-01T10:00:00.000Z' },
  { stayId: 'stay-gone', savedAt: '2026-10-02T10:00:00.000Z' },
  { stayId: 'stay-beach', savedAt: '2026-10-03T10:00:00.000Z' },
];

function deps(overrides: Partial<PruneDeps> = {}) {
  const deleteSaves = jest.fn().mockResolvedValue(undefined);
  const log = jest.fn();

  return {
    deleteSaves,
    log,
    liveStayIds: jest.fn().mockResolvedValue(new Set(['stay-cabin', 'stay-beach'])),
    ...overrides,
  } satisfies PruneDeps;
}

describe('pruneOrphanSaves', () => {
  it('keeps only the saves whose stay still exists', async () => {
    const kept = await pruneOrphanSaves(saves, deps());

    expect(kept.map((save) => save.stayId)).toEqual(['stay-cabin', 'stay-beach']);
  });

  it('deletes the orphans, and only the ones this read returned', async () => {
    const pruneDeps = deps();

    await pruneOrphanSaves(saves, pruneDeps);

    expect(pruneDeps.deleteSaves).toHaveBeenCalledWith(['stay-gone']);
  });

  it('does not write when every stay is still there', async () => {
    const pruneDeps = deps({
      liveStayIds: jest.fn().mockResolvedValue(new Set(['stay-cabin', 'stay-beach', 'stay-gone'])),
    });

    const kept = await pruneOrphanSaves(saves, pruneDeps);

    expect(kept).toHaveLength(3);
    expect(pruneDeps.deleteSaves).not.toHaveBeenCalled();
  });

  it('keeps every save and logs when the live check fails', async () => {
    const pruneDeps = deps({
      liveStayIds: jest.fn().mockRejectedValue(new Error('public dataset is down')),
    });

    const kept = await pruneOrphanSaves(saves, pruneDeps);

    expect(kept).toHaveLength(3);
    expect(pruneDeps.deleteSaves).not.toHaveBeenCalled();
    expect(pruneDeps.log).toHaveBeenCalledWith(
      'saved_stays_prune_check_failed',
      expect.objectContaining({ reason: 'Error' }),
    );
  });

  it('still answers the read when deleting an orphan fails', async () => {
    const pruneDeps = deps({ deleteSaves: jest.fn().mockRejectedValue(new Error('write denied')) });

    const kept = await pruneOrphanSaves(saves, pruneDeps);

    expect(kept.map((save) => save.stayId)).toEqual(['stay-cabin', 'stay-beach']);
    expect(pruneDeps.log).toHaveBeenCalledWith(
      'saved_stays_prune_failed',
      expect.objectContaining({ reason: 'Error', count: 1 }),
    );
  });

  it('asks nothing of the store when the guest has no saves', async () => {
    const pruneDeps = deps();

    await expect(pruneOrphanSaves([], pruneDeps)).resolves.toEqual([]);
    expect(pruneDeps.liveStayIds).not.toHaveBeenCalled();
  });
});
