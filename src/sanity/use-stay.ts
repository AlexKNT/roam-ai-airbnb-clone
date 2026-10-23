import { useCallback } from 'react';

import { getStayBySlug } from './queries';
import type { StayDetail } from './types';
import { useSanityQuery } from './use-query';

export type StayState = {
  status: 'loading' | 'error' | 'notFound' | 'ready';
  data: StayDetail | null;
  error: string | null;
  retry: () => void;
};

export function useStay(slug: string | undefined): StayState {
  const resolvedSlug = slug?.trim() ?? '';
  const load = useCallback(() => getStayBySlug(resolvedSlug), [resolvedSlug]);

  const state = useSanityQuery({
    queryKey: resolvedSlug,
    enabled: resolvedSlug.length > 0,
    initialData: null,
    load,
  });

  const status =
    state.status === 'ready' && state.data === null ? ('notFound' as const) : state.status;

  return {
    status,
    data: state.data,
    error: state.error,
    retry: state.retry,
  };
}
