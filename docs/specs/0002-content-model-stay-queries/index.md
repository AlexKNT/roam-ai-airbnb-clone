# 0002. Content model and stay queries

**Date**: 2026-10-21
**Status**: In Progress

## Summary

This spec defines the four Sanity documents every screen reads (stay, host, cancellation policy, house rules) and the two typed queries the app uses to fetch them: one list for the feed and one detail read for a single stay. The app reads the public Sanity dataset directly with no token, because the content carries no personal data, and it gets typed results from hand written types that mirror each query's projection. Building this first means features 3, 4, 5, 6 and 7 all read the same shapes instead of each inventing one.


## Requirements

**User stories**:
- As a guest, I want the feed to list stays with photo, place, rating, price and amenities so that I can pick one to open.
- As a guest, I want one stay's page to show its own fields, host, cancellation line and times exactly as written, so that I can trust what I read.
- As an editor, I want to write a host, a cancellation policy and a house rule set once and reuse them across stays, so that a policy change is one edit.
- As the person building screens, I want typed queries with loading, empty, error and not found states, so that a screen never invents a shape or renders a hole.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):
- **AC-1**: The Studio schema contains exactly four document types, `stay`, `host`, `cancellationPolicy` and `houseRules`, with the fields in the data model below, and a stay that references all three others publishes without a validation error.
- **AC-2**: One query fetches a single stay by its slug and returns it with host, cancellation policy and house rules resolved in the same response, typed as `StayDetail`.
- **AC-3**: One query fetches the stay list, optionally filtered by stay type, ordered by rating descending then name, capped at 50 documents, typed as `StaySummary[]`.
- **AC-4**: Every value a query uses is passed as a GROQ parameter; no caller value is concatenated into a query string.
- **AC-5**: Image URLs are built from image references through the image URL builder, at a card width for the list and a larger width for the detail gallery, and each image carries its alt text.
- **AC-6**: The two hooks expose distinct states: `loading`, `error` with a retry, `ready`, plus `notFound` on the detail hook and an empty array plus `ready` on the list hook.
- **AC-7**: When a stay's referenced host, cancellation policy or house rules document no longer exists, the query still returns the stay, that part is `null`, and the rest of the stay is intact.
- **AC-8**: When an image reference has no resolvable asset, its URL field is `null` rather than a broken URL, so the UI can render a placeholder.
- **AC-9**: Publishing is blocked when any field listed as required in the data model is empty, including at least one gallery image with alt text and all three references.
- **AC-10**: `slug` is required, lowercase, kebab case, and unique across stays.
- **AC-11**: The app reads the dataset with no read token, bundles no Sanity secret, and requires no Clerk session to load content.
- **AC-12**: Draft and unpublished documents never appear in either query's results.
- **AC-13**: `npx expo lint` and `npx tsc --noEmit` pass.


## Decision

**Chosen option**: Option 1: Direct public read with the official client, typed projections

The app reads the public dataset directly through `@sanity/client`, builds image URLs with `@sanity/image-url`, and exposes two typed queries behind two small hooks with explicit loading, error, empty and not found states.


## Feature design

**Data model sketch**:

`stay`

| Field | Type | Rule |
|---|---|---|
| `_id` | string | Sanity generated |
| `name` | string | required |
| `slug` | slug | required, unique, lowercase kebab |
| `type` | string, one of `cabin` `beach` `city` `villa` | required |
| `summary` | text | required, one short paragraph, the text search embeds |
| `city` | string | required |
| `region` | string | required, for example `CA` |
| `country` | string | required, default `United States` |
| `pricePerNight` | number, integer | required, greater than 0, US dollars |
| `rating` | number | required, 0 to 5, one decimal |
| `reviewCount` | number, integer | required, 0 or more |
| `guests` | number, integer | required, 1 or more |
| `bedrooms` `beds` `baths` | number, integer | optional, 0 or more |
| `petsAllowed` | boolean | required, the value the pet filter reads |
| `amenities` | array of string from the fixed list below | required, at least 1 |
| `gallery` | array of `{ image, alt }` | required, at least 1, first is the cover |
| `checkInTime` | string | required, free text such as `3:00 PM` |
| `checkOutTime` | string | required, free text such as `11:00 AM` |
| `host` | reference to `host` | required |
| `cancellationPolicy` | reference to `cancellationPolicy` | required |
| `houseRules` | reference to `houseRules` | required |

Fixed amenity values, with the label each renders as:

`hot-tub` Hot Tub · `pet-friendly` Pet Friendly · `fast-wifi` Fast Wi Fi · `forest-view` Forest Views · `ocean-view` Ocean View · `mountain-view` Mountain Views · `pool` Pool · `fireplace` Fireplace · `beach-access` Beach Access

Fixed stay type values, with the chip label: `cabin` Cabins · `beach` Beach · `city` City · `villa` Villas.

`host`: `name` string required · `avatar` image with required alt · `superhost` boolean required, defaults false. No email, phone or address.

`cancellationPolicy`: `title` string required (for example "Free cancellation") · `summary` string required, one line · `body` plain multiline text required, the wording chat quotes.

`houseRules`: `name` string required · `rules` array of short strings required, at least 1.

Relationships: many stays to one host, many stays to one cancellation policy, many stays to one house rules set. All three references are required. Deleting a document that a stay points at is allowed, and it leaves that stay with a stale reference until someone edits the stay, which is the case AC-7 covers.

**State transitions**: none. Documents are drafts until published; Sanity owns that lifecycle, and the app only reads published documents.

**API surface** (function calls, not HTTP endpoints):

| Function | Inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|
| `getStays(options)` | `type?: StayType` as a GROQ param | `StaySummary[]`, rating descending then name, limit 50 | none, public read | network failure surfaces as a thrown error; no matches yields `[]` |
| `getStayBySlug(slug)` | `slug: string` as a GROQ param | `StayDetail` or `null` | none, public read | unknown slug yields `null`, not an error; network failure throws |
| `useStays(type?)` | same as `getStays` | `{ status: 'loading' \| 'error' \| 'ready', data: StaySummary[], retry }` | none | error state carries `retry` |
| `useStay(slug)` | same as `getStayBySlug` | `{ status: 'loading' \| 'error' \| 'notFound' \| 'ready', data: StayDetail \| null, retry }` | none | `notFound` is separate from `error` on purpose |

`StaySummary` carries `_id`, `slug`, `name`, `type`, `place`, `pricePerNight`, `rating`, `reviewCount`, `amenities` (labels), and `coverImage` (URL or null, with alt).
`StayDetail` carries everything in `StaySummary` plus `summary`, `guests`, `bedrooms`, `beds`, `baths`, `petsAllowed`, `gallery` (per image a URL or null, with alt), `checkInTime`, `checkOutTime`, `host`, `cancellationPolicy` and `houseRules`. The optional numbers are typed `number | null`, and the three references are typed `Host | null`, `CancellationPolicy | null`, `HouseRules | null` from the first query step, not patched in later.

Projection and formatting rules the build must not invent:

- `place` is formatted in the query as `city`, a comma, a space, `region` (for example `Lake Arrowhead, CA`). `country` is stored but never displayed.
- Amenity labels come from `src/constants/amenities.ts`, a `Record<Amenity, string>` typed over the fixed value list, so a value with no label cannot compile. An unknown value arriving from content renders nothing rather than a raw slug.
- Prices are formatted with `new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })`.
- Image URLs come from the image URL builder: card `width 800`, `height 600`; detail gallery `width 1200`, `height 900`; both with `fit('crop')` and `auto('format')`.
- Nullable images are decided at projection time: project `asset._ref` and call the builder only when it is `defined`. The builder throws on a malformed reference, so the helper catches and returns `null`.
- When a cover image resolves to `null`, the card keeps that stay's alt text and shows a placeholder. It never substitutes the second image, so the card shows the photo the editor chose as cover.
- `getStays` breaks a tie on equal rating and equal name with `_id asc`, and compares names case insensitively.
- `retry` resets the hook to `loading` and runs the fetch again. There is no automatic retry and no backoff, so a guest never sees a request loop. All user facing copy lives in `src/constants/copy.ts`.
- `useStay` does not fetch while its slug argument is empty or undefined, which is the window before `useLocalSearchParams` resolves; it stays in `loading`. Both hooks drop a response whose arguments have since changed.
- The 50 stay cap is a safety cap, not pagination. No signal is shown when it truncates; the list later gains pagination instead (see Follow-up).

**Value sourcing** (every value each action produces, computes, or displays names where it comes from):

| Action | Value produced / displayed | Source |
|---|---|---|
| List a stay card | title, place, price per night, rating, review count, amenity labels | `stay.name`; `place` built in the query as `city` + `, ` + `region`; `stay.pricePerNight`; `stay.rating`; `stay.reviewCount`; `amenities` mapped through `src/constants/amenities.ts` |
| List a stay card | cover photo and its alt text | `gallery[0].image` through the image URL builder at width 800 by 600; alt from `gallery[0].alt`, kept even when the URL is null |
| Open a stay | name, place, gallery, check in and out times | the `stay` document's own fields, quoted as written |
| Open a stay | host row | `host->{name, superhost, avatar}`, all null tolerant |
| Open a stay | cancellation row | `cancellationPolicy->{title, summary, body}` |
| Open a stay | house rules list | `houseRules->{name, rules}` |
| Detail price line | nightly price | `stay.pricePerNight`, formatted with `Intl.NumberFormat` in US dollars, whole units |
| Detail price line | total for a number of nights | **no source yet**: nights come from a date range, and booking is deferred. Feature 5 shows the nightly price only until booking decides dates (see Follow-up) |
| Empty feed | empty state | `useStays` returning `ready` with zero items |
| Unknown stay | not found state | `getStayBySlug` returning `null`, surfaced as `notFound` |
| Every request | project id, dataset | `app.config.js` writes `EXPO_PUBLIC_SANITY_PROJECT_ID` and `EXPO_PUBLIC_SANITY_DATASET` into `extra`, and the client reads them with `expo-constants`, the same way `src/config/posthog.ts` does |

**Key invariants**:
- Only published documents are returned, so a draft or a scheduled document never reaches a guest.
- `slug` is unique and lowercase kebab case, so a detail link resolves to exactly one stay.
- Every stay resolves to exactly one host, one cancellation policy and one house rules set at publish time.
- `pricePerNight` is a positive whole number of US dollars, so no screen formats cents.
- `rating` stays between 0 and 5 and `reviewCount` is never negative.
- No caller value is concatenated into a query string, so a slug can never become query syntax.
- No Sanity token is present in the app bundle.

**Security model**: content is public read; guests read everything, and nothing is written from the app. The app holds no Sanity secret: only `EXPO_PUBLIC_SANITY_PROJECT_ID` and `EXPO_PUBLIC_SANITY_DATASET` reach the bundle, and both are public identifiers. Writes happen in the Studio and, in feature 3, in a local seed script using `SANITY_API_WRITE_TOKEN`, which never leaves the machine. Documents hold no personal data of guests or hosts. Content reads need no Clerk session, and no Clerk identity is sent to Sanity.

**Configuration required**:
- `EXPO_PUBLIC_SANITY_PROJECT_ID`, `EXPO_PUBLIC_SANITY_DATASET`: already listed in `.env.example`, values still needed locally in `.env.local`. No new variable names are introduced. `app.config.js` maps them into `extra`, and `src/sanity/client.ts` reads them through `expo-constants`, mirroring `src/config/posthog.ts`. Missing values throw in `__DEV__` with the variable name, so a silent empty feed cannot happen in development. EAS builds do not read `.env.local`, so both values have to be set in the EAS environment before the first cloud build.
- `SANITY_API_READ_TOKEN`: not used by this feature. Nothing in the read path carries a token, and `.env.example` should drop it once this ships (see Follow-up).

**Critical test scenarios** (each maps to an acceptance criterion in ## Requirements):
- Happy path: publish one stay with a host, a cancellation policy and a house rules set, then `getStayBySlug` returns it with all three resolved, verifies **AC-1**, **AC-2**
- Happy path: `getStays({ type: 'cabin' })` returns only cabins, highest rating first, and `getStays()` returns cabins, beach, city and villa mixed by rating, verifies **AC-3**
- Failure case: delete the cancellation policy a stay points at, then the detail read still returns the stay with that field `null`, verifies **AC-7**
- Failure case: an image reference whose asset was removed yields `null` instead of a URL, verifies **AC-8**
- Failure case: an unknown slug yields `notFound`, and a device with no network yields `error` with a retry, verifies **AC-6**
- Failure case: a draft stay is published in the Studio but not published to the dataset, and neither query returns it, verifies **AC-12**
- Auth/permission: a fresh install with only the two public env values set loads content with no sign in and no token, verifies **AC-11**
- Auth/permission: a dataset that is not set to public read answers 403, and the hook reports it as a configuration problem rather than a generic network failure, verifies **AC-6**, **AC-11**
- Validation: saving a stay with an empty required field, a duplicate slug, or an uppercase slug is rejected by the Studio, verifies **AC-9**, **AC-10**

Hook state cannot be proven end to end until a screen exists, and there is no test runner yet. Until feature 4 wires the feed, prove the data layer itself: run both queries in the Studio Vision panel against real content, including the type filtered list, the unknown slug, and a stay whose policy was deleted.


## Build plan

Tracer Bullet: one thin thread from schema to a rendering hook has to work before the list, the edge states and the polish are added.

- [x] 1. Add `@sanity/client` and `@sanity/image-url` with `npx expo install`; create `src/sanity/client.ts` reading the two public variables through `expo-constants`, with the CDN on, no token, and a `__DEV__` throw when a value is missing, satisfies **AC-11**
- [x] 2. Write the four schema types in `studio/schemaTypes/` and register them in `studio/schemaTypes/index.ts`. Give `slug` `options.isUnique` plus a lowercase kebab regex validator, mark every required field with `Rule.required()`, and keep the fixed amenity and type value lists, satisfies **AC-1**, **AC-9**, **AC-10**
- [x] 3. Deploy the schema with `npx sanity schema deploy` and publish one stay with its host, cancellation policy and house rules, then confirm the thread start in the Vision panel, satisfies **AC-1**
- [x] 4. Write `src/sanity/types.ts` and `src/sanity/queries.ts` with `getStayBySlug`, projecting exactly the `StayDetail` shape including nullable numbers and nullable references, and passing the slug as a parameter, satisfies **AC-2**, **AC-4**, **AC-12**
- [x] 5. Write `src/sanity/image.ts` wrapping `@sanity/image-url` with the card and detail sizes, projecting `asset._ref` first and catching a malformed reference so the result is `null`, satisfies **AC-5**, **AC-8**
- [x] 6. Write the `useStay` hook with `loading`, `error`, `notFound` and `ready`, a `retry` that refetches, no fetch before the slug resolves, and a guard against stale responses, satisfies **AC-6**
- [x] 7. Add `getStays` with the optional type parameter, rating then name ordering, `_id` as the final tie break, and the cap of 50, satisfies **AC-3**, **AC-4**, **AC-12**
- [x] 8. Write the `useStays` hook mirroring the state contract, with an empty array as a normal ready result and the same stale response guard, satisfies **AC-6**
- [x] 9. Make both queries tolerate a deleted reference by projecting each reference as a nullable object and keeping the stay readable, satisfies **AC-7**
- [x] 10. Add the amenity label constant and the shared copy strings, then run `npx expo lint` and `npx tsc --noEmit`, satisfies **AC-13**


## Consequences

**Positive**:
- Features 3 to 7 read one typed content layer, so a screen adds rendering and state, not query plumbing.
- No secret exists in the content read path, and no session gate stands between a guest and a photo.
- The rating, price and amenity vocabularies are fixed in one place, so chips and filters cannot drift from the content.

**Negative / tradeoffs**:
- The dataset is public forever; anything published there is world readable, so private data needs its own home before feature 8.
- Hand written types can drift from a query projection, and nothing but review catches it; a type generation step would trade that risk for a build step.
- The 50 stay cap means the list needs pagination before the content grows past it.
- Missing references and images are tolerated rather than surfaced, so bad content can look like an ordinary empty section.

**Neutral**:
- Two new dependencies, both official Sanity packages.
- The schema must be deployed from `studio/` before content can be written, and redeployed after any schema change. The hosted Studio also needs `npm run deploy` before it shows the new types.
- The CDN can serve a stay about a minute after an edit, so an editor who publishes and immediately looks in the app may see the old version.
- The `summary` field exists now for feature 6's embeddings, even though nothing ranks on it yet.


## Follow-up

- [ ] Feature 5's price block shows a total for a number of nights, and nights need a source that booking has not decided yet. Until then the detail screen shows the nightly price alone.
- [ ] Confirm the `production` dataset is set to public read in the Sanity dashboard, otherwise these queries fail with a permission error.
- [ ] Delete `SANITY_API_READ_TOKEN` from `.env.example` once this ships, since no read path uses it and it only invites someone to wire a token into the bundle.
- [ ] Set both `EXPO_PUBLIC_SANITY_*` values in the EAS environment before the first cloud build; `.env.local` is not read there.
- [ ] Prove the hook states in feature 4. Until a screen consumes them, the data layer is verified in the Studio Vision panel only.
- [ ] Add pagination when content passes the 50 stay cap; the cap truncates without a signal today.
- [ ] Feature 4's card icon map in `src/components/ui/listing-card.tsx` keys on labels like `wifi` and `mountain`, while this spec uses `fast-wifi` and `forest-view`. Align the two when the card is wired, so icons do not silently fall back.
- [ ] Consider TanStack Query if a third screen repeats this fetch pattern; it was the runner up to the small shared hook.
- [ ] No `## Agent skills` section exists in `AGENTS.md`. If a Sanity community skill is installed, reference it there so later builds follow its conventions.