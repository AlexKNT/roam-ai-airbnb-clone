import { useContext } from 'react';

import { SavedStaysContext, type SavedStaysValue } from './context';

export function useSavedStays(): SavedStaysValue {
  const value = useContext(SavedStaysContext);

  if (!value) {
    throw new Error('useSavedStays needs a SavedStaysProvider above it.');
  }

  return value;
}
