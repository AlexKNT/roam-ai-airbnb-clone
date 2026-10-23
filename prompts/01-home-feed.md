# 01 · Home feed

Status: done

## Goal

A guest who signs in lands on Home and sees their name, a search entry, five stay type chips, and the seeded stays as photo cards. Picking a chip filters the list, and tapping a card opens that stay.

## Decisions

- **Data:** the list comes from `useStays(type)` in `src/sanity/use-stays.ts`, which already returns `loading`, `error` with `retry`, and `ready` with `StaySummary[]`. The chip sets `type`, and `getStays` filters it as a GROQ parameter. No new query, no new hook.
- **Chips:** one row, wrapping to two lines, with `All Stays` first and selected by default, then `Cabins`, `Beach`, `City`, `Villas`. Labels and icons live in `src/constants/copy.ts` next to `tabItems`, keyed by `StayType`. Selected chip is `tone="primary"` as on the sheet. Icons: `home`, `pine-tree`, `waves`, `business-outline`, `palm-tree`.
- **Greeting:** `Hey, <first name> 👋` from the Clerk user (`user.firstName`, then `user.username`), falling back to `Hey there 👋`. Avatar is `user.imageUrl` in an `expo-image` circle; with no image, the user's initials on `surfaceGray`. The avatar is not pressable yet, because the profile screen does not exist until Slice 5.
- **Search entry:** the lavender prompt bar and the round search button at the headline both go to the Search tab, which still shows its placeholder until Slice 2. Nothing pretends to search yet.
- **Card:** the existing `ListingCard` `hero` layout is restyled to `home.png`, since spec 0001 already defines `hero` as "image behind text, as on Home". It becomes a full bleed photo with a `rating` pill top right, place and title over a bottom scrim, and a white circular arrow button bottom right. Price, review count and amenity tags stay on the `row` layout only. Props gain `imageAlt` and allow `image` to be `null`.
- **Missing photo:** when a stay has no resolvable cover image the card shows a `surfaceGray` box with the stay's alt text and a photo icon, per spec 0002.
- **Scrim:** a `react-native-svg` `LinearGradient` rectangle inside the card. `react-native-svg` is already a dependency, so no new package is added.
- **Card tap:** pushes `/stay/[slug]`. That route does not exist yet, so step 5 adds a small placeholder screen for feature 5 to replace. Without it the typed route check fails and the scope line "each card opens its stay" cannot be met.
- **Background:** Home is white, so `Screen` gains a `background` prop that takes a color token and defaults to `surfaceGray`. The tab layout keeps its gray scene color.
- **New layout tokens**, all read from `home.png` and marked estimated: `avatarSize: 80`, `promptBarHeight: 64`, `heroCardAspect: 1.2`, `heroCardAction: 52`, `ratingBadgeHeight: 32`, `heroSearchButton: 80`. `IconButton` gains a `shape` prop, `circle` by default and `soft` (radius `xl`) for the squarish search button.
- **Feed states:** loading shows a spinner with caption copy under the chips and keeps the chips usable. Error shows `stayCopy.listError` with a `Try again` button. Empty shows a short line explaining no stays of that type are listed yet. All new strings go in `src/constants/copy.ts`.
- **Analytics:** keep the existing `home_screen_displayed` log. No new event, and nothing the guest types is sent.

## Out of scope

- Real natural language search, which is Slice 2.
- The stay detail design, gallery, policies and booking notice, which are feature 5.
- Saving, the profile screen, and onboarding.

## Steps

### 1. Tokens and copy

Add the six layout tokens above to `src/theme/tokens.ts`. In `src/constants/copy.ts` add `homeCopy` (greeting with a name argument, fallback greeting, the example sentence, the avatar and search labels, loading, empty and empty action copy) and `stayTypeFilters`, a readonly list of `{ type, label, icon }` with `all` first. Import only the `AppIconName` type from `src/components/ui/icon.tsx`. Done when `npx tsc --noEmit` passes.

### 2. Screen background

Give `Screen` a `background?: ColorToken` prop that paints the safe area root, defaulting to `surfaceGray`. Done when the other three tab screens look unchanged.

### 3. Listing card hero layout

Rework `src/components/ui/listing-card.tsx` so `layout="hero"` matches `home.png`: photo at `heroCardAspect`, `PhotoScrim` gradient over the lower third, rating pill (`star` icon, `rating.toFixed(1)`), place line with `location-outline` above the title, both in white, arrow button in the bottom right of the photo. Keep the `row` layout working for the gallery. Handle `image === null` with the placeholder described above, and keep `saved` on the `row` layout only. Update `src/app/dev/components.tsx` samples if the props change shape. Done when the gallery shows both layouts and typecheck passes.

### 4. Home screen

Replace the placeholder body in `src/app/(tabs)/index.tsx`: header row with `Logo size={56}` and the Clerk avatar, greeting line, `display` headline `Find your next stay` with the soft search button, the lavender prompt bar, the chip row, then the feed from `useStays(selectedType)`. Every card maps `StaySummary` to `ListingCard` props. Keep the screen on `Screen background="surface"`. Done when the screen renders all three feed states and the chips switch the query.

### 5. Stay route placeholder and navigation

Add `src/app/stay/[slug].tsx` outside the tabs: a back button, the stay name and place read through `useStay(slug)`, and one line saying the full details arrive in the next slice. Wire `router.push` from the card. Done when tapping a card leaves the tabs and the back button returns to Home.

### 6. Dev preview and checks

Add `src/app/dev/home.tsx`, `__DEV__` guarded like the component gallery, rendering the Home screen so it can be looked at without a Clerk session. Run the checks below, screenshot the feed at phone width, and compare it with `prompts/prompt-imgs/home.png`.

## Verification

- `npx expo lint` passes.
- `npx tsc --noEmit` passes.
- `npx expo start --web`, open `/dev/home` at 390 by 844, and compare with `home.png`: logo, avatar, greeting, headline, search button, prompt bar, chips, card overlay.
- Click `Cabins`, `Beach`, `City` and `Villas` and confirm the list changes and the selected chip turns yellow.
- Restart the dev server with a wrong `EXPO_PUBLIC_SANITY_DATASET` and confirm the error state with a working `Try again`.
- End to end on a device or simulator: sign in, land on Home, see the seeded stays, filter, open a card, come back.

## AGENTS.md updates

- Under `## Who owns what`, content: the feed reads through `useStays` and the chips map to `stayTypeFilters` in `src/constants/copy.ts`, so a new stay type is one edit in the constants and one in the schema.
- Under `## Rules`: screens that are not `surfaceGray` pass `Screen`'s `background` token instead of styling their own root.

## Result

Built. Home renders the Clerk greeting and avatar, the display headline with a soft search button, the lavender prompt bar, five stay type chips and the seeded stays as photo cards with a scrim, rating pill and arrow. Chips refetch through `useStays(type)`, and each card opens `/stay/[slug]`, a placeholder screen for feature 5. The chip unselected ink moved to `textPrimary` so it matches the sheet. The local web check used mocked Sanity responses and a stand in photo, because the preview browser has no network; the real iOS and Android run is still the check to do.
