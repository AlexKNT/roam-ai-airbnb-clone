import { useEffect } from 'react';

import { PlaceholderScreen } from '@/components/placeholder-screen';
import { posthogLogger } from '@/config/posthog';
import { screenCopy } from '@/constants/copy';

export default function TripsScreen() {
  useEffect(() => {
    posthogLogger.info('trips_screen_displayed', { screen: 'trips' });
  }, []);

  return <PlaceholderScreen {...screenCopy.trips} />;
}
