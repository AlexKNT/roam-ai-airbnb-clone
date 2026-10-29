import { useAuth } from '@clerk/expo';
import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/tab-bar';
import { tabItems } from '@/constants/copy';
import { useOnboardingSeen } from '@/onboarding/use-onboarding-seen';
import { color } from '@/theme';

export default function TabsLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const { seen } = useOnboardingSeen();

  if (!isLoaded || seen === null) return null;
  if (!isSignedIn) return <Redirect href={seen ? '/sign-in' : '/onboarding'} />;

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: color.surfaceGray },
      }}>
      {tabItems.map((tab) => (
        <Tabs.Screen key={tab.route} name={tab.route} options={{ title: tab.label }} />
      ))}
    </Tabs>
  );
}
