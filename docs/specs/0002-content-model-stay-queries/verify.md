# Verify: content model and stay queries · spec 0002 · updated 2026-10-21

_Steps derived from spec 0002 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual

- [ ] Open the Studio and confirm exactly four document types: Stay, Host, Cancellation policy, House rules. Publishing a stay that references all three others saves without a validation error → AC-1
- [ ] Open the sample stay "Quiet Pine Cabin" and clear the price. Publishing is blocked with a field error → AC-9
- [ ] Publish a stay with no gallery image, with a gallery image that has no alt text, or with host, cancellation policy or house rules empty. Each is blocked → AC-9
- [ ] Set a slug to `Quiet Pine Cabin`, then to `quiet--pine`. Both are rejected. Set it to `quiet-pine-cabin` while the sample stay exists; it is rejected as already in use → AC-10
- [ ] Open the sample stay. Name, place, gallery, check in time and check out time match the document fields word for word → AC-2
- [ ] On a card, title, place, price, rating, review count and amenity labels come from the stay. `hot-tub` reads "Hot Tub", `fast-wifi` reads "Fast Wi Fi", and a value with no label renders no chip → AC-3
- [ ] The card cover is `gallery[0]`. When that image has no asset, the card keeps the alt text and shows a placeholder, and never falls back to the second photo → AC-5, AC-8
- [ ] The detail gallery uses the larger image size (1200 by 900) and the card uses 800 by 600 → AC-5
- [ ] An unknown slug shows the not found state, not an error → AC-6
- [ ] With the device offline, a stay screen shows the error state with a visible retry. Tapping retry returns to loading and runs the request again → AC-6
- [ ] A stay type filter with no matches shows the empty state while `getStays` resolves `ready` with an empty array → AC-6
- [x] In the Studio Vision panel, run the detail query with `$slug` set to `x" || defined(slug.current) || "`. It returns `null`, never a stay → AC-4
- [x] Deleting the cancellation policy a stay points at is allowed, and the stay then reads `cancellationPolicy: null` while name, host and the rest survive → AC-7
- [x] A draft stay that was never published appears in neither the list nor the detail read → AC-12

## Commands

- [x] `npx tsc --noEmit` exits 0 → AC-13
- [x] `npx expo lint` exits 0 → AC-13
- [x] `cd studio && npx sanity schema list` shows the deployed Studio schema → AC-1
- [x] `npx expo config --type public` shows `sanityProjectId` and `sanityDataset` in `extra`, and neither is empty → AC-11
- [ ] With `EXPO_PUBLIC_SANITY_PROJECT_ID` removed from `.env.local`, a dev launch throws an error that names `EXPO_PUBLIC_SANITY_PROJECT_ID` → AC-11
- [x] A public read without any token returns the sample stay, so no secret is needed → AC-11

## Deferred

- Hook state transitions (`loading` to `ready`, `error` with retry, `notFound`) can only be exercised once a screen consumes the hooks. Prove them when the home feed lands in feature 4.

## Acceptance-criteria coverage

- AC-1 covered by the Studio type list and by `sanity schema list` · AC-2 by the word for word detail check · AC-3 by the card values, ordering and 50 cap check · AC-4 by the injected slug value · AC-5 by the cover and gallery size checks · AC-6 by the not found, offline and empty checks (hook transitions deferred to feature 4) · AC-7 by the deleted policy check · AC-8 by the image with no asset check · AC-9 by the empty required field checks · AC-10 by the slug format and duplicate checks · AC-11 by the config, dev throw and tokenless read checks · AC-12 by the draft check · AC-13 by the two commands.
