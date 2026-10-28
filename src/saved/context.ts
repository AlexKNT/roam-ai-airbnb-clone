import { createContext } from 'react';

import type { SavedStayScreen } from './screens';
import type { SavedStaysStatus } from './toggle';

export type SavedStaysValue = {
  status: SavedStaysStatus;
  /** The saves the list holds, newest first. Trips renders these. */
  stayIds: readonly string[];
  count: number;
  hasMore: boolean;
  isSaved: (stayId: string) => boolean;
  toggle: (stayId: string, screen: SavedStayScreen) => void;
  retry: () => void;
};

export const SavedStaysContext = createContext<SavedStaysValue | null>(null);
