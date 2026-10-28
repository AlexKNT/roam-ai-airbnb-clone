import { posthog } from '@/config/posthog';

export type ProfileScreen = 'profile' | 'personal_info' | 'policies' | 'settings';

/** Only the screen name: never the guest's name, place, email or anything typed. */
function track(event: string, screen: ProfileScreen) {
  try {
    posthog?.capture(event, { screen });
  } catch {
    // Analytics never blocks an account action.
  }
}

export function trackProfileOpened(screen: ProfileScreen) {
  track('profile_opened', screen);
}

export function trackPersonalInfoSaved(screen: ProfileScreen) {
  track('personal_info_saved', screen);
}

export function trackSignedOut(screen: ProfileScreen) {
  track('signed_out', screen);
}

export function trackAccountDeleted(screen: ProfileScreen) {
  track('account_deleted', screen);
}
