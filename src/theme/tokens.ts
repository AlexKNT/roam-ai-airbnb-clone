import type { ViewStyle } from 'react-native';

/**
 * The single source for every color, size and corner in the app.
 * Components read these tokens; they never declare a literal.
 */
export const color = {
  primary: '#FFC629',
  lavender: '#C9B4FF',
  textPrimary: '#0B0B1A',
  textSecondary: '#6B7280',
  textMuted: '#5C6472',
  surface: '#FFFFFF',
  surfaceGray: '#F4F5F7',
  border: '#E5E7EB',
  glass: 'rgba(255,255,255,0.7)',
  darkInk: '#0B0B1A',
  successSurface: '#E7F6EC',
  successInk: '#157F3B',
  dangerSurface: '#FDEBEC',
  dangerInk: '#B3261E',
  badgeLavender: '#EEE7FF',
  badgeMint: '#E5F7EA',
  badgeBlush: '#FDE9EF',
  badgeSky: '#E8F0FE',
  focusRing: '#C9B4FF',
  scrim: 'rgba(11,11,26,0.45)',
} as const;

export type ColorToken = keyof typeof color;

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export type SpacingToken = keyof typeof spacing;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export type RadiusToken = keyof typeof radius;

export const layout = {
  screenGutter: 20,
  maxContentWidth: 800,
  formMaxWidth: 480,
  cardThumb: 112,
  tabBarHeight: 76,
  tabBarFloat: 12,
  activePill: 48,
  controlHeight: 56,
  chipHeight: 44,
  touchTarget: 44,
  avatarSize: 80,
  promptBarHeight: 64,
  heroCardAspect: 1.2,
  heroCardAction: 52,
  ratingBadgeHeight: 32,
  heroSearchButton: 80,
  /** Stay detail values, estimated from `property-details.png`. */
  galleryAspect: 1.27,
  galleryAction: 56,
  ratingBoxWidth: 88,
  ratingBoxHeight: 72,
  hostAvatarSize: 64,
  /** The larger photo on the Profile identity card, estimated from `profile.png`. */
  profileAvatarSize: 96,
  /** The circled icon above an empty state's copy. */
  emptyIcon: 72,
  /** The main action on the auth screens, measured from `auth.png`. */
  authActionHeight: 50,
  /** Onboarding, estimated from `onboarding.png`. */
  onboardingSheetRadius: 64,
  onboardingDot: 8,
  onboardingDotActive: 24,
  onboardingPinHeight: 40,
} as const;

export const opacity = {
  pressed: 0.85,
  disabled: 0.4,
} as const;

export const iconSize = {
  sm: 20,
  md: 24,
  lg: 28,
} as const;

export type IconSizeToken = keyof typeof iconSize;

export const elevation: Record<'none' | 'floating', ViewStyle> = {
  none: {},
  floating: {
    shadowColor: '#0B0B1A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
};
