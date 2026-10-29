import type { TextStyle } from 'react-native';

/**
 * Plus Jakarta Sans ships one file per weight. Never pair these with
 * `fontWeight`: Android ignores it next to a custom family.
 */
export const fontFamily = {
  regular: 'PlusJakartaSans-Regular',
  medium: 'PlusJakartaSans-Medium',
  semibold: 'PlusJakartaSans-SemiBold',
  bold: 'PlusJakartaSans-Bold',
} as const;

export const type = {
  display: { fontFamily: fontFamily.bold, fontSize: 56, lineHeight: 56 },
  /** The two line title on the auth screens, measured from `auth.png`. */
  title: { fontFamily: fontFamily.bold, fontSize: 36, lineHeight: 36, letterSpacing: -0.5 },
  heading: { fontFamily: fontFamily.bold, fontSize: 32, lineHeight: 38 },
  subheading: { fontFamily: fontFamily.semibold, fontSize: 17, lineHeight: 24 },
  body: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 24 },
  /** The paragraph under an auth title, measured from `auth.png`. */
  bodyTight: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 20 },
  caption: { fontFamily: fontFamily.medium, fontSize: 14, lineHeight: 20 },
  button: { fontFamily: fontFamily.medium, fontSize: 17, lineHeight: 22 },
  label: { fontFamily: fontFamily.semibold, fontSize: 12, lineHeight: 16 },
  /** The label that sits inside a field box, above the value, from `auth.png`. */
  fieldLabel: { fontFamily: fontFamily.semibold, fontSize: 14, lineHeight: 18 },
} satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;
