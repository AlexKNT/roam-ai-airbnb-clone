import { useAuth } from '@clerk/expo';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';

import { Notice } from '@/components/ui/notice';
import { savedStaysCopy } from '@/constants/copy';

import { trackSaveChanged } from './analytics';
import { fetchSavedStays, saveStay, unsaveStay } from './api';
import { SavedStaysContext, type SavedStaysValue } from './context';
import type { SavedStayScreen } from './screens';
import { emptySavedStays, savedStaysReducer, withSave } from './toggle';

export function SavedStaysProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();
  const [state, dispatch] = useReducer(savedStaysReducer, emptySavedStays);
  const [attempt, setAttempt] = useState(0);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const idsRef = useRef(state.stayIds);
  const inFlight = useRef(new Set<string>());
  // Clerk hands back a new function on each render, so the effect reads it through a ref.
  const getTokenRef = useRef(getToken);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  useEffect(() => {
    idsRef.current = state.stayIds;
  }, [state.stayIds]);

  // One read per session, and none without one. Signing out empties the list.
  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !userId) {
      dispatch({ type: 'signedOut' });
      return;
    }

    let active = true;

    dispatch({ type: 'loadStarted', guestId: userId });

    void (async () => {
      try {
        const token = await getTokenRef.current();
        if (!token) throw new Error('No session token.');

        const list = await fetchSavedStays(token);
        if (!active) return;

        dispatch({
          type: 'loadSucceeded',
          guestId: userId,
          stayIds: list.stayIds,
          hasMore: list.hasMore,
        });
      } catch {
        if (active) dispatch({ type: 'loadFailed', guestId: userId });
      }
    })();

    return () => {
      active = false;
    };
  }, [attempt, isLoaded, isSignedIn, userId]);

  const toggle = useCallback(
    (stayId: string, screen: SavedStayScreen) => {
      if (inFlight.current.has(stayId)) return;

      const wasSaved = idsRef.current.includes(stayId);

      inFlight.current.add(stayId);
      idsRef.current = withSave(idsRef.current, stayId, !wasSaved);
      dispatch({ type: 'toggleStarted', stayId });

      void (async () => {
        try {
          const token = await getTokenRef.current();
          if (!token) throw new Error('No session token.');

          if (wasSaved) await unsaveStay(token, stayId);
          else await saveStay(token, stayId);

          dispatch({ type: 'toggleSucceeded', stayId });
          trackSaveChanged(wasSaved ? 'unsaved' : 'saved', stayId, screen);
        } catch {
          idsRef.current = withSave(idsRef.current, stayId, wasSaved);
          dispatch({ type: 'toggleFailed', stayId, wasSaved });
          setNoticeOpen(true);
        } finally {
          inFlight.current.delete(stayId);
        }
      })();
    },
    [],
  );

  const value = useMemo<SavedStaysValue>(() => {
    const stayIds = state.stayIds;

    return {
      status: state.status,
      stayIds,
      count: stayIds.length,
      hasMore: state.hasMore,
      isSaved: (stayId) => stayIds.includes(stayId),
      toggle,
      retry: () => setAttempt((current) => current + 1),
    };
  }, [state.hasMore, state.status, state.stayIds, toggle]);

  return (
    <SavedStaysContext.Provider value={value}>
      {children}
      <Notice
        visible={noticeOpen}
        title={savedStaysCopy.saveFailedTitle}
        message={savedStaysCopy.saveFailedMessage}
        dismissLabel={savedStaysCopy.noticeDismiss}
        onClose={() => setNoticeOpen(false)}
      />
    </SavedStaysContext.Provider>
  );
}
