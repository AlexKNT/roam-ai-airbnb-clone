import { useUser } from '@clerk/expo';
import { useEffect } from 'react';

import { posthog } from '@/config/posthog';

/**
 * Ties PostHog identity to the Clerk session. Fails silently: analytics must
 * never block the app.
 */
export function ClerkAnalytics() {
  const { isLoaded, user } = useUser();

  useEffect(() => {
    if (!isLoaded || !posthog) return;

    try {
      if (user) {
        posthog.identify(user.id);
      } else {
        posthog.reset();
      }
    } catch {
      // Analytics is non-critical.
    }
  }, [isLoaded, user]);

  return null;
}
