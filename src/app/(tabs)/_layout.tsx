import { useAuth } from '@clerk/expo';
import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/tab-bar';
import { tabItems } from '@/constants/copy';
import { color } from '@/theme';

export default function TabsLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/sign-in" />;

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
