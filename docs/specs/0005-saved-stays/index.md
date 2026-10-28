# 0005. Saved stays

**Date**: 2026-10-28
**Status**: In Progress

## Summary

A guest can tap the heart on a stay and find it again in Trips, on any device, only for their own account. Saves live in a separate private Sanity dataset that the app reaches only through one API route, so guest data never touches the public content dataset. The app keeps one shared in memory list of saved stay ids, which powers every heart, the Trips screen and the Saved count the profile will read later.

## Requirements

**User stories**:
- As a signed in guest, I want to save a stay from its card or its detail screen so I can come back to it.
- As a guest, I want my saved stays on Trips, newest save first, so I can find them later.
- As a guest, I want to remove a save so the list stays honest.
- As a guest, I want my saves to be private to me and to follow me across launches and devices.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):
- **AC-1**: Tapping the heart on a listing card in the home feed or in search results saves that stay, and the heart shows the saved state on that tap.
- **AC-2**: Tapping the heart on the stay detail gallery saves or removes the save and shows no notice on success. The current "saved stays arrive later" notice is gone.
- **AC-3**: A save survives closing and reopening the app, and appears on a second device signed in as the same guest.
- **AC-4**: Trips lists the guest's saved stays, newest save first, each row showing the stay as Sanity holds it now, and tapping a row opens that stay.
- **AC-5**: Trips shows card shaped placeholders while it loads, an empty state with an icon, one line of copy and a button that opens Search, and an error state with a retry action when the read fails.
- **AC-6**: Unsaving from Trips removes the row at once, and the removal survives a relaunch.
- **AC-7**: The shared list exposes the Saved count, so the profile can read it with no extra request, and that count always agrees with the rows on Trips.
- **AC-8**: A failed write flips the heart back and shows the notice dialog with a plain failure message. Nothing is left half saved.
- **AC-9**: A second tap on the same stay while its write is still in flight does nothing.
- **AC-10**: Reads and writes only ever touch the signed in guest's own saves. A request with no valid Clerk session gets 401 and writes nothing, and no request can name another guest.
- **AC-11**: A stay deleted or unpublished in Sanity is left out of Trips, and its save is deleted.
- **AC-12**: Saving the same stay twice leaves exactly one save, and the original save time is kept.
- **AC-13**: No guest data lands in the public Sanity dataset or the app bundle. Saves are reachable only through the API route.
- **AC-14**: Saving and unsaving send a PostHog event with the action, the stay id and the screen name. A PostHog failure never blocks the toggle.
- **AC-15**: Lint and type check pass, and Jest tests cover the save module and the route's session check and body check.

## Decision

**Chosen option**: Option 1: a separate private Sanity dataset, reached only through API routes.

Saved stays are one document per save in a private Sanity dataset, keyed by a fixed document id built from the Clerk guest id and the Sanity stay id, read and written only by `src/app/api/saved-stays+api.ts` after verifying the Clerk session. The app holds the guest's saved stay ids in one provider mounted under Clerk, and every heart, Trips and the Saved count read from it.

## Feature design

**Data model sketch**:

Entity `savedStay`, in the private dataset only.

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | string | yes | `savedStay.<guestId>.<stayId>`, built by the route. Makes the save unique per guest and stay without a lookup. |
| `_type` | string | yes | `savedStay` |
| `guestId` | string | yes | Clerk user id, copied from the verified session |
| `stayId` | string | yes | Sanity stay `_id`, a plain value rather than a reference, because the stay lives in another dataset |
| `savedAt` | string (ISO datetime) | yes | Set on create only. The Trips sort key. |

Relationships: one guest has many saves, one stay has many saves. No reference fields, so no dereference and no dangling reference on either side.

**State transitions**:
`savedStay`: absent → saved (POST, create only) → absent (DELETE). A repeated POST on an existing save changes nothing.

**API surface**:
| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/saved-stays` | GET | none | `stayIds: string[]` (newest first), `count: number`, `hasMore: boolean` | Clerk bearer | 401 no session · 429 too many reads · 500 store failure |
| `/api/saved-stays` | POST | `stayId: string` (req) | `stayId`, `savedAt`, `count` | Clerk bearer | 401 · 422 missing or malformed `stayId` · 429 · 500 |
| `/api/saved-stays` | DELETE | `stayId: string` (req, query parameter) | `stayId`, `count` | Clerk bearer | 401 · 422 · 429 · 500 |

DELETE is idempotent and takes `stayId` as a query parameter rather than a JSON body, so no proxy can strip it, and it answers 200 whether or not a save existed. A repeated POST is create only: when the document already exists the route re-reads it and answers 200 with the original `savedAt` and the current `count`, never 500. `stayId` must be a non empty string of at most 128 characters with no whitespace, otherwise 422. GET returns at most the 200 newest saves and sets `hasMore` when the guest has more. `count` always means the saves the provider holds, so it can never exceed what Trips can show, and one static line of copy covers `hasMore`.

**Client behaviour**:
- The heart is its own pressable sitting inside the listing card, wired through a new `onToggleSave` prop that stops the card's own press, so a save never opens the stay.
- The in flight guard is a set of stay ids. A heart whose write is running ignores presses and does not dim or disable, so the list stays visually calm.
- A failed write uses the existing `Notice` dialog (`src/components/ui/notice.tsx`) with copy keys under `savedStays` in `src/constants/copy.ts`.
- Signed out is not an error state. The provider clears its set on sign out and never loads without a session, so every heart reads as unsaved.
- A failed load leaves hearts reading unsaved, which is safe because a repeat POST cannot lose a save, and Trips retries the load when it mounts.
- Removing a row on Trips changes provider state, not local screen state, so a later re-read cannot resurrect the row.

**Value sourcing**:

| Action | Value produced / displayed | Source |
|---|---|---|
| Any heart, on any screen | `saved` boolean | the shared provider's id set, seeded by GET and updated on each toggle |
| A heart press | which stay to write | the stay's Sanity `_id`, already held by the card or screen that renders it |
| A heart press | screen name for analytics | a `savedStayScreens` constant in `src/saved/screens.ts` (`home`, `search`, `detail`, `trips`) |
| Save and unsave events | event name and properties | `stay_saved` and `stay_unsaved` with `stay_id` and `screen`, sent through `posthogLogger` |
| Route, all verbs | `guestId` | `verifyToken` subject from the `authorization` header, never a request field |
| Route, all verbs | the token the client sends | `getToken()` from Clerk on each request, undefined meaning signed out |
| POST / DELETE | `stayId` | POST reads it from the JSON body, DELETE from the query string; both are the Sanity `_id` the app already holds from the stay queries |
| POST | document `_id` | built by the route from `guestId` and `stayId` |
| POST | `savedAt` | route clock, written only when the document does not exist |
| GET | `stayIds` order | `savedAt` descending, ordered in the private dataset query |
| GET | `count` | length of the guest's saves, from the same query |
| GET | `hasMore` | whether the guest's save count exceeds the read limit |
| Trips rows | stay name, place, price, rating, cover image | public dataset query for `_type == "stay" && _id in $ids`, using `ListingCard`'s row layout and the existing stay summary shape in `src/sanity/queries.ts` |
| Trips states | loading, empty, error, retry | three `ListingCard` placeholders while loading, then provider status plus copy keys under `savedStays` in `src/constants/copy.ts`, and one icon from the icon set |
| Profile Saved count (feature 9) | number | the same provider's `count` |
| Failure notice | title and message text | `savedStays.saveFailedTitle` and `savedStays.saveFailedMessage` in `src/constants/copy.ts`, shown through the `Notice` dialog |
| Rate limit state | per guest request times | in memory window keyed by `guestId`, from `src/saved/limits.ts`, with empty windows evicted so the map cannot grow |

**Key invariants**:
- A guest has at most one save per stay, enforced by the fixed document id.
- `guestId` is always the verified session subject. A client supplied guest id is never read.
- A save's `savedAt` never changes after it is created.
- A save never outlives its stay: the read prunes saves whose stay is missing from the public dataset, over the ids that read returned only. Pruning is best effort, is logged, and never fails the read.
- The Saved count equals the number of saves the provider holds, never a separately computed number, and never exceeds what Trips can show.
- With no session the provider holds no ids, so every heart reads unsaved.

**Security model**:
- Owner only: a guest reads and writes only their own saves. Ownership comes from the Clerk session, and no endpoint accepts a guest id.
- The private dataset is server only. Both its tokens live in API route environment variables and never behind `EXPO_PUBLIC_`.
- The public dataset keeps zero guest data, so no GROQ query or CDN read can leak a save.
- Rate limit both writes and reads per guest, because the route holds a write token: 60 reads and 30 writes per 10 minutes, constants in `src/saved/limits.ts`, the same shape as the policy chat limiter.
- No regulated data is involved beyond the fact that a save reveals a guest's interest in a stay. No payment or health data.

**Configuration required**:
- `SANITY_PRIVATE_DATASET`: name of the private dataset, server only.
- `SANITY_API_READ_TOKEN`: must be allowed to read the private dataset, in addition to its current use.
- `SANITY_API_WRITE_TOKEN`: must be allowed to write the private dataset.

**Critical test scenarios** (each maps to an acceptance criterion in ## Requirements):
- Happy path: save a stay from a card, relaunch, the heart is still on and Trips lists that stay first, verifies **AC-3**, **AC-4**.
- Happy path: unsave from Trips, the row disappears and stays gone after a relaunch, verifies **AC-6**.
- Failure case: the write fails, the heart flips back and the notice dialog shows, verifies **AC-8**.
- Failure case: two saves of the same stay leave one document with the original `savedAt`, verifies **AC-12**.
- Failure case: a save pointing at an unpublished stay is absent from Trips and the save is deleted, verifies **AC-11**.
- Auth/permission: GET, POST and DELETE without a valid bearer token each answer 401 and write nothing, verifies **AC-10**.
- Empty and error states: a guest with no saves sees the empty state with the Search button, and a failed read shows retry, verifies **AC-5**.

## Build plan

Built Tracer Bullet: the private store, the route, the shared provider and one working heart on the detail screen land first as a thin thread, then the rest of the surfaces thicken it, then the Trips screen and the cleanup.

1. [x] Private dataset and the save module, the whole schema change in one step: create the dataset (documented as a manual prerequisite, nothing else infers it), a server side Sanity client for it with its tokens, `src/saved/saved-stay-id.ts` (fixed id building and stay id validation), `src/saved/store.ts` (read, create only, delete, prune), `src/saved/limits.ts` (the read and write windows), `SANITY_PRIVATE_DATASET` added to `.env.example`, satisfies **AC-12**, **AC-13**.
2. [x] Route `src/app/api/saved-stays+api.ts` with GET, POST and DELETE: the Clerk check and the 401 answer copy the policy chat route's pattern, 422 on a bad body or a bad `stayId`, 429 from the windows, DELETE reading `stayId` from the query string, and a repeat POST answering 200 with the original `savedAt`. Jest tests for the session check, the body and query validation, the id building and the repeat POST path, satisfies **AC-10**, **AC-12**, **AC-13**, **AC-15**.
3. [x] Shared provider `src/saved/saved-stays-provider.tsx` and `src/saved/use-saved-stays.ts`, mounted under `ClerkProvider` in the root layout: loads once per session, clears on sign out and never loads without one, exposes `isSaved`, `toggle`, `count`, `hasMore` and `status`, flips optimistically, rolls back on failure with the `Notice` dialog, and holds a per stay in flight set. Jest tests for the rollback and the in flight guard, satisfies **AC-3**, **AC-7**, **AC-8**, **AC-9**.
4. [x] Stay detail heart: the gallery's `onSave` calls the toggle instead of the coming soon notice, the notice remains only for failures, and the obsolete save copy leaves `src/constants/copy.ts`, satisfies **AC-2**.
5. [x] Listing card heart on home and search: `ListingCard` gains `onToggleSave` as a pressable that stops the card's own press, wired through both screens including the row and hero layouts, satisfies **AC-1**.
6. [x] Trips: read the saved ids from the provider, query the public dataset for those stays, render `ListingCard` rows newest save first, open a stay on tap, retry the load when the screen mounts after a failure, and render three card placeholders, the empty state with the Search button, the error state with retry and the one line `hasMore` note, satisfies **AC-4**, **AC-5**, **AC-6**.
7. [x] Orphan pruning: the GET path drops and deletes, best effort and logged, only the returned saves whose stay is missing or unpublished, with Jest coverage for the prune decision and its failure being swallowed, satisfies **AC-11**.
8. [x] Analytics, accessibility, copy and checks: `stay_saved` and `stay_unsaved` events with `stay_id` and a `screen` value, an accessibility label and selected state on every heart, one `savedStays` copy entry per new string, then lint, type check and Jest, satisfies **AC-14**, **AC-15**.

## Consequences

**Positive**:
- Hearts and Trips work on real data, and the guest's saves follow them across devices.
- Guest data stays out of the public content dataset, so no public query or CDN read can leak a save.
- No new service, dependency or paid tier. The write token and the Sanity tooling already exist.
- One shared provider means the hearts, Trips and the future profile count cannot disagree.

**Negative / tradeoffs**:
- Enforcement lives entirely in the route. Sanity has no per user access rules, so a leaked management token reads every guest's saves.
- The private dataset has to be created and both tokens scoped before the feature works, which is a manual step.
- Trips makes two requests: ids from the private route, stays from the public dataset.
- The prune writes during a read. It is best effort and cannot fail the read, but a failure is swallowed, so an orphan can linger until the next successful read.
- The rate limiter is in memory, so it resets whenever the server instance restarts.
- The list is capped at the 200 newest saves. Beyond that a guest sees a "showing newest" line rather than paging.

**Neutral**:
- A new `src/saved/` area appears, with a server module and a client provider side by side.
- `ListingCard` already takes `saved`; it gains a handler rather than a new component.
- Trips stops being a placeholder and becomes the saved list. Real bookings will need a different home later.

## Follow-up

- [ ] Create the private dataset in Sanity and give `SANITY_API_READ_TOKEN` and `SANITY_API_WRITE_TOKEN` access to it. Nothing in this feature works until that exists.
- [ ] Record the private dataset and saved stays ownership in `AGENTS.md` when the change is synced.
- [ ] Account deletion leaves saves behind. Decide cleanup in the profile and account feature, likely through a Clerk `user.deleted` webhook.
- [ ] Revisit paging if guests ever keep more than 200 saves, and revisit the storage if a cross guest query (for example "most saved stays") is ever needed. A save older than the 200 newest is also never pruned, so orphans there wait for that work.

## Rationale

Reasoning, the options weighed and why the private dataset won: see [rationale.md](rationale.md).
