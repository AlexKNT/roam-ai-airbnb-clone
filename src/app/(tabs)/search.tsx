import { useEffect } from 'react';

import { PlaceholderScreen } from '@/components/placeholder-screen';
import { posthogLogger } from '@/config/posthog';
import { screenCopy } from '@/constants/copy';

export default function SearchScreen() {
  useEffect(() => {
    posthogLogger.info('search_screen_displayed', { screen: 'search' });
  }, []);

  return <PlaceholderScreen {...screenCopy.search} />;
}
