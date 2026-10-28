import { ClerkProvider } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { useFonts } from 'expo-font';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { PostHogProvider } from 'posthog-react-native';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { ClerkAnalytics } from '@/components/clerk-analytics';
import { PolicyChatSessionReset } from '@/chat/session-reset';
import { posthog, posthogLogger } from '@/config/posthog';
import { SavedStaysProvider } from '@/saved/saved-stays-provider';
import { color, fontFamily } from '@/theme';

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

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: color.primary,
    background: color.surface,
    card: color.surface,
    text: color.textPrimary,
    border: color.border,
  },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    [fontFamily.regular]: require('@/assets/fonts/PlusJakartaSans-Regular.ttf'),
    [fontFamily.medium]: require('@/assets/fonts/PlusJakartaSans-Medium.ttf'),
    [fontFamily.semibold]: require('@/assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    [fontFamily.bold]: require('@/assets/fonts/PlusJakartaSans-Bold.ttf'),
  });

  useEffect(() => {
    posthogLogger.info('app_shell_started', { runtime: Platform.OS });
  }, []);

  // The splash stays up until the fonts settle, then leaves in every outcome,
  // including a failed load, which falls back to the system font.
  const fontsSettled = fontsLoaded || fontError !== null;

  useEffect(() => {
    if (!fontsSettled) return;

    if (fontError) {
      posthogLogger.info('font_load_failed', { message: fontError.message });
    }

    SplashScreen.hideAsync().catch(() => {});
  }, [fontError, fontsSettled]);

  if (!fontsSettled) return null;

  const app = (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: color.surfaceGray },
        }}
      />
    </ThemeProvider>
  );

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkAnalytics />
      <SavedStaysProvider>
        <PolicyChatSessionReset />
        {posthog ? <PostHogProvider client={posthog}>{app}</PostHogProvider> : app}
      </SavedStaysProvider>
    </ClerkProvider>
  );
}
