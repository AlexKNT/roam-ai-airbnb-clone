import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

import type { AppIconName } from '@/components/ui/icon';
import type { SearchSort } from '@/search/types';
import type { StayType } from '@/sanity/types';
import { formatPrice } from '@/utils/format';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export const brand = {
  name: 'roam',
  tagline: 'Find unforgettable stays for every kind of trip.',
} as const;

/** Where a guest is pointed when the chat cannot answer and support can. */
export const supportEmail = 'support@roam.app';

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

export const stayCopy = {
  retry: 'Try again',
  loadError: 'We could not load this stay right now. Check your connection and try again.',
  listError: 'We could not load stays right now. Check your connection and try again.',
  configurationError:
    'Stays are not set up yet. Check the Sanity project values and restart the app.',
  notFoundTitle: 'Stay not found',
  notFoundDescription: 'This stay may have been removed, or the link is wrong.',
} as const;

function countOf(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

export const stayDetailCopy = {
  back: 'Go back',
  share: 'Share this stay',
  shareMessage: (name: string, place: string) => `${name} in ${place} on Roam`,
  loading: 'Opening this stay.',
  galleryLabel: (position: number, total: number) => `Photo ${position} of ${total}`,
  galleryImage: (name: string, position: number) => `${name}, photo ${position}`,
  rating: (rating: number, reviews: number) => `Rated ${rating.toFixed(1)} from ${reviews} reviews`,
  amenities: 'Amenities',
  policyChatTitle: 'Ask about policies',
  policyChatDescription: 'Cancellation, house rules, pets, check in and more.',
  hostedBy: (name: string) => `Hosted by ${name}`,
  hostAvatar: (name: string) => `${name}, your host`,
  superhost: 'Superhost',
  hostNoticeTitle: 'Host profiles are coming soon',
  hostNotice: 'More about your host arrives in a later update.',
  stayDetails: 'Stay details',
  facts: (values: {
    guests: number;
    bedrooms: number | null;
    beds: number | null;
    baths: number | null;
    petsAllowed: boolean;
  }) =>
    [
      countOf(values.guests, 'guest'),
      values.bedrooms === null ? null : countOf(values.bedrooms, 'bedroom'),
      values.beds === null ? null : countOf(values.beds, 'bed'),
      values.baths === null ? null : countOf(values.baths, 'bath'),
      values.petsAllowed ? 'Pets welcome' : 'No pets',
    ]
      .filter((part): part is string => part !== null)
      .join(' · '),
  checkInOut: (checkIn: string, checkOut: string) => `Check in ${checkIn} · Check out ${checkOut}`,
  houseRules: 'House rules',
  book: 'Book this stay',
  perNight: '/ night',
  noticeDismiss: 'Got it',
  bookingNoticeTitle: 'Booking is coming soon',
  bookingNotice: 'You will be able to book this stay in a later update.',
} as const;

/** Every string the saved stays surfaces show, so no screen holds copy of its own. */
export const savedStaysCopy = {
  saveLabel: 'Save this stay',
  unsaveLabel: 'Remove this stay from saved',
  saveFailedTitle: 'Saved stays did not change',
  saveFailedMessage: 'We could not reach your saved stays. Check your connection and try again.',
  noticeDismiss: 'Got it',
  tripsTitle: 'Saved stays',
  tripsLoading: 'Opening your saved stays.',
  tripsEmptyTitle: 'No saved stays yet',
  tripsEmptyDescription: 'Tap the heart on a stay and it will be waiting for you here.',
  tripsEmptyAction: 'Find a stay',
  tripsError: 'We could not open your saved stays right now. Check your connection and try again.',
  tripsRetry: 'Try again',
  tripsHasMore: 'Showing your 200 newest saves.',
} as const;

/** Every string the Profile tab shows, so the screen holds no copy of its own. */
export const profileCopy = {
  logoLabel: 'Roam',
  settingsLabel: 'Open settings',
  avatarLabel: 'Your profile photo',
  nameFallback: 'Roam guest',
  badge: 'Roam Explorer',
  statsTrips: 'Trips',
  statsSaved: 'Saved',
  statUnavailable: '—',
  savedRetry: 'Retry',
  savedRetryLabel: 'Retry the saved stays count',
  accountGroup: 'Account',
  preferencesGroup: 'Preferences',
  personalInfo: 'Personal info',
  paymentMethods: 'Payment methods',
  trips: 'Trips',
  notifications: 'Notifications',
  helpSupport: 'Help & support',
  noticeDismiss: 'Got it',
  laterTitle: 'Coming in a later update',
  paymentMethodsNotice: 'Payment methods arrive with booking in a later update.',
  notificationsNotice: 'Notification settings arrive in a later update.',
  cancellationTitle: 'Free cancellation',
  cancellationDescription: 'Full refund up to 7 days before check-in.',
  policiesLabel: 'Read Roam policies',
  mailSubject: 'Roam support',
  mailUnavailableTitle: 'No mail app found',
  mailUnavailableMessage: (email: string) => `Email Roam support at ${email}.`,
} as const;

export const personalInfoCopy = {
  title: 'Personal info',
  firstName: 'First name',
  lastName: 'Last name',
  place: 'Place',
  placePlaceholder: 'San Francisco, CA',
  email: 'Email',
  emailHelper: 'Your email signs you in, so it cannot be changed here.',
  save: 'Save changes',
  firstNameRequired: 'Enter your first name.',
  nameTooLong: 'Keep this to 50 characters or fewer.',
  placeTooLong: 'Keep your place to 60 characters or fewer.',
  placeOneLine: 'Keep your place on one line.',
  saveFailed: 'We could not save your changes. Check your connection and try again.',
} as const;

export const settingsCopy = {
  title: 'Settings',
  signOut: 'Sign out',
  deleteAccount: 'Delete account',
  version: (version: string) => `Version ${version}`,
  signOutTitle: 'Sign out of Roam?',
  signOutMessage: 'You can sign back in any time with your email.',
  signOutCancel: 'Stay signed in',
  signOutConfirm: 'Sign out',
  deleteTitle: 'Delete your account?',
  deleteMessage: 'This removes your account and every stay you saved. It cannot be undone.',
  deleteCancel: 'Keep my account',
  deleteConfirm: 'Delete account',
  deleteFailedTitle: 'Your saved stays are gone',
  deleteFailedMessage:
    'We removed your saved stays but could not close your account, and those saves cannot be restored. Try again to finish deleting the account.',
  deleteFailedDismiss: 'Not now',
  deleteRetry: 'Try again',
} as const;

export const policiesCopy = {
  title: 'Policies',
  loading: 'Loading Roam policies.',
  error: 'We could not load Roam policies right now. Check your connection and try again.',
  retry: 'Try again',
  emptyTitle: 'No policies yet',
  emptyDescription: 'Roam policies appear here once they are published.',
  source: (topic: string | null) => (topic ? `Roam policy · ${topic}` : 'Roam policy'),
} as const;

export type StayTypeFilter = {
  type: StayType | 'all';
  label: string;
  icon: AppIconName;
};

/** Chips on Home, in the order the design sheet shows them. */
export const stayTypeFilters: readonly StayTypeFilter[] = [
  { type: 'all', label: 'All Stays', icon: 'home' },
  { type: 'cabin', label: 'Cabins', icon: 'pine-tree' },
  { type: 'beach', label: 'Beach', icon: 'waves' },
  { type: 'city', label: 'City', icon: 'business-outline' },
  { type: 'villa', label: 'Villas', icon: 'palm-tree' },
];

export const homeCopy = {
  greeting: (name: string) => `Hey, ${name} 👋`,
  greetingFallback: 'Hey there 👋',
  headline: 'Find your next stay',
  prompt: 'quiet pet friendly cabin with hot tub',
  searchLabel: 'Open search',
  promptLabel: 'Search stays by describing your trip',
  avatarLabel: 'Your profile photo',
  cardActionLabel: (title: string) => `Open ${title}`,
  loading: 'Finding stays for you.',
  emptyTitle: 'Nothing listed here yet',
  emptyDescription: 'No stays of this kind are listed right now. Try another chip.',
  emptyAction: 'Show all stays',
} as const;

/** The four sort choices, in the order the menu lists them. */
export const searchSortOptions: readonly { value: SearchSort; label: string }[] = [
  { value: 'best', label: 'Best match' },
  { value: 'price-asc', label: 'Price low to high' },
  { value: 'price-desc', label: 'Price high to low' },
  { value: 'rating', label: 'Top rated' },
];

export const searchCopy = {
  back: 'Go back',
  placeholder: 'Cabins in California',
  fieldLabel: 'Describe the stay you want',
  filters: 'Filters',
  filtersNoticeTitle: 'Filters are coming soon',
  filtersNotice: 'For now, describe the stay you want in one sentence and Roam will read it.',
  noticeDismiss: 'Got it',
  sortPrefix: 'Sort by',
  sortLabel: 'Change the sort order',
  sortMenuLabel: 'Sort stays',
  sortCloseLabel: 'Close sort options',
  count: (count: number) => `${count} ${count === 1 ? 'stay' : 'stays'}`,
  countCapped: '50+ stays',
  unclear: 'Nothing in that sentence was clear enough to filter on, so every stay is showing.',
  emptyTitle: 'No stays match every part',
  emptyDescription: 'Nothing matches all of your sentence. Clear the filters to see every stay again.',
  emptyAction: 'Clear filters',
  priceChip: (price: number) => `Under ${formatPrice(price)}`,
  guestsChip: (guests: number) => `${guests}+ ${guests === 1 ? 'guest' : 'guests'}`,
  petsChip: 'Pet Friendly',
} as const;

/** Every string the policy chat shows, so the screen holds no copy of its own. */
export const policyChatCopy = {
  back: 'Go back',
  headerLabel: 'Ask about policies',
  loading: 'Opening this conversation.',
  startersTitle: 'Try asking',
  emptyTitle: 'Ask about this stay',
  emptyDescription:
    'Answers show this stay’s own text and Roam’s policies, word for word, with where each came from.',
  fieldLabel: 'Ask a question about this stay',
  placeholder: 'Ask about cancellation, pets or check in',
  send: 'Send question',
  thinking: 'Checking this stay',
  failed: 'That question did not send. Check your connection and try again.',
  retry: 'Try again',
  rateLimited: 'Too many questions in a minute. Wait a moment, then ask again.',
  unavailableNote: 'This stay does not cover this topic.',
  noAnswerTitle: 'Nothing here covers that',
  noAnswerBody: 'This stay and Roam policies have no text that answers that question.',
  suggestion: (title: string) => `Closest topic: ${title}.`,
  support: (email: string) => `Ask support at ${email}.`,
  capReached: (email: string) =>
    `This conversation reached 25 questions. Open it again in a new session, or email ${email}.`,
  lengthStop: (length: number, max: number) => `${length} of ${max} characters`,
  degraded: 'Topic matching was unavailable, so this came from a keyword match.',
  sourcePrefix: 'Source',
  answerLabel: (title: string, body: string, source: string) =>
    `${title}. ${body} ${policyChatSourceLabel(source)}`,
  turnLabel: (question: string) => `You asked: ${question}`,
} as const;

export function policyChatSourceLabel(source: string) {
  return `Source: ${source}`;
}
