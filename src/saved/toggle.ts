export type SavedStaysStatus = 'idle' | 'loading' | 'ready' | 'error';

export type SavedStaysState = {
  guestId: string | null;
  status: SavedStaysStatus;
  /** Newest save first, the order Trips shows. */
  stayIds: readonly string[];
  /** Stay ids whose write is still running, so a second tap does nothing. */
  inFlight: readonly string[];
  hasMore: boolean;
};

export const emptySavedStays: SavedStaysState = {
  guestId: null,
  status: 'idle',
  stayIds: [],
  inFlight: [],
  hasMore: false,
};

export type SavedStaysEvent =
  | { type: 'loadStarted'; guestId: string }
  | { type: 'loadSucceeded'; guestId: string; stayIds: readonly string[]; hasMore: boolean }
  | { type: 'loadFailed'; guestId: string }
  | { type: 'toggleStarted'; stayId: string }
  | { type: 'toggleSucceeded'; stayId: string }
  | { type: 'toggleFailed'; stayId: string; wasSaved: boolean }
  | { type: 'signedOut' };

export function savedStaysReducer(
  state: SavedStaysState,
  event: SavedStaysEvent,
): SavedStaysState {
  switch (event.type) {
    case 'loadStarted':
      if (state.guestId === event.guestId && state.status === 'loading') return state;

      return { ...emptySavedStays, guestId: event.guestId, status: 'loading' };

    case 'loadSucceeded':
      return {
        guestId: event.guestId,
        status: 'ready',
        stayIds: event.stayIds,
        inFlight: state.inFlight,
        hasMore: event.hasMore,
      };

    case 'loadFailed':
      return { ...emptySavedStays, guestId: event.guestId, status: 'error' };

    case 'toggleStarted': {
      if (state.inFlight.includes(event.stayId)) return state;

      return {
        ...state,
        stayIds: withSave(state.stayIds, event.stayId, !state.stayIds.includes(event.stayId)),
        inFlight: [...state.inFlight, event.stayId],
      };
    }

    case 'toggleSucceeded':
      return { ...state, inFlight: state.inFlight.filter((id) => id !== event.stayId) };

    case 'toggleFailed':
      return {
        ...state,
        stayIds: withSave(state.stayIds, event.stayId, event.wasSaved),
        inFlight: state.inFlight.filter((id) => id !== event.stayId),
      };

    case 'signedOut':
      return emptySavedStays;

    default:
      return state;
  }
}

/** `saved` is the state the list should end up in; an unchanged list keeps its identity. */
export function withSave(
  stayIds: readonly string[],
  stayId: string,
  saved: boolean,
): readonly string[] {
  const current = stayIds.includes(stayId);

  if (current === saved) return stayIds;
  if (!saved) return stayIds.filter((id) => id !== stayId);

  return [stayId, ...stayIds];
}
