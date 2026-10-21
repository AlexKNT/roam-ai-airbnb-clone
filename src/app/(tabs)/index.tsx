import { useEffect } from 'react';

import { PlaceholderScreen } from '@/components/placeholder-screen';
import { posthogLogger } from '@/config/posthog';
import { screenCopy } from '@/constants/copy';

export default function HomeScreen() {
  useEffect(() => {
    posthogLogger.info('home_screen_displayed', { screen: 'home' });
  }, []);

  return <PlaceholderScreen {...screenCopy.index} />;
}
