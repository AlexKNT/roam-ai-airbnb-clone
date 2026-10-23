# 02 · Stay detail

Status: done

## Goal

Opening a stay from Home shows its photo gallery, name, place, rating, amenities, policy entry, host and price on one screen, and Book this stay says booking is coming soon instead of doing nothing.

## Decisions

- **Data:** one read through `useStay(slug)` in `src/sanity/use-stay.ts`, which already returns `loading`, `error` with `retry`, `notFound` and `ready` with `StayDetail`. No new query and no new hook, per spec 0002.
- **Screen frame:** the photo runs to the top edge of the display and the booking bar sits outside the scroll, so `Screen` is not used here. The screen builds its own root with `useSafeAreaInsets` for the top inset on the floating buttons and the bottom inset under the bar.
- **Gallery:** a horizontal paging `ScrollView` with one image per page at `galleryAspect` (1.27, estimated from `property-details.png`). The counter pill in the bottom right reads the current page over `gallery.length`. Fallback chain is gallery, then `coverImage`, then the `surfaceGray` placeholder `ListingCard` already draws.
- **Floating actions:** back, share and heart as 56pt white circles over the photo. Share opens the system share sheet with the stay name and place through React Native `Share`, so no new dependency. The heart follows the design and says saving arrives with Slice 4, because saved stays are out of scope here.
- **Name and rating:** the name uses `heading`, up to two lines. The rating sits in a `surfaceGray` box with a `star` in `primary`, `rating.toFixed(1)` and the review count in parentheses under it.
- **Place:** `location-outline` and the place, `caption`, `textSecondary`, as the sheet shows.
- **Amenities:** the first four, one row, spread with space between, icon above each label. The icon map currently sits inside `listing-card.tsx`, so it moves into `src/constants/amenities.ts` as `amenityIconFor(label)` and both places read it.
- **Policy cards:** `PolicyCard` takes the new `subheading` title and keeps `caption` for the description, which is what the sheet shows. Its only other caller is the dev gallery, so nothing else shifts.
- **Ask about policies:** present as the sheet shows, and pressing says the policy chat arrives in Slice 3, through the same notice as booking.
- **Cancellation card:** title and summary print the stay's own `cancellationPolicy` text word for word, with the generic lead in "Free cancellation" only when the policy title says so. Pressing reveals `body` inline and turns the chevron. The card is hidden when the stay has no policy.
- **Host row:** avatar at `hostAvatarSize`, `Hosted by <name>`, a `Superhost` line with a small seal icon when `superhost` is true, and a chevron. Pressing says host profiles arrive later.
- **Below the fold:** the stay's `summary`, then a facts line built from `guests`, `bedrooms`, `beds`, `baths` and `petsAllowed` skipping null fields, then check in and check out times, then house rules with the policy name and each rule on its own line. The house rules block is hidden when the stay has none.
- **Price:** `pricePerNight` formatted exactly as `ListingCard` does. The sheet's `$867 total` line is left out, because no night count exists anywhere in the data and a total would be invented.
- **Notices:** a small `Notice` dialog built on React Native's `Modal`, because React Native's own `Alert` is a no op on web and would fail silently there. One instance on the screen reads from a `{ title, message }` state, so every notice looks the same and reads well with a screen reader.
- **Session gate:** `src/app/stay/` sits outside `(tabs)` and today reads stays with no session, while `AGENTS.md` says sign in is the only public screen. The build adds `src/app/stay/_layout.tsx` with the same `useAuth` gate the tabs use, checking `isLoaded` before `isSignedIn`.
- **Analytics:** `stay_detail_viewed` with the stay id once the stay is ready, matching the existing `home_screen_displayed` log. Nothing a guest typed and nothing personal.
- **New tokens, all estimated from the sheet:** `galleryAspect: 1.27`, `galleryAction: 56`, `ratingBoxWidth: 88`, `ratingBoxHeight: 72`, `hostAvatarSize: 64`. New type variant `subheading` (semibold 17/24) for the policy card titles and the host name. Everything else reads existing tokens: `controlHeight` for the booking button, `radius.xl` for the sheet top corners, `spacing`, `caption`, `heading`, `label`.
- **Removed:** `stayCopy.previewNote`, the line that said the gallery arrives in the next slice, has no reader once the real screen lands.

## Out of scope

- Booking, dates, price totals and payment.
- Saving a stay, which is Slice 4 and why the heart states it instead of toggling.
- The policy chat answer flow, which is Slice 3.
- Host profiles, the reviews list and a map.

## Steps

### 1. Tokens, type variant and copy

Add `galleryAspect`, `galleryAction`, `ratingBoxWidth`, `ratingBoxHeight` and `hostAvatarSize` to `layout` in `src/theme/tokens.ts`, each with a short comment saying it came from `property-details.png` and is estimated. Add `subheading: { fontFamily: fontFamily.semibold, fontSize: 17, lineHeight: 24 }` to `type` in `src/theme/typography.ts`.

In `src/constants/copy.ts` add `stayDetailCopy`: back, share and save labels, the booking notice title and message, the policy chat notice, the host notice, share sheet copy built from the stay name and place, `Hosted by` with a name argument, `Superhost`, the facts builder for a guest and room count, the section headings, the check in and check out labels, and the house rules heading. Remove `previewNote`. Done when `npx tsc --noEmit` passes.

### 2. Shared amenity icons

Move the `amenityIcons` map out of `src/components/ui/listing-card.tsx` into `src/constants/amenities.ts` as `amenityIconFor(label: string): AppIconName | undefined`, keyed the same way, and point `ListingCard` at it. Done when the component gallery shows the same tags as before and typecheck passes.

### 3. Gallery

Add `src/components/stay/stay-gallery.tsx`: props `images`, `fallbackImage`, `title`, `current`, `onIndexChange`, `onBack`, `onShare`, `onSave`. Renders the paging `ScrollView` at `galleryAspect`, white floating circles for the three actions, and the counter pill reading `${current + 1} / ${total}` on `scrim` with white `label` text. An empty gallery renders the same placeholder box as `ListingCard`, and the counter hides. Each page image carries the stay name as its accessibility label. Done when the gallery renders in the dev gallery page with three sample images and typecheck passes.

### 4. Detail pieces

Add `src/components/stay/stay-rating.tsx` (rating box), `src/components/stay/stay-amenities.tsx` (up to four items in one row), `src/components/stay/stay-host-row.tsx` (avatar, name, superhost line, calls `onPress`) and `src/components/stay/stay-booking-bar.tsx` (white bar, hairline top border, price and `/ night`, `Book this stay` primary button, bottom safe area padding). Update `src/components/ui/policy-card.tsx` to the `subheading` title. Add the three new pieces to `src/app/dev/components.tsx` with sample data. Done when the gallery page shows all four and typecheck passes.

### 5. Screen assembly and session gate

Rewrite `src/app/stay/[slug].tsx` around `useStay(slug)`: loading spinner, error `Alert` with `Try again`, not found title and description with a back button, and the ready layout described above with the sticky `StayBookingBar` outside the scroll and bottom padding on the scroll content so nothing hides under the bar. Wire the noticed actions to `Alert.alert`. Log `stay_detail_viewed` once when the stay turns ready. Add `src/app/stay/_layout.tsx` with the `useAuth` gate. Done when a seeded stay opens from Home, every state renders, and typecheck passes.

### 6. Dev preview and checks

Add `src/app/dev/stay.tsx`, guarded by `__DEV__` with a redirect to `/`, rendering `StayScreen` with a slug passed in from the query string so it can be looked at without a session. Run the checks below, screenshot at phone width on web, and compare with `prompts/prompt-imgs/property-details.png`. List every difference, fix what the tokens allow, and repeat. Report which values were estimated.

## Verification

- `npx expo lint` passes.
- `npx tsc --noEmit` passes.
- `npx expo start --web`, open `/dev/stay?slug=<seeded slug>` at 390 by 844, and compare with `property-details.png`: photo edge to edge, three floating circles, counter pill, name and rating box, place, amenity row, two lavender cards, host row, booking bar.
- Swipe the gallery: the counter follows the page, and a stay with one image shows `1 / 1`.
- Open `/stay/<seeded slug>` signed out and confirm it redirects to sign in. Sign in, open a stay from Home, and confirm the back button returns to the feed.
- Visit `/stay/not-a-real-slug` signed in: expect the not found state with a way back.
- Press Book this stay, Ask about policies, the heart and the host row: each shows its notice, and none fails silently.
- Compare two stays with different fields: one with a cancellation policy and one without, one with house rules and one without, so hidden sections stay hidden and no section is empty.

## AGENTS.md updates

- One line under `## Expo`: screens outside the tab groups carry their own `_layout.tsx` session gate, as `src/app/stay/` now does.
- One line under `## Who owns what`: amenity labels and icons both live in `src/constants/amenities.ts`, so the card and the detail screen never drift.

## Result

Built. `src/app/stay/[slug].tsx` reads the stay through `useStay(slug)` and renders the gallery, name and rating, place, four amenities, the policy and cancellation cards, the host row, then the summary, stay facts, check in times and house rules, with the booking bar pinned to the bottom. The pieces live in `src/components/stay/`, and `src/app/stay/_layout.tsx` gates the route. `Alert.alert` turned out to be a no op on web, so notices use the new `Notice` dialog, checked in the browser.

Values estimated from `property-details.png`: `galleryAspect` 1.27, `galleryAction` 56, `ratingBoxWidth` 88, `ratingBoxHeight` 72, `hostAvatarSize` 64, the `subheading` type variant at semibold 17/24, and the sheet reuses `radius.xl` for its top corners. The design's `$867 total` line is left out, because no night count exists in the data. Amenity labels wrap to two lines when the label is long (Beach Access), where the sheet's own labels fit on one line.
