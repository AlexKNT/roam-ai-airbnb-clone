import { useCallback, useEffect, useState } from 'react';

import { markOnboardingSeen, readOnboardingSeen } from '@/onboarding/seen';

/** `seen` is null while the stored flag is still being read. */
export function useOnboardingSeen() {
  const [seen, setSeen] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;

    readOnboardingSeen().then((value) => {
      if (active) setSeen(value);
    });

    return () => {
      active = false;
    };
  }, []);

  const markSeen = useCallback(async () => {
    setSeen(true);
    await markOnboardingSeen();
  }, []);

  return { seen, markSeen };
}
