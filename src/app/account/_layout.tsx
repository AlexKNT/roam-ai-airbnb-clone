import { useAuth } from '@clerk/expo';
import { Redirect, Stack } from 'expo-router';

import { personalInfoCopy, policiesCopy, settingsCopy } from '@/constants/copy';
import { color, fontFamily, type } from '@/theme';

export default function AccountLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/sign-in" />;

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: color.surface },
        headerShadowVisible: false,
        headerTintColor: color.textPrimary,
        headerTitleStyle: { ...type.subheading, fontFamily: fontFamily.bold },
        contentStyle: { backgroundColor: color.surface },
      }}>
      <Stack.Screen name="personal-info" options={{ title: personalInfoCopy.title }} />
      <Stack.Screen name="policies" options={{ title: policiesCopy.title }} />
      <Stack.Screen name="settings" options={{ title: settingsCopy.title }} />
    </Stack>
  );
}
