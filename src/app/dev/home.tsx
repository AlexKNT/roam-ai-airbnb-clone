import { Redirect } from 'expo-router';

import HomeScreen from '@/app/(tabs)/index';

/** Renders Home outside the Clerk gate so the feed can be looked at in a dev build. */
export default function HomePreviewScreen() {
  if (!__DEV__) return <Redirect href="/" />;

  return <HomeScreen />;
}
