import Constants from 'expo-constants';

/** `expo-constants` carries the version from `app.json`, which every build ships with. */
export function readAppVersion(): string {
  const version = Constants.expoConfig?.version?.trim();

  return version ? version : 'unknown';
}
