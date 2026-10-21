import { useEffect } from 'react';

import { PlaceholderScreen } from '@/components/placeholder-screen';
import { posthogLogger } from '@/config/posthog';
import { screenCopy } from '@/constants/copy';

export default function ProfileScreen() {
  useEffect(() => {
    posthogLogger.info('profile_screen_displayed', { screen: 'profile' });
  }, []);

  return <PlaceholderScreen {...screenCopy.profile} />;
}
