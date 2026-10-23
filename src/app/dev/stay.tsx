import { Redirect } from 'expo-router';

import StayScreen from '@/app/stay/[slug]';

/** Renders the stay detail outside the Clerk gate so the design can be looked at in a dev build. */
export default function StayPreviewScreen() {
  if (!__DEV__) return <Redirect href="/" />;

  return <StayScreen />;
}
