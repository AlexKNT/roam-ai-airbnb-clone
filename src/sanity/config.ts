import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra;

export const sanityProjectId = (extra?.sanityProjectId as string | undefined)?.trim() ?? '';
export const sanityDataset = (extra?.sanityDataset as string | undefined)?.trim() ?? '';

const missingVariable = !sanityProjectId
  ? 'EXPO_PUBLIC_SANITY_PROJECT_ID'
  : !sanityDataset
    ? 'EXPO_PUBLIC_SANITY_DATASET'
    : null;

if (__DEV__ && missingVariable) {
  throw new Error(
    `${missingVariable} variable required by Sanity is missing or un-configured, the app cannot load stays. This error stops appearing once ${missingVariable} is configured`,
  );
}
