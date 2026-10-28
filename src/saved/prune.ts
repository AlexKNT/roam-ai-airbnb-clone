export type PruneDeps = {
  /** The stay ids that still exist and are published, from the public dataset. */
  liveStayIds: (stayIds: readonly string[]) => Promise<Set<string>>;
  deleteSaves: (stayIds: readonly string[]) => Promise<void>;
  log?: (message: string, details: Record<string, unknown>) => void;
};

/**
 * A save never outlives its stay, but the prune is best effort: a failure to
 * check or to delete only leaves the orphan for the next read.
 */
export async function pruneOrphanSaves<T extends { stayId: string }>(
  saves: readonly T[],
  deps: PruneDeps,
): Promise<T[]> {
  if (saves.length === 0) return [];

  const ids = saves.map((save) => save.stayId);

  let live: Set<string>;

  try {
    live = await deps.liveStayIds(ids);
  } catch (error) {
    deps.log?.('saved_stays_prune_check_failed', { reason: describe(error) });

    return [...saves];
  }

  const kept = saves.filter((save) => live.has(save.stayId));
  const orphans = saves.filter((save) => !live.has(save.stayId)).map((save) => save.stayId);

  if (orphans.length === 0) return kept;

  try {
    await deps.deleteSaves(orphans);
  } catch (error) {
    deps.log?.('saved_stays_prune_failed', { reason: describe(error), count: orphans.length });
  }

  return kept;
}

function describe(error: unknown): string {
  return error instanceof Error ? error.name : 'unknown';
}
