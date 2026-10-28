import { Redirect } from 'expo-router';

import ProfileScreen from '@/app/(tabs)/profile';

/** Renders Profile outside the Clerk gate so the design can be looked at in a dev build. */
export default function ProfilePreviewScreen() {
  if (!__DEV__) return <Redirect href="/" />;

  return <ProfileScreen />;
}
