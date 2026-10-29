# Verify: saved stays · spec 0005 · updated 2026-10-28

_Steps derived from spec 0005 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

Setup: the private dataset `saved-stays` exists with ACL `private` and `SANITY_PRIVATE_DATASET=saved-stays` is in `.env.local`. Sign in as a guest, then open Home. Use two stays you can find by name, because one of them gets deleted in the last step.

Run on 2026-10-28 against the dev server on web. Every command step ran and passed. The heart and Trips screens were driven with a stubbed Sanity response, because the machine that ran this cannot reach Sanity from a browser; the PostHog steps were not run because that same browser cannot reach PostHog. Re-run those steps on a device with real network access before calling this verified.

## UI / manual

- [x] On Home, tap the heart on a card, confirm it fills and no notice appears; tap the card itself, confirm the stay opens → AC-1
- [ ] On Search, tap the heart on a row result, confirm it fills and no notice appears; tap the row, confirm the stay opens → AC-1
- [x] On a stay detail screen, tap the gallery heart, confirm it fills with no notice; tap again, confirm it empties → AC-2
- [x] Confirm no "Saving is coming soon" copy exists anywhere → AC-2
- [x] Restart the app, confirm the hearts are still filled → AC-3
- [ ] Sign in on a second device as the same guest, confirm the same stays are filled → AC-3
- [x] Open Trips, confirm the saved stays are listed newest save first, each showing the stay as Sanity holds it now → AC-4
- [ ] Tap a Trips row, confirm that stay opens → AC-4
- [x] Watch Trips while it loads, confirm three card shaped placeholders appear, with no text jump → AC-5
- [x] As a guest with no saves, confirm Trips shows the heart icon, one line of copy and a button that opens Search → AC-5
- [x] Turn off the network, open Trips, confirm the error state with a retry button → AC-5
- [ ] Tap retry once the network is back, confirm the list loads → AC-5
- [x] Unsave from Trips, confirm the row leaves at once and the save is gone from the private dataset → AC-6
- [ ] Open Trips, count the rows; confirm the profile Saved count matches when feature 9 lands (the provider `count` is the same list) → AC-7
- [x] Turn off the network, tap any heart, confirm it flips back and the "Saved stays did not change" dialog shows → AC-8
- [x] Tap the same heart twice quickly on a slow connection, confirm only one write reaches Sanity (one new document) → AC-9
- [x] Turn off the network, unsave from Trips, confirm the row comes back and the dialog shows → AC-8, AC-10
- [ ] Sign out, confirm every heart reads unsaved; sign back in, confirm the saves return → AC-3, AC-10
- [ ] In PostHog, inspect `stay_saved` and `stay_unsaved`, confirm each holds `stay_id` and `screen` and nothing else → AC-14
- [ ] With a screen reader, confirm every heart announces its action and its selected state, with a 44 by 44 target → AC-15

## Commands

- [x] `npx expo lint` → passes → AC-15
- [x] `npx tsc --noEmit` → passes → AC-15
- [x] `npx jest` → 9 suites, 77 tests pass, no network used → AC-15
- [x] A request to `/api/saved-stays` with no session answers 401 with an empty body → AC-10
- [x] The same for `POST` and `DELETE` → 401 each, nothing written → AC-10
- [x] A bogus bearer token answers 401 → AC-10
- [x] With a valid bearer token and no body: `POST` → 422; `DELETE` without `stayId` → 422; a `stayId` with whitespace → 422; a `stayId` over 128 characters → 422 → AC-10
- [x] With a valid bearer token: `POST {"stayId":"stay-brownstone-garden-flat"}` twice → both 200, the same `savedAt` in both → AC-12
- [x] In the private dataset, query `count(*[_type == "savedStay"])` → one document for that pair → AC-12
- [x] Query the public `production` dataset for `savedStay` → zero documents → AC-13
- [x] Fetch the served web bundle and search it for `SANITY_API_WRITE_TOKEN`, the token value and the private dataset name → none present → AC-13
- [x] Create a save by hand for a stay id that does not exist, then `GET /api/saved-stays` → that id is absent, the document is deleted, and `hasMore` stays false → AC-11
- [ ] Unpublish a stay in Studio, then `GET /api/saved-stays` → that id is absent and its save is deleted → AC-11
- [x] Give a second guest a save by hand, then `GET /api/saved-stays` as the first guest → only the first guest's ids, and the second guest's document is untouched → AC-10

## Acceptance-criteria coverage

- AC-1 covered by the Home and Search heart steps
- AC-2 covered by the detail heart step and the copy check
- AC-3 covered by the restart, second device and sign out steps
- AC-4, AC-5 covered by the Trips steps and the network failure step
- AC-6 covered by the Trips unsave step
- AC-7 covered by the count step
- AC-8 covered by the two forced failure steps
- AC-9 covered by the double tap step and `toggle.test.ts`
- AC-10 covered by the 401 steps, the 422 steps and the second guest step
- AC-11 covered by the two orphan steps and `prune.test.ts`
- AC-12 covered by the repeat POST step and `store.test.ts`
- AC-13 covered by the dataset and bundle checks
- AC-14 covered by the PostHog step
- AC-15 covered by the lint, type check and jest steps

## Value sourcing coverage

- heart state on any screen: save on Home, open Search and Trips, confirm the same stay reads saved everywhere → AC-1, AC-4
- which stay a heart writes: save two different stays and confirm two documents with those `stayId` values → AC-12
- `stayIds` order: save A then B, confirm B leads Trips → AC-4
- `count`: matches the number of rows on Trips → AC-7
- `hasMore`: with more than 200 saves the newest line shows (skip below that) → AC-4
- `guestId`: sign in as another guest and confirm an empty Trips, then that only their documents exist → AC-10
- `savedAt`: repeat a save and confirm Trips keeps its original position → AC-12
- Trips row fields: compare each row with the same stay on Search → AC-4
- failure copy: the forced failure dialog text comes from `savedStaysCopy` → AC-8
- screen names: the PostHog events name the screen the heart was tapped on → AC-14

## Run 2026-10-29 (`/check verify saved stays`, route + dataset run)

Run against the dev server on web with a throwaway Clerk user, deleted at the end of the run. The private dataset is empty again.

- [x] `GET`, `POST` and `DELETE /api/saved-stays` with no token, and `GET` with a bogus bearer token → 401 with an empty body, nothing written → AC-10
- [x] Valid token and no body: `POST` → 422; `DELETE` without `stayId`, with a whitespace `stayId`, and with a 129 character `stayId` → 422 each → AC-10
- [x] `POST {"stayId":"stay-brownstone-garden-flat"}` twice → both 200 with the same `savedAt` and `count: 1`; `GET` returns that id, `count: 1`, `hasMore: false` → AC-12
- [x] A save for `stay-does-not-exist`, then `GET` → the id is absent, the count drops and the private document is gone → AC-11
- [x] `DELETE` the real save → 200, count back to 0; the private dataset then holds no `savedStay` document → AC-6
- [x] `production` reports `aclMode: public` and `saved-stays` reports `aclMode: private`; an anonymous query of the private dataset returns nothing and `production` holds zero `savedStay` documents → AC-13
- [x] The served web bundle was fetched and searched for `SANITY_API_WRITE_TOKEN`, `SANITY_AUTH_TOKEN`, the private dataset name and the token prefixes: none present → AC-13
- [x] With one save on the account, Profile's Saved count read `1`, matching `GET /api/saved-stays` → AC-7
- [ ] Not run here: the 30 write and 60 read limiter per ten minutes, the second device and second guest steps, the heart and Trips row steps (Sanity is blocked in this browser), the PostHog events and the screen reader pass.
