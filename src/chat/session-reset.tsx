import { useAuth } from '@clerk/expo';
import { useEffect } from 'react';

import { clearPolicyChatThreads } from './store';

/** A signed out guest keeps no conversation: the thread store empties with the session. */
export function PolicyChatSessionReset() {
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && !isSignedIn) clearPolicyChatThreads();
  }, [isLoaded, isSignedIn]);

  return null;
}
