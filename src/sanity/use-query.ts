import { ClientError } from '@sanity/client';
import { useCallback, useEffect, useRef, useState } from 'react';

import { stayCopy } from '@/constants/copy';

import { SanityConfigurationError } from './client';

type LoadStatus = 'loading' | 'error' | 'ready';

export type QueryState<T> = {
  status: LoadStatus;
  data: T;
  error: string | null;
  retry: () => void;
};

type UseSanityQueryOptions<T> = {
  queryKey: string;
  enabled?: boolean;
  initialData: T;
  load: () => Promise<T>;
};

type Snapshot<T> = {
  queryKey: string;
  attempt: number;
  status: LoadStatus;
  data: T;
  error: string | null;
};

function describeError(error: unknown): string {
  if (error instanceof SanityConfigurationError) {
    return stayCopy.configurationError;
  }

  if (error instanceof ClientError && error.statusCode === 403) {
    return stayCopy.configurationError;
  }

  return stayCopy.loadError;
}

export function useSanityQuery<T>({
  queryKey,
  enabled = true,
  initialData,
  load,
}: UseSanityQueryOptions<T>): QueryState<T> {
  const [attempt, setAttempt] = useState(0);
  const [snapshot, setSnapshot] = useState<Snapshot<T>>({
    queryKey,
    attempt: 0,
    status: 'loading',
    data: initialData,
    error: null,
  });
  const requestId = useRef(0);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const request = requestId.current + 1;
    requestId.current = request;
    const settle = (next: Omit<Snapshot<T>, 'queryKey' | 'attempt'>) => {
      if (requestId.current === request) {
        setSnapshot({ queryKey, attempt, ...next });
      }
    };

    load().then(
      (data) => settle({ status: 'ready', data, error: null }),
      (error: unknown) =>
        settle({ status: 'error', data: initialData, error: describeError(error) }),
    );

    return () => {
      requestId.current += 1;
    };
  }, [queryKey, enabled, attempt, initialData, load]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  const settled = snapshot.queryKey === queryKey && snapshot.attempt === attempt;
  const state = settled
    ? snapshot
    : { status: 'loading' as const, data: initialData, error: null };

  return { ...state, retry };
}
