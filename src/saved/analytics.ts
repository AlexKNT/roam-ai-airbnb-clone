import { posthog } from '@/config/posthog';

import type { SavedStayScreen } from './screens';

/** Only the stay id and the screen: never anything a guest typed. */
export function trackSaveChanged(
  action: 'saved' | 'unsaved',
  stayId: string,
  screen: SavedStayScreen,
) {
  try {
    posthog?.capture(action === 'saved' ? 'stay_saved' : 'stay_unsaved', {
      stay_id: stayId,
      screen,
    });
  } catch {
    // Analytics never blocks a toggle.
  }
}
