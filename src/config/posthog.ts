import Constants from 'expo-constants';
import PostHog from 'posthog-react-native';
import { Platform } from 'react-native';

const extra = Constants.expoConfig?.extra;
const projectToken = extra?.posthogProjectToken as string | undefined;
const host = extra?.posthogHost as string | undefined;

// posthog-react-native only ships native storage; on web (and during SSR) fall
// back to localStorage when the browser provides it.
const webStorage = {
  getItem: (key: string) =>
    typeof localStorage === 'undefined' ? null : localStorage.getItem(key),
  setItem: (key: string, value: string) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
  },
};

const missingConfiguration = !projectToken || !host;

if (__DEV__ && missingConfiguration) {
  const missingVariable = !projectToken
    ? 'EXPO_PUBLIC_POSTHOG_KEY'
    : 'EXPO_PUBLIC_POSTHOG_HOST';

  throw new Error(
    `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`,
  );
}

export const posthog = missingConfiguration
  ? null
  : new PostHog(projectToken as string, {
      host: host as string,
      captureAppLifecycleEvents: true,
      customStorage: Platform.OS === 'web' ? webStorage : undefined,
      logs: {
        serviceName: 'roam-mobile',
        environment: __DEV__ ? 'development' : 'production',
      },
      errorTracking: {
        autocapture: {
          uncaughtExceptions: true,
          unhandledRejections: true,
          console: [],
        },
      },
    });

type LogAttributes = Record<string, string | number | boolean>;

export const posthogLogger = {
  info: (message: string, attributes: LogAttributes) => {
    posthog?.logger.info(message, attributes);
  },
  warn: (message: string, attributes: LogAttributes) => {
    posthog?.logger.warn(message, attributes);
  },
};
