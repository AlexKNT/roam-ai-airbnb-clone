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

export type PlaceholderRoute = Extract<TabRoute, 'trips' | 'profile'>;

export const screenCopy: Record<PlaceholderRoute, { title: string; description: string }> = {
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
  save: 'Save this stay',
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
  saveNoticeTitle: 'Saving is coming soon',
  saveNotice: 'Saved stays arrive in Trips in a later update.',
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
