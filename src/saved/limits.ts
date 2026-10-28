/** The newest saves a guest reads at once. Trips shows at most this many rows. */
export const SAVED_STAYS_LIMIT = 200;

export const SAVED_STAYS_WINDOW_MS = 10 * 60 * 1000;
export const SAVED_STAYS_READ_MAX = 60;
export const SAVED_STAYS_WRITE_MAX = 30;

/** The map is swept once it holds this many guests, so it cannot grow without bound. */
const SWEEP_THRESHOLD = 500;

export type RequestWindow = {
  take: (key: string) => boolean;
};

/** A sliding window per guest, kept in memory for the life of the server instance. */
export function createRequestWindow(
  max: number,
  windowMs: number,
  now: () => number = Date.now,
): RequestWindow {
  const log = new Map<string, number[]>();

  const sweep = (windowStart: number) => {
    for (const [key, times] of log) {
      if (!times.some((time) => time > windowStart)) log.delete(key);
    }
  };

  return {
    take(key) {
      const at = now();
      const windowStart = at - windowMs;
      const recent = (log.get(key) ?? []).filter((time) => time > windowStart);

      if (recent.length >= max) {
        log.set(key, recent);
        return false;
      }

      recent.push(at);
      log.set(key, recent);

      if (log.size > SWEEP_THRESHOLD) sweep(windowStart);

      return true;
    },
  };
}

export const savedStayReads = createRequestWindow(SAVED_STAYS_READ_MAX, SAVED_STAYS_WINDOW_MS);
export const savedStayWrites = createRequestWindow(SAVED_STAYS_WRITE_MAX, SAVED_STAYS_WINDOW_MS);
