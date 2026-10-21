import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export const brand = {
  name: 'roam',
  tagline: 'Find unforgettable stays for every kind of trip.',
} as const;

export type TabRoute = 'index' | 'search' | 'trips' | 'profile';

export type TabItem = {
  route: TabRoute;
  label: string;
  icon: IoniconName;
  activeIcon: IoniconName;
};

export const tabItems: readonly TabItem[] = [
  { route: 'index', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { route: 'search', label: 'Search', icon: 'search-outline', activeIcon: 'search' },
  { route: 'trips', label: 'Trips', icon: 'calendar-outline', activeIcon: 'calendar' },
  { route: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
];

export const screenCopy: Record<TabRoute, { title: string; description: string }> = {
  index: {
    title: 'Find your next stay',
    description: 'Tell Roam the trip you have in mind and the stays that fit rise to the top.',
  },
  search: {
    title: 'Search stays',
    description: 'One sentence is enough. Search opens in the next slice of Roam.',
  },
  trips: {
    title: 'Your trips',
    description: 'Bookings and the stays you save will be waiting for you here.',
  },
  profile: {
    title: 'Your profile',
    description: 'Account details, preferences and sign out land here next.',
  },
};

export const signInCopy = {
  heading: 'Sign in to Roam',
  description: 'Sign in, or create an account with your email.',
  emailLabel: 'Email address',
  passwordLabel: 'Password',
  codeLabel: 'Verification code',
  codeTitle: 'Check your inbox',
  codeDescription: (email: string) => `Enter the code we sent to ${email}.`,
  submit: 'Continue',
  verify: 'Verify code',
  resend: 'Resend code',
  startOver: 'Start over',
  newAccountNote: 'New to Roam? The same form creates your account.',
} as const;
