# 0001. Design system and app shell

**Date**: 2026-10-21
**Status**: In Progress

## Summary

Every screen in Roam will draw from one set of named style values (color, type, spacing, corners) plus a small shared component library and a four tab shell, all matched to the design sheet in `prompts/prompt-imgs/design.png`. Building this first means later screens are assembled from parts that already look right instead of each one inventing its own styles. The app is light appearance only for now, the few colors the sheet never names are marked as estimates, and the tab bar keeps the glass look on iOS 26 while falling back to a soft white pill everywhere else.

Reasoning and the options that lost: see [rationale.md](rationale.md).

## Requirements

**User stories**:

- As a guest, I can move between Home, Search, Trips and Profile from one bar that stays visible over scrolling content.
- As a guest, every screen feels like the same product because they share type, color, spacing and corners.
- As the developer, I build a new screen by composing existing components and tokens, never by inventing a size or a color.

**Acceptance criteria** (the contract):

- **AC-1**: `src/theme/` is the single source for color, type, spacing, radius, shadow, icon size and layout constants. Every value on the design sheet maps to a named token, and no component contains a raw hex color or a hardcoded size or spacing number.
- **AC-2**: Plus Jakarta Sans Regular, Medium, SemiBold and Bold load before the first screen paints. The root layout owns the splash: it stays up until the fonts settle and is hidden in every outcome, including a failed font load, and no text falls back to a system font after a successful load on iOS, Android or web.
- **AC-3**: `AppText` renders the six styles in this spec (display, heading, body, caption, button, label) with their exact sizes and line heights. No screen sets `fontSize` or `fontFamily` itself.
- **AC-4**: Every component in the component table exists with its listed variants and states, accepts a `style` override, and follows the shared prop conventions.
- **AC-5**: The tab bar shows Home, Search, Trips and Profile in that order as one floating pill over the content. It renders real glass on iOS 26 and a 70 percent white surface elsewhere, with the same geometry in both cases. The active tab draws a yellow circle behind its icon with the label beneath, the inactive tabs show an outline icon and a label.
- **AC-6**: The four tab routes render inside the shell with their placeholder copy, only for a signed in guest. A signed out guest still lands on sign in, and the bar appears on all four routes.
- **AC-7**: The app renders the light design in both system appearances. `userInterfaceStyle` is light, and no surface flips to a dark palette.
- **AC-8**: Every icon only control has an accessible label, each tab button exposes its selected state, every target is at least 44 by 44, and every text and surface pair in the contrast table meets its ratio (4.5 to 1 for body, caption and label sizes, 3 to 1 for display and heading). Reading order follows the visual order.
- **AC-9**: The template demo components, both tab bar files including the web variant, `src/components/ui/collapsible.tsx`, the Home and Explore demo screens, the png tab icons, the color scheme hooks, `src/constants/theme.ts` and `src/global.css` are gone with no imports pointing at them. `npx expo lint`, `npx tsc --noEmit` and the token audit pass.
- **AC-10**: Each placeholder screen and the component gallery is screenshotted in the iOS simulator and compared with the design sheet, and every difference is listed then fixed or recorded as an estimate. The web build and an Android run are smoke checked for fonts and bar geometry.
- **AC-11**: Sign in still works end to end on the new primitives: email and password entry, the verification step and the Google and Apple entry points render and submit, and the screen reads as part of the shell. Its full design match stays with feature 11.

## Decision

**Chosen option**: Option 1, a token module in TypeScript with plain `StyleSheet` styling and a small component library.

Tokens live in `src/theme/`, primitives in `src/components/ui/`, and the shell replaces the template tab layout. NativeWind is not used, since its current stable release is only documented against Expo 57 and this app runs SDK 58 (details in [rationale.md](rationale.md)).

## Feature design

### Design source

`prompts/prompt-imgs/design.png` is the design system sheet (palette, type, buttons, inputs, chips, cards, navigation, badges). `home.png`, `search.png`, `profile.png`, `property-details.png`, `onboarding.png` and `auth.png` show the same system in use. Fonts come from `prompts/fonts/`. Anything not on the sheet is marked **estimated** below and was read from those screens.

### Data model sketch

There is no stored data and no schema in this feature: nothing is persisted and no API route is added. The model it does define is the token set (`color`, `type`, `spacing`, `radius`, `layout`, `iconSize`, `elevation`) and the component inventory below, which later features consume. The only runtime state is which tab is selected, whether the fonts have loaded, and whether liquid glass is available.

### Tokens

**Color** (`color`):

| Token | Value | Use | Source |
|---|---|---|---|
| `primary` | `#FFC629` | Primary buttons, active tab, selected chip, rating star | Sheet |
| `lavender` | `#C9B4FF` | Secondary highlights, highlighted chips, policy surfaces | Sheet |
| `textPrimary` | `#0B0B1A` | Headings and primary text | Sheet |
| `textSecondary` | `#6B7280` | Secondary text on white, inactive tabs | Sheet |
| `textMuted` | `#5C6472` | Secondary text or placeholder on `surfaceGray`, where `textSecondary` falls below 4.5 to 1 | **Estimated** |
| `surface` | `#FFFFFF` | Cards, sheets, screen background | Sheet |
| `surfaceGray` | `#F4F5F7` | App background, input fields | Sheet |
| `border` | `#E5E7EB` | Dividers, borders | Sheet |
| `glass` | `rgba(255,255,255,0.7)` | Tab bar and glass surfaces | Sheet |
| `darkInk` | `#0B0B1A` | Text placed on `primary` or `lavender` | Sheet (reuse) |
| `successSurface` | `#E7F6EC` | Success alert background | **Estimated** |
| `successInk` | `#157F3B` | Success alert text and icon | **Estimated** |
| `dangerSurface` | `#FDEBEC` | Error alert background | **Estimated** |
| `dangerInk` | `#B3261E` | Error alert text and icon | **Estimated** |
| `badgeLavender` | `#EEE7FF` | Lavender tag background | **Estimated** |
| `badgeMint` | `#E5F7EA` | Mint tag background | **Estimated** |
| `badgeBlush` | `#FDE9EF` | Pink tag background | **Estimated** |
| `badgeSky` | `#E8F0FE` | Blue tag background | **Estimated** |
| `focusRing` | `#C9B4FF` | Focused input border | **Estimated** |
| `scrim` | `rgba(11,11,26,0.45)` | Text over photos | **Estimated** |

Every tinted badge uses `darkInk` for its label and icon; the background tint is the only difference between tones.

**Type** (`type`):

| Style | Size | Line height | Weight | Use | Source |
|---|---|---|---|---|---|
| `display` | 56 | 56 | Bold | Screen hero lines | Sheet (56 to 64 range) |
| `heading` | 32 | 38 | Bold | Section and card titles | Sheet (28 to 32 range) |
| `body` | 16 | 24 | Regular | Paragraphs and descriptions | Sheet |
| `caption` | 14 | 20 | Medium | Places, meta, review counts | Sheet |
| `button` | 17 | 22 | Medium | Button labels | Sheet |
| `label` | 12 | 16 | SemiBold | Tags and badges | **Estimated** |

Font family per weight: `PlusJakartaSans-Regular`, `PlusJakartaSans-Medium`, `PlusJakartaSans-SemiBold`, `PlusJakartaSans-Bold`. Never set `fontWeight` next to a custom family, Android ignores it.

**Spacing** (`spacing`, multiples of 4, keyed by the multiple): `{ 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64 }`.

**Radius** (`radius`): `{ sm: 8, md: 12, lg: 16, xl: 24, pill: 999 }`. Inputs use `lg`, cards `xl`, buttons and chips `pill`.

**Layout** (`layout`): `screenGutter: 20`, `tabBarHeight: 76`, `tabBarFloat: 12`, `activePill: 48`, `controlHeight: 56`, `chipHeight: 44`, `touchTarget: 44`. The bar height fits the 48 circle, the 16 label and 6 of padding above and below. All **estimated** from the screens except `touchTarget`, which is the accessibility floor.

**Opacity** (`opacity`): `pressed: 0.85`, `disabled: 0.4`. Applied by every pressable component.

**Icon size** (`iconSize`): `{ sm: 20, md: 24, lg: 28 }`.

**Elevation** (`elevation`): `floating` (soft shadow under the tab bar, color `#0B0B1A` at 12 percent, radius 24, offset y 8, Android elevation 12) and `none`. Cards are flat on the sheet. The shadow is drawn by a wrapper `View`, never by `GlassView`, which does not render one.

### Contrast table

Ratios computed from the token values above. A pair that fails its threshold is not used together in a component.

| Text | Surface | Ratio | Meets |
|---|---|---|---|
| `textPrimary` `#0B0B1A` | `surface` `#FFFFFF` | 19.5 to 1 | Yes, any size |
| `textPrimary` | `surfaceGray` `#F4F5F7` | 17.9 to 1 | Yes, any size |
| `textSecondary` `#6B7280` | `surface` `#FFFFFF` | 4.8 to 1 | Yes, at 4.5 |
| `textSecondary` | `surfaceGray` `#F4F5F7` | 4.4 to 1 | No, use `textMuted` there |
| `textMuted` `#5C6472` | `surfaceGray` `#F4F5F7` | 5.5 to 1 | Yes, at 4.5 |
| `darkInk` `#0B0B1A` | `primary` `#FFC629` | 12.4 to 1 | Yes, any size |
| `darkInk` | `lavender` `#C9B4FF` | 10.6 to 1 | Yes, any size |
| `successInk` `#157F3B` | `successSurface` `#E7F6EC` | 4.6 to 1 | Yes, at 4.5 |
| `dangerInk` `#B3261E` | `dangerSurface` `#FDEBEC` | 5.7 to 1 | Yes, at 4.5 |
| `surface` `#FFFFFF` | `scrim` over a photo | 4.5 or better on mid tone photos | Checked per image; pair the scrim with `textPrimary` or a stronger overlay when the photo is bright |

### Component library

All primitives live in `src/components/ui/`. Shared conventions: a `variant` union where variants exist, `size` only where the sheet shows two, `style` passthrough, `Pressable` with `accessibilityRole="button"` for anything pressable, and a ref forwarded to the root element.

| File | Props | Variants and states |
|---|---|---|
| `app-text.tsx` | `variant`, `color`, `align`, plus `Text` props | Six type styles |
| `logo.tsx` | `size` | `32`, `48` or `56`, set in `type.display` Bold with `letterSpacing: -1` |
| `screen.tsx` | `children`, `scroll`, `bottomInset` | `ScrollView` based; `bottomInset` is `tabBar` (default) or `none` for screens without the bar |
| `button.tsx` | `label`, `onPress`, `variant`, `icon`, `disabled`, `loading` | `primary` (yellow, dark ink), `secondary` (white, border) |
| `icon-button.tsx` | `icon`, `label` (required), `onPress`, `size`, `tone` | `surface` (gray circle), `plain` |
| `input.tsx` | `label`, `value`, `onChangeText`, `placeholder`, `icon`, `secure`, `error`, `helper`, `disabled` | Default, focused (lavender border), error (danger border plus message), disabled |
| `search-field.tsx` | `value`, `onChangeText`, `placeholder`, `onFilterPress` | Default, focused |
| `chip.tsx` | `label`, `selected`, `tone`, `icon`, `onPress` | `tone` picks the selected surface (`primary` yellow, `lavender`); unselected is `surfaceGray` |
| `listing-card.tsx` | `image`, `title`, `place`, `rating`, `reviewCount`, `pricePerNight`, `amenities`, `saved`, `onPress`, `layout` | `hero` (image behind text, as on Home), `row` (image beside text, as on Search), saved and unsaved |
| `policy-card.tsx` | `icon`, `title`, `description`, `onPress` | Lavender surface, chevron |
| `profile-row.tsx` | `icon`, `label`, `onPress` | With chevron, first and last row separators |
| `alert.tsx` | `tone`, `message`, `onDismiss` | `success`, `error` |
| `tag.tsx` | `label`, `tone`, `icon` | `neutral`, `lavender`, `mint`, `blush`, `sky` |

The tab bar is `src/components/tab-bar.tsx`, used by the tab layout, not exported as a general primitive.

Component data contract for later features: `listing-card` takes plain values only (no Sanity types), so the content model in spec 0002 decides where those values come from and maps them at the screen.

### App shell

- Routes: `src/app/(tabs)/index.tsx` (Home), `search.tsx` (Search), `trips.tsx` (Trips), `profile.tsx` (Profile).
- One layout for every platform: `src/app/(tabs)/_layout.tsx` replaces both `src/components/app-tabs.tsx` and `src/components/app-tabs.web.tsx`. It keeps the Clerk gate it has today (wait for `isLoaded`, then redirect when signed out) and renders `Tabs` from `expo-router/js-tabs` with a custom `tabBar`.
- Tab order and labels come from `src/constants/copy.ts`, not hardcoded in the bar.
- The custom `tabBar` returns an absolutely positioned root. The navigator places its bar above the screen in normal flow, and only an absolute root floats over scrolling content.
- The bar floats `layout.tabBarFloat` above the bottom safe area, spans the gutter, and has radius `pill`. Background: `GlassView` from `expo-glass-effect` when `isLiquidGlassAvailable()` is true and the system has not asked for reduced transparency, otherwise a `View` with `color.glass` over a white base. The shadow from `elevation.floating` sits on the wrapper `View` in both cases, because `GlassView` does not render one.
- The active tab draws a `layout.activePill` yellow circle behind a `darkInk` icon, with the label in `textPrimary`. Inactive tabs use `textSecondary` for icon and label and no circle.
- Keyboard hiding is owned by the bar, since the navigator's `tabBarHideOnKeyboard` option only reaches its own bar. A `Keyboard` listener (`keyboardWillChangeFrame` on iOS, `didShow` and `didHide` on Android) drives a reanimated `translateY` off the bottom edge and back.
- Screens pad their bottom with `layout.tabBarHeight + layout.tabBarFloat` plus the safe area, through `Screen`. Sign in and the gallery pass `bottomInset="none"`.
- Placeholder screens: a `heading`, one `body` line of copy, and the existing PostHog pattern, `posthogLogger.info('<screen>_screen_displayed', { screen })`, which is what `home_screen_displayed` does today. It stays a log line, not a capture. No data fetching.

**Tab icons** (Ionicons active and inactive):

| Route | Label | Inactive | Active |
|---|---|---|---|
| `index` | Home | `home-outline` | `home` |
| `search` | Search | `search-outline` | `search` |
| `trips` | Trips | `calendar-outline` | `calendar` |
| `profile` | Profile | `person-outline` | `person` |

**Icon mapping** for the components. Ionicons where the set has the shape, MaterialCommunityIcons where it does not:

| Sheet icon | Ionicons | MaterialCommunityIcons |
|---|---|---|
| Search, filter | `search`, `options-outline` | |
| Heart, share, bookmark | `heart-outline`, `share-outline`, `bookmark-outline` | |
| Home, calendar, person, settings | `home-outline`, `calendar-outline`, `person-outline`, `settings-outline` | |
| Place pin | `location-outline` | |
| Star, sparkles | `star`, `star-outline`, `sparkles-outline` | |
| Chat, document, card, briefcase | `chatbubble-ellipses-outline`, `document-text-outline`, `card-outline`, `briefcase-outline` | |
| Bell, help | `notifications-outline`, `help-circle-outline` | |
| Buildings, chevron | `business-outline`, `chevron-forward` | |
| Wi-Fi, mountain, fire, paw, tub | | `wifi`, `image-filter-hdr`, `fire`, `paw`, `bathtub-outline` |
| Palm, pine, waves | | `palm-tree`, `pine-tree`, `waves` |

### Appearance

Light only. Exact config and layout changes:

- `app.json`: `"userInterfaceStyle": "light"`.
- `app.json` splash plugin becomes `["expo-splash-screen", { "backgroundColor": "#FFFFFF" }]`. Today it is `#208AEF` with `./assets/images/splash-icon.png` at width 76, which would show the Expo mark.
- The root layout stops branching on `useColorScheme`, builds one navigation theme from tokens (`background` and `card` white, `text` `textPrimary`, `border` `border`, `primary` `primary`), and sets `StatusBar` to dark content.
- `src/hooks/use-color-scheme.ts`, `src/hooks/use-color-scheme.web.ts`, `src/hooks/use-theme.ts` and `src/global.css` are removed with their consumers.

### Value sourcing

| Action | Value produced or displayed | Source |
|---|---|---|
| Any screen renders text | Size, line height, weight, color | `type` and `color` tokens |
| Any screen renders a surface | Background, border, radius, shadow | `color`, `radius`, `elevation` tokens |
| Tab bar renders | Labels and order | `src/constants/copy.ts` |
| Tab bar renders | Bar height, float, pill size | `layout` tokens |
| Tab bar picks a background | Glass or fallback | `isLiquidGlassAvailable()` from `expo-glass-effect` |
| Tab button exposes state | Selected or not | Navigation state passed to the custom `tabBar` |
| Screens keep clear of the bar | Bottom padding | `layout.tabBarHeight + layout.tabBarFloat + safe area inset` |
| Placeholder screens show copy | Title and line | `src/constants/copy.ts` |
| Wordmark renders | `roam` text | `src/constants/copy.ts` and `type.display` |
| App leaves the splash | When first paint is allowed | Root layout effect on the `useFonts` result, including its error case |
| Tab icon shown | Glyph per route and state | The tab icon table above |
| Pressable feedback | Pressed and disabled look | `opacity` tokens |
| Placeholder text on a gray field | Text color | `color.textMuted` |
| Sign in gate | Signed in or out | `useAuth()` from `@clerk/expo` (unchanged) |

### Key invariants

- One token source. Components import tokens, they never declare a color or a size literal.
- Fonts are resolved before first paint; a failed font load falls back to the system font and logs, it never leaves the splash up.
- The four tabs always exist, in the order Home, Search, Trips, Profile.
- The bar never covers screen content, because every screen renders through `Screen`.
- Light appearance only: no component reads the color scheme.

### API surface

No HTTP routes. The public interface of this feature is the component props table above and the four routes. Every route is private, behind the Clerk session gate that already exists.

### Security model

No new data, no PII, no secrets. The tab layout keeps the existing Clerk gate; nothing in this feature touches Sanity, PostHog payloads or API routes. Accessibility labels must never include guest data, and the gallery route is development only.

### Configuration required

- No new environment variables.
- One new dependency: `@expo/vector-icons`, installed with `npx expo install @expo/vector-icons`.
- `app.json`: `userInterfaceStyle` becomes `light`, and the splash keeps a white background with no Expo logo image until a brand asset exists.

### Critical test scenarios

- Happy path: a signed in guest opens the app, lands on Home, taps Search then Trips then Profile, and the active pill follows the selected tab, verifies **AC-5**, **AC-6**.
- Failure case: liquid glass is unavailable (Android, web, iOS below 26), and the bar renders the same pill with the 70 percent white surface and keeps its height and radius, verifies **AC-5**.
- Failure case: a font file fails to load, the app still renders with the system font and the splash is dismissed, verifies **AC-2**.
- Auth case: a signed out guest opening any tab route lands on `/sign-in` and never sees the bar, verifies **AC-6**.
- Appearance case: with the simulator in dark appearance the app still renders the light palette, verifies **AC-7**.
- Accessibility case: a screen reader announces each tab with its label and selected state, and every icon button has a spoken label, verifies **AC-8**.
- Auth case: a guest signs in from `src/app/sign-in.tsx` after the migration, reaches the shell, and every step of the Clerk flow still submits, verifies **AC-11**.

## Build plan

Ordered as a Tracer Bullet: a thin thread from tokens through text and screen to the tab bar is stood up and seen running first, then the bar and the component set are thickened, then the template is removed.

1. **Foundations.** Install `@expo/vector-icons`, copy `PlusJakartaSans-Regular.ttf`, `PlusJakartaSans-Medium.ttf`, `PlusJakartaSans-SemiBold.ttf` and `PlusJakartaSans-Bold.ttf` from `prompts/fonts/` into `assets/fonts/`, and write `src/theme/tokens.ts`, `src/theme/typography.ts` and `src/theme/index.ts` exactly as tabled above. Load the fonts with `useFonts` in the root layout and give that layout the splash duty: it calls `hideAsync` in an effect once the font result settles, including on error. Force light appearance as listed under Appearance. satisfies **AC-1**, **AC-2**, **AC-7**.
2. **Thin thread.** Add `AppText`, `Screen` (with `scroll` and `bottomInset`), the copy constants, the four tab routes with placeholder content and `posthogLogger.info` events, and a minimal solid tab layout that replaces both `app-tabs.tsx` and `app-tabs.web.tsx`. The app then runs end to end on tokens and fonts on every platform. satisfies **AC-3**, **AC-6**.
3. **Bar.** Replace the solid bar with the floating pill: absolute root, shadow on a wrapper `View`, glass only when `isLiquidGlassAvailable()` and transparency is not reduced, otherwise the 70 percent white surface. Add the 48 circle, labels, the 76 height, keyboard hiding through `Keyboard` listeners, accessible labels and selected state. satisfies **AC-5**, **AC-8**.
4. **Components.** Build the remaining primitives: `Logo`, `Button`, `IconButton`, `Input`, `SearchField`, `Chip`, `ListingCard` (hero and row), `PolicyCard`, `ProfileRow`, `Alert`, `Tag`, with the glyph mapping above. satisfies **AC-4**.
5. **Sign in migration.** Move `src/app/sign-in.tsx` onto `AppText`, `Input` and `Button` with `bottomInset="none"`, leaving the Clerk logic untouched, and confirm the email, password and verification steps still submit. satisfies **AC-11**.
6. **Gallery and match.** Add `src/app/dev/components.tsx`, guarded by `__DEV__` with a redirect to `/`, rendering every variant outside the tabs. Screenshot it and each placeholder in the iOS simulator, compare with `design.png`, and tune values. Smoke check the web build and an Android run for fonts and bar geometry. satisfies **AC-4**, **AC-10**.
7. **Cleanup and checks.** Delete `src/components/themed-text.tsx`, `themed-view.tsx`, `hint-row.tsx`, `web-badge.tsx`, `external-link.tsx`, `animated-icon.tsx`, `animated-icon.web.tsx`, `animated-icon.module.css`, `src/components/ui/collapsible.tsx`, `app-tabs.tsx`, `app-tabs.web.tsx`, `src/app/(tabs)/explore.tsx`, `src/hooks/use-color-scheme.ts`, `use-color-scheme.web.ts`, `use-theme.ts`, `src/constants/theme.ts`, `src/global.css` and `assets/images/tabIcons/`. Then run the token audit (search `src/components` and `src/app` for hex colors and numeric size literals), `npx expo lint` and `npx tsc --noEmit`. satisfies **AC-1**, **AC-9**.

## Consequences

**Positive**:

- Every later screen inherits one visual language, so Slice 1 to 6 build screens instead of deciding colors and sizes.
- A single token file makes a palette or type change one edit.
- Accessibility targets, labels and contrast are decided once, in the components.
- The shell makes each later feature a drop in to an existing route.

**Negative / tradeoffs**:

- Light only until a dark design exists, so a dark appearance is a deferred visual debt.
- Real glass needs iOS 26, so most devices see the white fallback and both looks must be checked.
- Ionicons and MaterialCommunityIcons only approximate a few sheet icons (tub, paw, mountain), which may need custom SVGs later.
- A custom tab bar means every screen must render through `Screen` or content slides under the bar, and the bar owns its own keyboard hiding because the navigator option does not reach it.
- Sign in has to be migrated in this feature to keep it compiling, so a slice of feature 11 starts early. The full auth design match still belongs to feature 11.
- The semantic colors are read from screenshots, not from a brand source, so they stay marked as estimates.
- `@expo/vector-icons` is a new dependency, and its icon fonts add weight to the bundle.

**Neutral**:

- `userInterfaceStyle` becomes `light`, a visible config change.
- The template demo screens disappear, so nothing in the app explains Expo any more.
- The gallery route exists in development builds only.
- The web tab bar stops being a separate implementation; one layout serves web and native.
- `AppText` becomes the only text component; screens do not import `Text` directly.

## Follow-up

- [ ] Brand assets: the logo wordmark, app icon and splash mark. The wordmark is set as text until they arrive.
- [ ] Dark mode design pass. Tokens are grouped so a second palette is additive.
- [ ] Confirm the estimated colors (success, danger, badge tints, scrim, focus ring) against the brand source.
- [ ] Replace the Ionicons and MaterialCommunityIcons glyphs that differ from the sheet if brand fidelity demands it.
- [ ] Move copy in `src/constants/copy.ts` to a translation layer when a second language is planned.
- [ ] Feature 11 keeps the full auth design match; this spec only keeps sign in working on the new primitives.
