import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const SEEN_KEY = 'roam.onboarding.seen';

function webStore(): Storage | null {
  return typeof globalThis.localStorage === 'undefined' ? null : globalThis.localStorage;
}

export async function readOnboardingSeen(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') return webStore()?.getItem(SEEN_KEY) === 'true';

    return (await SecureStore.getItemAsync(SEEN_KEY)) === 'true';
  } catch {
    // A failed read shows the slides one more time, which costs nothing.
    return false;
  }
}

export async function markOnboardingSeen(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      webStore()?.setItem(SEEN_KEY, 'true');
      return;
    }

    await SecureStore.setItemAsync(SEEN_KEY, 'true');
  } catch {
    // The guest may see the slides again next launch; nothing else depends on it.
  }
}
