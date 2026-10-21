import { ClerkProvider } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { PostHogProvider } from 'posthog-react-native';
import { useEffect } from 'react';
import { Platform, useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ClerkAnalytics } from '@/components/clerk-analytics';
import { posthog, posthogLogger } from '@/config/posthog';

SplashScreen.preventAutoHideAsync();

function getPublishableKey() {
  const key = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error(
      'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is missing. Run `npx clerk@latest env pull` to write it to .env.local.',
    );
  }
  return key;
}

const publishableKey = getPublishableKey();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    posthogLogger.info('app_shell_started', { runtime: Platform.OS });
  }, []);

  const app = (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkAnalytics />
      {posthog ? <PostHogProvider client={posthog}>{app}</PostHogProvider> : app}
    </ClerkProvider>
  );
}
