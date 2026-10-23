import { useAuth } from '@clerk/expo';
import { Redirect, Stack } from 'expo-router';

import { color } from '@/theme';

export default function StayLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/sign-in" />;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.surface } }} />
  );
}
